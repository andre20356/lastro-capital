import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <a href="#" className={styles.logo}>
        <div className={styles.logoMark}>LC</div>
        <span className={styles.logoText}>Lastro Capital</span>
      </a>

      <ul className={styles.links}>
        <li><a href="#funcionalidades">Funcionalidades</a></li>
        <li><a href="#pix">Pagamentos PIX</a></li>
        <li><a href="#contato">Contato</a></li>
      </ul>

      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => alert("Login — em breve!")}>
          Entrar
        </button>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => alert("Cadastro — em breve!")}>
          Criar Conta
        </button>
      </div>
    </nav>
  );
}
