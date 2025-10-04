import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useReplication() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const triggerReplication = async (backupId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-replicate', {
        body: { backupId }
      });

      if (error) throw error;

      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      
      if (successCount > 0) {
        toast({
          title: "Replicação concluída",
          description: `${successCount} serviço(s) replicado(s) com sucesso`
        });
      } else {
        toast({
          title: "Replicação falhou",
          description: "Nenhum serviço foi replicado com sucesso",
          variant: "destructive"
        });
      }

      return data;
    } catch (error: any) {
      console.error('Replication error:', error);
      toast({
        title: "Erro na replicação",
        description: error.message || "Não foi possível replicar o backup",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { triggerReplication, loading };
}
