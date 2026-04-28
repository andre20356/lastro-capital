import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.copy}>&copy; 2025 Lastro Capital. Todos os direitos reservados.</span>
        <div className={styles.links}>
          <a href="#">Termos de Uso</a>
          <a href="#">Privacidade</a>
          <a href="#">Suporte</a>
        </div>
      </div>
    </footer>
  );
}
