const express = require('express');
const Stripe = require('stripe').default;

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

let stripeClient = null;
let publishableKey = null;
let cachedPrices = { pro: null, premium: null };
let cachedProducts = { pro: null, premium: null };

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('Stripe connector credentials not available');
  }

  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', 'stripe');
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings || !connectionSettings.settings.publishable || !connectionSettings.settings.secret) {
    throw new Error('Stripe connection not found');
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

async function getStripe() {
  if (!stripeClient) {
    const creds = await getCredentials();
    stripeClient = new Stripe(creds.secretKey);
    publishableKey = creds.publishableKey;
  }
  return { stripe: stripeClient, publishableKey };
}

const PLANS = {
  pro: {
    name: 'Plano Pro - Lastro Capital',
    description: 'Acesso completo ao sistema com suporte padrao',
    amount: 4990,
    metadataType: 'lastro_pro_subscription',
  },
  premium: {
    name: 'Plano Premium - Lastro Capital',
    description: 'Acesso completo com recursos avancados e suporte prioritario',
    amount: 9990,
    metadataType: 'lastro_premium_subscription',
  },
};

async function getOrCreatePlanPrice(planKey) {
  if (cachedPrices[planKey]) return cachedPrices[planKey];

  const plan = PLANS[planKey];
  if (!plan) throw new Error(`Invalid plan: ${planKey}`);

  const { stripe } = await getStripe();

  const products = await stripe.products.list({ limit: 100 });
  let product = products.data.find(p => p.metadata?.type === plan.metadataType);

  if (!product) {
    product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { type: plan.metadataType },
    });
  }
  cachedProducts[planKey] = product.id;

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
  let price = prices.data.find(p => p.unit_amount === plan.amount && p.recurring?.interval === 'month' && p.currency === 'brl');

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'brl',
      recurring: { interval: 'month' },
    });
  }
  cachedPrices[planKey] = price.id;
  return cachedPrices[planKey];
}

app.get('/api/stripe/config', async (req, res) => {
  try {
    const { publishableKey } = await getStripe();
    res.json({ publishableKey });
  } catch (error) {
    console.error('Error getting Stripe config:', error.message);
    res.status(500).json({ error: 'Stripe not configured' });
  }
});

app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { amount, currency, clientName, clientEmail, chargeDescription, chargeId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be positive' });
    }

    const { stripe } = await getStripe();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency || 'brl',
          product_data: {
            name: clientName ? `Cobranca - ${clientName}` : 'Cobranca Lastro Capital',
            description: chargeDescription || undefined,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: clientEmail || undefined,
      success_url: `${baseUrl}?payment=success&chargeId=${chargeId || ''}`,
      cancel_url: `${baseUrl}?payment=cancelled`,
      metadata: {
        chargeId: chargeId || '',
        clientName: clientName || '',
        source: 'lastro_capital',
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/stripe/create-payment-link', async (req, res) => {
  try {
    const { amount, currency, clientName, chargeDescription, chargeId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be positive' });
    }

    const { stripe } = await getStripe();

    const product = await stripe.products.create({
      name: clientName ? `Cobranca - ${clientName}` : 'Cobranca Lastro Capital',
      description: chargeDescription || undefined,
      metadata: { chargeId: chargeId || '', source: 'lastro_capital' },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency: currency || 'brl',
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { chargeId: chargeId || '', clientName: clientName || '', source: 'lastro_capital' },
    });

    res.json({ url: paymentLink.url, paymentLinkId: paymentLink.id });
  } catch (error) {
    console.error('Error creating payment link:', error.message);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

app.post('/api/stripe/create-subscription-checkout', async (req, res) => {
  try {
    const { email, userId, plan } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const validPlans = ['free', 'pro', 'premium'];
    const selectedPlan = validPlans.includes(plan) ? plan : 'free';

    const { stripe } = await getStripe();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;

    if (selectedPlan === 'free') {
      const proPriceId = await getOrCreatePlanPrice('pro');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: proPriceId, quantity: 1 }],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: 7,
          metadata: { userId: userId || '', source: 'lastro_capital', plan: 'free_trial' },
        },
        customer_email: email,
        success_url: `${baseUrl}?subscription=success`,
        cancel_url: `${baseUrl}?subscription=cancelled`,
        metadata: { userId: userId || '', source: 'lastro_capital', plan: 'free_trial' },
      });

      return res.json({ url: session.url, sessionId: session.id });
    }

    const priceId = await getOrCreatePlanPrice(selectedPlan);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        metadata: { userId: userId || '', source: 'lastro_capital', plan: selectedPlan },
      },
      customer_email: email,
      success_url: `${baseUrl}?subscription=success`,
      cancel_url: `${baseUrl}?subscription=cancelled`,
      metadata: { userId: userId || '', source: 'lastro_capital', plan: selectedPlan },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating subscription checkout:', error.message);
    res.status(500).json({ error: 'Failed to create subscription checkout' });
  }
});

app.post('/api/stripe/subscription-status', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { stripe } = await getStripe();

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return res.json({
        hasSubscription: false,
        status: null,
        currentPlan: null,
        customerId: null,
        subscriptionId: null,
        trialEnd: null,
        currentPeriodEnd: null,
      });
    }

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 5,
      status: 'all',
    });

    const activeSub = subscriptions.data.find(s => ['active', 'trialing'].includes(s.status))
      || subscriptions.data[0];

    if (!activeSub) {
      return res.json({
        hasSubscription: false,
        status: null,
        currentPlan: null,
        customerId: customer.id,
        subscriptionId: null,
        trialEnd: null,
        currentPeriodEnd: null,
      });
    }

    let currentPlan = activeSub.metadata?.plan || null;
    if (!currentPlan) {
      const priceAmount = activeSub.items?.data?.[0]?.price?.unit_amount;
      if (priceAmount === 4990) currentPlan = 'pro';
      else if (priceAmount === 9990) currentPlan = 'premium';
      else currentPlan = 'pro';
    }
    if (currentPlan === 'free_trial') {
      currentPlan = activeSub.status === 'trialing' ? 'free' : 'pro';
    }

    res.json({
      hasSubscription: true,
      status: activeSub.status,
      currentPlan,
      customerId: customer.id,
      subscriptionId: activeSub.id,
      trialEnd: activeSub.trial_end ? new Date(activeSub.trial_end * 1000).toISOString() : null,
      currentPeriodEnd: activeSub.current_period_end ? new Date(activeSub.current_period_end * 1000).toISOString() : null,
      cancelAtPeriodEnd: activeSub.cancel_at_period_end,
      cancelAt: activeSub.cancel_at ? new Date(activeSub.cancel_at * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error.message);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

app.post('/api/stripe/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const { stripe } = await getStripe();

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error.message);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

app.post('/api/stripe/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const { stripe } = await getStripe();

    let event;
    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Webhook signature verification failed' });
      }
    } else {
      event = JSON.parse(req.body.toString());
    }

    console.log(`Webhook event received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout completed:', session.id, 'Plan:', session.metadata?.plan);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log('Invoice paid:', invoice.id, 'Subscription:', invoice.subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed:', invoice.id, 'Subscription:', invoice.subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        console.log('Subscription deleted:', sub.id, 'Customer:', sub.customer);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        console.log('Subscription updated:', sub.id, 'Status:', sub.status);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.get('/api/stripe/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stripe API server running on port ${PORT}`);
});
