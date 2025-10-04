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
      title: "Proteja o Seu Home Assistant com Backups Automáticos",
      subtitle: "Backups seguros, encriptados e automáticos para o seu sistema Home Assistant. Nunca perca dados importantes novamente.",
      cta: "Começar Gratuitamente",
      learnMore: "Saber Mais"
    },
    features: {
      title: "Tudo o Que Precisa para Proteger os Seus Dados",
      backup: {
        title: "Backups Automáticos",
        description: "Agende backups diários do seu Home Assistant sem qualquer intervenção manual"
      },
      restore: {
        title: "Restauro Rápido",
        description: "Restaure o seu sistema em minutos quando precisar"
      },
      security: {
        title: "Segurança Máxima",
        description: "Encriptação de ponta a ponta e armazenamento seguro na cloud"
      }
    },
    pricing: {
      title: "Escolha o Plano Ideal para Si",
      subtitle: "Comece gratuitamente, faça upgrade quando precisar",
      free: {
        name: "Free",
        price: "0",
        description: "Para começar",
        cta: "Começar"
      },
      pro: {
        name: "Pro",
        price: "4.99",
        description: "Para utilizadores avançados",
        cta: "Começar Teste Grátis"
      },
      business: {
        name: "Business",
        price: "14.99",
        description: "Para uso profissional",
        cta: "Contactar Vendas"
      },
      features: {
        backups: "backups",
        storage: "armazenamento",
        maxSize: "tamanho máx/backup",
        retention: "dias de retenção",
        support: "Suporte",
        supportCommunity: "Comunitário",
        supportEmail: "Email",
        supportPriority: "Prioritário",
        api: "Acesso API",
        webhooks: "Webhooks",
        analytics: "Analytics"
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
      title: "Protect Your Home Assistant with Automatic Backups",
      subtitle: "Secure, encrypted, and automated backups for your Home Assistant system. Never lose important data again.",
      cta: "Start Free",
      learnMore: "Learn More"
    },
    features: {
      title: "Everything You Need to Protect Your Data",
      backup: {
        title: "Automatic Backups",
        description: "Schedule daily backups of your Home Assistant without any manual intervention"
      },
      restore: {
        title: "Fast Restore",
        description: "Restore your system in minutes when you need it"
      },
      security: {
        title: "Maximum Security",
        description: "End-to-end encryption and secure cloud storage"
      }
    },
    pricing: {
      title: "Choose the Perfect Plan for You",
      subtitle: "Start free, upgrade when you need",
      free: {
        name: "Free",
        price: "0",
        description: "To get started",
        cta: "Get Started"
      },
      pro: {
        name: "Pro",
        price: "4.99",
        description: "For advanced users",
        cta: "Start Free Trial"
      },
      business: {
        name: "Business",
        price: "14.99",
        description: "For professional use",
        cta: "Contact Sales"
      },
      features: {
        backups: "backups",
        storage: "storage",
        maxSize: "max size/backup",
        retention: "retention days",
        support: "Support",
        supportCommunity: "Community",
        supportEmail: "Email",
        supportPriority: "Priority",
        api: "API Access",
        webhooks: "Webhooks",
        analytics: "Analytics"
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
