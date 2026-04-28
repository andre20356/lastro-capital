import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Sistema com pagamento via PIX
        </div>

        <h1 className={styles.heading}>
          Invista com<br />
          <span className={styles.gradient}>inteligência</span> e<br />
          segurança
        </h1>

        <p className={styles.desc}>
          Plataforma completa de gestão de empréstimos e investimentos.
          Controle cobranças, receba via PIX e acompanhe seu capital em tempo real.
        </p>

        <div className={styles.cta}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => alert("Criar Conta — em breve!")}
          >
            Criar Conta Grátis
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => alert("Login — em breve!")}
          >
            Entrar na Plataforma
          </button>
        </div>

        <p className={styles.note}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Seus dados protegidos com criptografia de ponta
        </p>
      </div>

      <div className={styles.visual}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Saldo Total</span>
            <span className={styles.cardBadge}>Ao vivo</span>
          </div>
          <div className={styles.balance}>R$ 284.750</div>
          <div className={styles.change}>+12,4% este mês</div>

          <div className={styles.chart}>
            <svg viewBox="0 0 300 70" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,55 C30,50 50,45 80,35 C110,25 130,40 160,30 C190,20 210,10 240,15 C270,20 285,12 300,8 L300,70 L0,70 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M0,55 C30,50 50,45 80,35 C110,25 130,40 160,30 C190,20 210,10 240,15 C270,20 285,12 300,8"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className={styles.stats}>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Empréstimos</div>
              <div className={`${styles.statValue} ${styles.blue}`}>36</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Recebido</div>
              <div className={`${styles.statValue} ${styles.green}`}>R$ 42k</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Pendente</div>
              <div className={`${styles.statValue} ${styles.purple}`}>R$ 18k</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
