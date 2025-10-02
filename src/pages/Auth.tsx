import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar autenticação com Lovable Cloud
    console.log(isLogin ? "Login" : "Sign up", { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-subtle">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-smooth">
          <ArrowLeft className="w-4 h-4" />
          Voltar à página inicial
        </Link>
        
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <div className="gradient-primary p-3 rounded-lg w-fit mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Bem-vindo de volta" : "Criar conta"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Entre na sua conta para aceder aos seus backups" 
                : "Comece a proteger o seu Home Assistant hoje"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {isLogin && (
                <div className="text-right">
                  <Link to="/reset-password" className="text-sm text-primary hover:underline">
                    Esqueceu a password?
                  </Link>
                </div>
              )}
              
              <Button type="submit" variant="hero" className="w-full" size="lg">
                {isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <div className="text-sm text-center text-muted-foreground">
              {isLogin ? "Ainda não tem conta?" : "Já tem conta?"}
              {" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Criar conta" : "Fazer login"}
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
