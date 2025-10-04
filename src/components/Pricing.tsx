import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

export function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const plans = [
    {
      name: t('pricing.free.name'),
      price: t('pricing.free.price'),
      period: t('pricing.free.period'),
      description: t('pricing.free.description'),
      priceId: null,
      features: t('pricing.free.features') as unknown as string[],
      cta: t('pricing.free.cta'),
      popular: false
    },
    {
      name: t('pricing.pro.name'),
      price: t('pricing.pro.price'),
      period: t('pricing.pro.period'),
      description: t('pricing.pro.description'),
      priceId: "price_1SEWmFFaQO1xoKujXe8dfKie",
      features: t('pricing.pro.features') as unknown as string[],
      cta: t('pricing.pro.cta'),
      popular: true
    },
    {
      name: t('pricing.business.name'),
      price: t('pricing.business.price'),
      period: t('pricing.business.period'),
      description: t('pricing.business.description'),
      priceId: "price_1SEWmQFaQO1xoKujv3sv0jmu",
      features: t('pricing.business.features') as unknown as string[],
      cta: t('pricing.business.cta'),
      popular: false
    }
  ];

  const handleSubscribe = async (priceId: string | null, planName: string) => {
    if (!priceId) {
      navigate("/auth");
      return;
    }

    if (!user) {
      toast({
        title: t('pricing.messages.authRequired'),
        description: t('pricing.messages.loginPrompt'),
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
        title: t('pricing.messages.error'),
        description: t('pricing.messages.errorMessage'),
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="py-24 px-4 gradient-subtle">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl mb-4">{t('pricing.title')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
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
                    {t('pricing.popular')}
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
                disabled={loading === plan.priceId}
              >
                {loading === plan.priceId ? t('pricing.processing') : plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
