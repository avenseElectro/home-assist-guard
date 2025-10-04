import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Github, MessageSquare, FileQuestion } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string()
    .trim()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  subject: z.string()
    .trim()
    .min(1, "Assunto é obrigatório")
    .max(200, "Assunto deve ter no máximo 200 caracteres"),
  message: z.string()
    .trim()
    .min(1, "Mensagem é obrigatória")
    .max(2000, "Mensagem deve ter no máximo 2000 caracteres")
});

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      const validatedData = contactFormSchema.parse(formData);

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: validatedData
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contacto em breve. Verifique o seu email para confirmação.",
      });

      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao enviar mensagem",
          description: "Por favor, tente novamente ou contacte-nos por email diretamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-6">Entre em Contacto</h1>
              <p className="text-xl text-muted-foreground">
                Tem questões? Sugestões? Estamos aqui para ajudar!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Formulário */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Envie-nos uma Mensagem</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Nome
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="O seu nome"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Assunto
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Como podemos ajudar?"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Mensagem
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Descreva o seu pedido ou questão..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" variant="hero" disabled={isSubmitting}>
                    {isSubmitting ? "A enviar..." : "Enviar Mensagem"}
                  </Button>
                </form>
              </div>

              {/* Informações de Contacto */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Outras Formas de Contacto</h2>
                <div className="space-y-6">
                  {/* Email */}
                  <div className="p-6 rounded-lg bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Email de Suporte</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Para questões técnicas ou suporte
                        </p>
                        <a 
                          href="mailto:support@avensat.com"
                          className="text-primary hover:underline"
                        >
                          support@avensat.com
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="p-6 rounded-lg bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Github className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">GitHub Issues</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Reporte bugs ou sugira funcionalidades
                        </p>
                        <a 
                          href="https://github.com/avenseElectro/home-assist-guard/issues"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Abrir Issue →
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Documentação */}
                  <div className="p-6 rounded-lg bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileQuestion className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Documentação</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Consulte os nossos guias e FAQ
                        </p>
                        <a 
                          href="/docs"
                          className="text-primary hover:underline"
                        >
                          Ver Documentação →
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Comunidade */}
                  <div className="p-6 rounded-lg bg-card border border-border">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Comunidade</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Junte-se à comunidade Home Assistant
                        </p>
                        <a 
                          href="https://community.home-assistant.io"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Fórum HA →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tempo de Resposta */}
                <div className="mt-8 p-6 rounded-lg bg-muted">
                  <h3 className="font-semibold mb-3">⏱️ Tempo de Resposta</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li><strong>Free:</strong> Suporte comunitário (best effort)</li>
                    <li><strong>Pro:</strong> Resposta em 48h úteis</li>
                    <li><strong>Business:</strong> Resposta prioritária em 24h úteis</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FAQ Rápida */}
            <div className="mt-16 pt-16 border-t border-border">
              <h2 className="text-3xl font-bold mb-8 text-center">Perguntas Frequentes</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-2">Como obtenho suporte técnico?</h3>
                  <p className="text-sm text-muted-foreground">
                    Envie-nos um email para support@avensat.com ou abra um issue no GitHub. 
                    Clientes Pro e Business têm suporte prioritário.
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-2">Posso solicitar novas funcionalidades?</h3>
                  <p className="text-sm text-muted-foreground">
                    Sim! Adoramos receber feedback. Use o GitHub Issues ou contacte-nos diretamente 
                    com as suas sugestões.
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-2">Há suporte em português?</h3>
                  <p className="text-sm text-muted-foreground">
                    Sim! A nossa equipa responde em português, inglês e espanhol. 
                    A interface e documentação estão totalmente traduzidas.
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-card border border-border">
                  <h3 className="font-semibold mb-2">Como reporto um bug?</h3>
                  <p className="text-sm text-muted-foreground">
                    Abra um issue no GitHub com detalhes do problema, logs e passos para reproduzir. 
                    Quanto mais informação, mais rápido conseguimos ajudar!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
