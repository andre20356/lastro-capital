import styles from "./Navbar.module.css";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        <div className={styles.logoMark}>LC</div>
        <span className={styles.logoText}>Lastro Capital</span>
      </Link>

      <ul className={styles.links}>
        <li><a href="#funcionalidades">Funcionalidades</a></li>
        <li><a href="#pix">Pagamentos PIX</a></li>
        <li><a href="#contato">Contato</a></li>
      </ul>

      <div className={styles.actions}>
        <Link to="/login" className={`${styles.btn} ${styles.btnGhost}`}>
          Entrar
        </Link>

        <Link to="/cadastro" className={`${styles.btn} ${styles.btnPrimary}`}>
          Criar Conta
        </Link>
      </div>
    </nav>
  );
}