import styles from "./CtaStrip.module.css";

export default function CtaStrip() {
  return (
    <section className={styles.section} id="contato">
      <h2 className={styles.title}>
        Pronto para <span className={styles.gradient}>começar?</span>
      </h2>
      <p className={styles.desc}>
        Crie sua conta gratuitamente e comece a gerenciar seus investimentos hoje mesmo.
      </p>
      <div className={styles.btns}>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => alert("Criar Conta — em breve!")}
        >
          Criar Conta Grátis
        </button>
        <button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={() => alert("Entre em contato!")}
        >
          Falar com a equipe
        </button>
      </div>
    </section>
  );
}
