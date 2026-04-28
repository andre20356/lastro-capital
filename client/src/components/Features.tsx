import styles from "./Features.module.css";

const features = [
  {
    color: "blue",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Dashboard em tempo real",
    desc: "Visualize seu capital, empréstimos ativos, cobranças pendentes e rendimentos em um painel intuitivo.",
  },
  {
    color: "green",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Gestão de cobranças",
    desc: "Crie e acompanhe cobranças automáticas com cálculo de juros e multas por atraso integrado.",
  },
  {
    color: "purple",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Gestão de clientes",
    desc: "Cadastre tomadores, acompanhe o histórico de cada cliente e gerencie documentos com facilidade.",
  },
  {
    color: "orange",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Relatórios detalhados",
    desc: "Gere relatórios de rentabilidade, inadimplência e fluxo de caixa para decisões mais assertivas.",
  },
  {
    color: "pink",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Segurança avançada",
    desc: "Autenticação segura, criptografia de dados e controle de acesso para proteger suas informações.",
  },
  {
    color: "teal",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.38 2 2 0 0 1 3.57 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.28z" />
      </svg>
    ),
    title: "Notificações automáticas",
    desc: "Envie lembretes de vencimento e confirmações de pagamento automaticamente para seus clientes.",
  },
];

export default function Features() {
  return (
    <section className={styles.section} id="funcionalidades">
      <div className={styles.inner}>
        <div className={styles.sectionLabel}>Funcionalidades</div>
        <h2 className={styles.title}>
          Tudo que você precisa<br />em uma plataforma
        </h2>
        <p className={styles.desc}>
          Gerencie seus empréstimos, acompanhe cobranças e receba pagamentos com praticidade e segurança.
        </p>

        <div className={styles.grid}>
          {features.map((f) => (
            <div key={f.title} className={styles.card}>
              <div className={`${styles.icon} ${styles[f.color as keyof typeof styles]}`}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
