import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ApiKeys from "./pages/ApiKeys";
import PricingPage from "./pages/PricingPage";
import Upgrade from "./pages/Upgrade";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancelled from "./pages/SubscriptionCancelled";
import Docs from "./pages/Docs";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ApiDocs from "./pages/ApiDocs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Webhooks from "./pages/Webhooks";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/subscription-success" element={<SubscriptionSuccess />} />
          <Route path="/subscription-cancelled" element={<SubscriptionCancelled />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/api" element={<ApiDocs />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
