import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function SubscriptionCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center">
          <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
          <h1 className="text-3xl md:text-4xl mb-4">Subscrição Cancelada</h1>
          <p className="text-lg text-muted-foreground mb-8">
            A subscrição foi cancelada. Pode tentar novamente a qualquer momento.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate("/upgrade")}
              variant="hero"
            >
              Ver Planos
            </Button>
            <Button 
              size="lg"
              onClick={() => navigate("/dashboard")}
              variant="outline"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
