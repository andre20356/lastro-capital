import styles from "./PixSection.module.css";

const steps = [
  {
    num: "1",
    title: "Gere a cobrança",
    desc: "Crie uma cobrança em segundos com valor, vencimento e dados do cliente.",
  },
  {
    num: "2",
    title: "Cliente paga via PIX",
    desc: "O cliente recebe o QR Code ou chave PIX e paga pelo aplicativo do banco.",
  },
  {
    num: "3",
    title: "Confirmação instantânea",
    desc: "O pagamento é confirmado em segundos e o saldo atualizado em tempo real.",
  },
];

export default function PixSection() {
  return (
    <section className={styles.section} id="pix">
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.sectionLabel}>Pagamentos</div>
          <h2 className={styles.title}>
            Receba via PIX<br />instantaneamente
          </h2>
          <p className={styles.desc}>
            Integração nativa com o sistema PIX do Banco Central. Receba pagamentos em segundos,
            24 horas por dia, 7 dias por semana.
          </p>

          <div className={styles.steps}>
            {steps.map((s) => (
              <div key={s.num} className={styles.step}>
                <div className={styles.stepNum}>{s.num}</div>
                <div>
                  <h4 className={styles.stepTitle}>{s.title}</h4>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.pixIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="rgba(16,185,129,0.1)" />
              <path d="M21.5 32L32 21.5L42.5 32L32 42.5L21.5 32Z" fill="#10b981" />
            </svg>
          </div>
          <div className={styles.pixLabel}>PIX — Pagamento Instantâneo</div>
          <div className={styles.pixAmount}>R$ 1.500,00</div>
          <div className={styles.pixInstant}>Confirmado em 3 segundos</div>
          <button
            className={styles.pixBtn}
            onClick={() => alert("Simulação de pagamento PIX — em breve!")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Simular Pagamento
          </button>
        </div>
      </div>
    </section>
  );
}
