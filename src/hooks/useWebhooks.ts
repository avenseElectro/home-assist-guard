import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Webhook {
  id: string;
  user_id: string;
  name: string;
  webhook_url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  status: string;
  response_code: number | null;
  error_message: string | null;
  payload: any;
  created_at: string;
}

export interface CreateWebhookInput {
  name: string;
  webhook_url: string;
  events: string[];
  enabled?: boolean;
}

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configs' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Webhook[];
    },
  });
}

export function useWebhookLogs(webhookId: string) {
  return useQuery({
    queryKey: ['webhook-logs', webhookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs' as any)
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as unknown as WebhookLog[];
    },
    enabled: !!webhookId,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWebhookInput) => {
      const { data, error } = await supabase
        .from('webhook_configs' as any)
        .insert({
          name: input.name,
          webhook_url: input.webhook_url,
          events: input.events,
          enabled: input.enabled ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: "Webhook criado",
        description: "O webhook foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateWebhookInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('webhook_configs' as any)
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: "Webhook atualizado",
        description: "O webhook foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_configs' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: "Webhook eliminado",
        description: "O webhook foi eliminado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao eliminar webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { data, error } = await supabase.functions.invoke('webhook-test', {
        body: { webhook_id: webhookId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Teste enviado",
        description: "Foi enviado um ping de teste para o webhook.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao testar webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
