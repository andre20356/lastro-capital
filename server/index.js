const express = require('express');
const Stripe = require('stripe').default;

const app = express();
const PORT = 3001;

app.use(express.json());

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

    res.json({
      url: session.url,
      sessionId: session.id,
    });
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
      metadata: {
        chargeId: chargeId || '',
        source: 'lastro_capital',
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100),
      currency: currency || 'brl',
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        chargeId: chargeId || '',
        clientName: clientName || '',
        source: 'lastro_capital',
      },
    });

    res.json({
      url: paymentLink.url,
      paymentLinkId: paymentLink.id,
    });
  } catch (error) {
    console.error('Error creating payment link:', error.message);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

app.get('/api/stripe/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stripe API server running on port ${PORT}`);
});
