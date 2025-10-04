import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  pt: {
    nav: {
      features: "Funcionalidades",
      pricing: "Preços",
      docs: "Documentação",
      about: "Sobre",
      contact: "Contacto",
      api: "API",
      dashboard: "Dashboard",
      login: "Entrar",
      register: "Registar",
      logout: "Sair"
    },
    hero: {
      title: "Backups Seguros para o Seu",
      titleHighlight: " Home Assistant",
      subtitle: "Crie, armazene e restaure backups da sua configuração com total segurança e facilidade.",
      cta: "Começar Grátis",
      viewPlans: "Ver Planos",
      badge1: "7 dias grátis",
      badge2: "Sem cartão de crédito",
      badge3: "Cancele quando quiser"
    },
    features: {
      title: "Tudo o que Precisa",
      subtitle: "Proteção completa para a sua configuração do Home Assistant",
      backup: {
        title: "Backups Automáticos",
        description: "Configure backups automáticos diários, semanais ou mensais da sua configuração do Home Assistant."
      },
      restore: {
        title: "Restauro Rápido",
        description: "Restaure a sua configuração em segundos com um simples clique. Mantém histórico completo de versões."
      },
      security: {
        title: "Segurança Total",
        description: "Dados encriptados em repouso e em trânsito. Armazenamento S3-compatible redundante e confiável."
      }
    },
    pricing: {
      title: "Planos Simples e Transparentes",
      subtitle: "Escolha o plano perfeito para as suas necessidades",
      popular: "Mais Popular",
      processing: "A processar...",
      free: {
        name: "Free",
        price: "0€",
        period: "para sempre",
        description: "Ideal para testar",
        cta: "Começar Grátis",
        features: [
          "1 backup por semana",
          "Retenção de 7 dias",
          "100 MB de armazenamento",
          "1 instância do Home Assistant",
          "Suporte por email"
        ]
      },
      pro: {
        name: "Pro",
        price: "5€",
        period: "/mês",
        description: "Para entusiastas",
        cta: "Subscrever Pro",
        features: [
          "Backups diários automáticos",
          "Retenção de 90 dias",
          "5 GB de armazenamento",
          "2 instâncias do Home Assistant",
          "Suporte prioritário",
          "Webhook notifications"
        ]
      },
      business: {
        name: "Business",
        price: "15€",
        period: "/mês",
        description: "Para profissionais",
        cta: "Subscrever Business",
        features: [
          "Backups ilimitados",
          "Retenção de 180 dias",
          "20 GB de armazenamento",
          "5 instâncias do Home Assistant",
          "Suporte dedicado 24/7",
          "API completa",
          "Relatórios e auditoria"
        ]
      },
      messages: {
        authRequired: "Autenticação Necessária",
        loginPrompt: "Por favor, faça login para subscrever um plano.",
        error: "Erro",
        errorMessage: "Não foi possível iniciar o processo de subscrição. Por favor, tente novamente."
      }
    },
    footer: {
      description: "Proteja o seu Home Assistant com backups automáticos seguros na cloud.",
      product: "Produto",
      features: "Funcionalidades",
      pricing: "Preços",
      docs: "Documentação",
      api: "API",
      company: "Empresa",
      about: "Sobre",
      contact: "Contacto",
      blog: "Blog",
      legal: "Legal",
      privacy: "Privacidade",
      terms: "Termos",
      rights: "Todos os direitos reservados."
    },
    contact: {
      title: "Entre em Contacto",
      subtitle: "Tem questões? Sugestões? Estamos aqui para ajudar!",
      form: {
        title: "Envie-nos uma Mensagem",
        name: "Nome",
        namePlaceholder: "O seu nome",
        email: "Email",
        emailPlaceholder: "seu@email.com",
        subject: "Assunto",
        subjectPlaceholder: "Como podemos ajudar?",
        message: "Mensagem",
        messagePlaceholder: "Descreva o seu pedido ou questão...",
        submit: "Enviar Mensagem",
        submitting: "A enviar..."
      },
      other: {
        title: "Outras Formas de Contacto",
        email: {
          title: "Email de Suporte",
          description: "Para questões técnicas ou suporte"
        },
        github: {
          title: "GitHub Issues",
          description: "Reporte bugs ou sugira funcionalidades"
        },
        docs: {
          title: "Documentação",
          description: "Consulte os nossos guias e FAQ"
        },
        community: {
          title: "Comunidade",
          description: "Junte-se à comunidade Home Assistant"
        }
      },
      responseTime: {
        title: "Tempo de Resposta",
        free: "Suporte comunitário (best effort)",
        pro: "Resposta em 48h úteis",
        business: "Resposta prioritária em 24h úteis"
      }
    }
  },
  en: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      docs: "Documentation",
      about: "About",
      contact: "Contact",
      api: "API",
      dashboard: "Dashboard",
      login: "Login",
      register: "Sign Up",
      logout: "Logout"
    },
    hero: {
      title: "Secure Backups for Your",
      titleHighlight: " Home Assistant",
      subtitle: "Create, store and restore your configuration backups with complete security and ease.",
      cta: "Start Free",
      viewPlans: "View Plans",
      badge1: "7 days free",
      badge2: "No credit card",
      badge3: "Cancel anytime"
    },
    features: {
      title: "Everything You Need",
      subtitle: "Complete protection for your Home Assistant configuration",
      backup: {
        title: "Automatic Backups",
        description: "Configure automatic daily, weekly or monthly backups of your Home Assistant configuration."
      },
      restore: {
        title: "Fast Restore",
        description: "Restore your configuration in seconds with a simple click. Maintains complete version history."
      },
      security: {
        title: "Total Security",
        description: "Data encrypted at rest and in transit. Redundant and reliable S3-compatible storage."
      }
    },
    pricing: {
      title: "Simple and Transparent Plans",
      subtitle: "Choose the perfect plan for your needs",
      popular: "Most Popular",
      processing: "Processing...",
      free: {
        name: "Free",
        price: "€0",
        period: "forever",
        description: "Ideal for testing",
        cta: "Start Free",
        features: [
          "1 backup per week",
          "7 days retention",
          "100 MB storage",
          "1 Home Assistant instance",
          "Email support"
        ]
      },
      pro: {
        name: "Pro",
        price: "€5",
        period: "/month",
        description: "For enthusiasts",
        cta: "Subscribe Pro",
        features: [
          "Automatic daily backups",
          "90 days retention",
          "5 GB storage",
          "2 Home Assistant instances",
          "Priority support",
          "Webhook notifications"
        ]
      },
      business: {
        name: "Business",
        price: "€15",
        period: "/month",
        description: "For professionals",
        cta: "Subscribe Business",
        features: [
          "Unlimited backups",
          "180 days retention",
          "20 GB storage",
          "5 Home Assistant instances",
          "24/7 dedicated support",
          "Full API access",
          "Reports and auditing"
        ]
      },
      messages: {
        authRequired: "Authentication Required",
        loginPrompt: "Please login to subscribe to a plan.",
        error: "Error",
        errorMessage: "Could not start the subscription process. Please try again."
      }
    },
    footer: {
      description: "Protect your Home Assistant with secure automatic cloud backups.",
      product: "Product",
      features: "Features",
      pricing: "Pricing",
      docs: "Documentation",
      api: "API",
      company: "Company",
      about: "About",
      contact: "Contact",
      blog: "Blog",
      legal: "Legal",
      privacy: "Privacy",
      terms: "Terms",
      rights: "All rights reserved."
    },
    contact: {
      title: "Get in Touch",
      subtitle: "Have questions? Suggestions? We're here to help!",
      form: {
        title: "Send us a Message",
        name: "Name",
        namePlaceholder: "Your name",
        email: "Email",
        emailPlaceholder: "your@email.com",
        subject: "Subject",
        subjectPlaceholder: "How can we help?",
        message: "Message",
        messagePlaceholder: "Describe your request or question...",
        submit: "Send Message",
        submitting: "Sending..."
      },
      other: {
        title: "Other Ways to Contact",
        email: {
          title: "Support Email",
          description: "For technical questions or support"
        },
        github: {
          title: "GitHub Issues",
          description: "Report bugs or suggest features"
        },
        docs: {
          title: "Documentation",
          description: "Check our guides and FAQ"
        },
        community: {
          title: "Community",
          description: "Join the Home Assistant community"
        }
      },
      responseTime: {
        title: "Response Time",
        free: "Community support (best effort)",
        pro: "Response in 48h business days",
        business: "Priority response in 24h business days"
      }
    }
  }
};
