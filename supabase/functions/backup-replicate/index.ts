import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReplicationResult {
  service: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { backupId } = await req.json();

    if (!backupId) {
      return new Response(
        JSON.stringify({ error: 'backupId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting replication for backup: ${backupId}`);

    // Get backup info
    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .select('*, user_id')
      .eq('id', backupId)
      .single();

    if (backupError || !backup) {
      console.error('Backup not found:', backupError);
      return new Response(
        JSON.stringify({ error: 'Backup not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', backup.user_id)
      .single();

    if (settingsError || !settings) {
      console.log('No user settings found, skipping replication');
      return new Response(
        JSON.stringify({ message: 'No replication settings configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download backup file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('backups')
      .download(backup.storage_path);

    if (downloadError || !fileData) {
      console.error('Failed to download backup:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download backup file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: ReplicationResult[] = [];

    // Replicate to S3 if enabled
    if (settings.s3_enabled && settings.s3_bucket && settings.s3_access_key && settings.s3_secret_key) {
      console.log('Replicating to S3...');
      try {
        const s3Client = new S3Client({
          region: settings.s3_region || 'us-east-1',
          credentials: {
            accessKeyId: settings.s3_access_key,
            secretAccessKey: settings.s3_secret_key,
          },
        });

        const fileBuffer = await fileData.arrayBuffer();
        
        const command = new PutObjectCommand({
          Bucket: settings.s3_bucket,
          Key: `homesafe-backups/${backup.filename}`,
          Body: new Uint8Array(fileBuffer),
          ContentType: 'application/tar',
          Metadata: {
            'backup-id': backupId,
            'ha-version': backup.ha_version || 'unknown',
            'created-at': backup.created_at,
          },
        });

        await s3Client.send(command);
        console.log('✅ S3 replication successful');
        results.push({ service: 's3', success: true });
      } catch (s3Error) {
        console.error('S3 replication failed:', s3Error);
        results.push({ 
          service: 's3', 
          success: false, 
          error: (s3Error as Error).message 
        });
      }
    }

    // Replicate to Dropbox if enabled
    if (settings.dropbox_enabled && settings.dropbox_token) {
      console.log('Replicating to Dropbox...');
      try {
        const fileBuffer = await fileData.arrayBuffer();
        
        // Dropbox API v2 upload
        const dropboxResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.dropbox_token}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              path: `/HomeSafe-Backups/${backup.filename}`,
              mode: 'add',
              autorename: true,
              mute: false,
            }),
          },
          body: new Uint8Array(fileBuffer),
        });

        if (!dropboxResponse.ok) {
          const errorText = await dropboxResponse.text();
          throw new Error(`Dropbox API error: ${errorText}`);
        }

        console.log('✅ Dropbox replication successful');
        results.push({ service: 'dropbox', success: true });
      } catch (dropboxError) {
        console.error('Dropbox replication failed:', dropboxError);
        results.push({ 
          service: 'dropbox', 
          success: false, 
          error: (dropboxError as Error).message 
        });
      }
    }

    // Log replication results
    const successCount = results.filter(r => r.success).length;
    const message = `Replication completed: ${successCount}/${results.length} successful`;
    console.log(message);

    // Insert backup log
    await supabase.rpc('insert_backup_log', {
      _user_id: backup.user_id,
      _backup_id: backupId,
      _action: 'replicate',
      _status: successCount > 0 ? 'success' : 'failed',
      _message: message,
      _metadata: { results }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
