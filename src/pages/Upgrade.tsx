import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "0€",
    period: "para sempre",
    description: "Ideal para testar",
    priceId: null,
    features: [
      "1 backup por semana",
      "Retenção de 7 dias",
      "100 MB de armazenamento",
      "1 instância do Home Assistant",
      "Suporte por email"
    ],
    popular: false
  },
  {
    name: "Pro",
    price: "5€",
    period: "/mês",
    description: "Para entusiastas",
    priceId: "price_1SEXIeFaQO1xoKuji0E6sEEK",
    features: [
      "Backups diários automáticos",
      "Retenção de 90 dias",
      "5 GB de armazenamento",
      "2 instâncias do Home Assistant",
      "Suporte prioritário",
      "Webhook notifications"
    ],
    popular: true
  },
  {
    name: "Business",
    price: "15€",
    period: "/mês",
    description: "Para profissionais",
    priceId: "price_1SEXJ5FaQO1xoKujo8uBFZTj",
    features: [
      "Backups ilimitados",
      "Retenção de 180 dias",
      "20 GB de armazenamento",
      "5 instâncias do Home Assistant",
      "Suporte dedicado 24/7",
      "API completa",
      "Relatórios e auditoria"
    ],
    popular: false
  }
];

export default function Upgrade() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string | null, planName: string) => {
    if (!priceId) return;

    if (!user) {
      toast({
        title: "Autenticação Necessária",
        description: "Por favor, faça login para subscrever um plano.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(priceId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o processo de subscrição. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <section className="py-24 px-4 gradient-subtle">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl mb-4">Escolha o Seu Plano</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Faça upgrade para desbloquear mais funcionalidades
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <div 
                  key={index}
                  className={`bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-smooth ${
                    plan.popular ? 'border-2 border-primary relative' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                        Mais Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-2xl mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.popular ? "hero" : "outline"}
                    className="w-full"
                    size="lg"
                    onClick={() => handleSubscribe(plan.priceId, plan.name)}
                    disabled={!plan.priceId || loading === plan.priceId}
                  >
                    {loading === plan.priceId ? "A processar..." : 
                     !plan.priceId ? "Plano Atual" : `Subscrever ${plan.name}`}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
