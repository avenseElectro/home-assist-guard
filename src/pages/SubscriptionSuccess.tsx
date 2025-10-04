import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-accent mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl mb-4">Subscrição Confirmada!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            A sua subscrição foi ativada com sucesso. Será redirecionado para o dashboard em breve.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/dashboard")}
            variant="hero"
          >
            Ir para o Dashboard
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
