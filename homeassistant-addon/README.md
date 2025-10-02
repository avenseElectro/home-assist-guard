# HomeSafe Connector - Home Assistant Add-on

Automated backup integration between Home Assistant and HomeSafe Backup SaaS.

## Features

- ✅ Automated daily backups
- ✅ Manual backup trigger
- ✅ Secure API key authentication
- ✅ Configurable backup schedule
- ✅ Automatic cleanup of old local snapshots
- ✅ Detailed logging
- ✅ HTTPS/TLS secure uploads

## Installation

### Method 1: Add Custom Repository

1. Navigate to **Settings** → **Add-ons** → **Add-on Store** in Home Assistant
2. Click the **⋮** menu (top right) → **Repositories**
3. Add this repository URL: `https://github.com/YOUR_USERNAME/homesafe-addon`
4. Find **HomeSafe Connector** in the add-on store
5. Click **Install**

### Method 2: Manual Installation

1. Copy this entire folder to `/addons/homesafe_connector/` on your Home Assistant system
2. Restart Home Assistant
3. Navigate to **Settings** → **Add-ons** → **Add-on Store**
4. Refresh the page
5. Find **HomeSafe Connector** in the "Local add-ons" section
6. Click **Install**

## Configuration

Before starting the add-on, you need to configure it:

### 1. Get Your API Key

1. Go to your HomeSafe Backup dashboard: https://YOUR_APP_URL.lovable.app
2. Navigate to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Copy the generated key (it will only be shown once!)

### 2. Configure the Add-on

```yaml
api_url: "https://iagsshcczgmjdrdweirb.supabase.co/functions/v1"
api_key: "hsb_YOUR_API_KEY_HERE"
auto_backup_enabled: true
backup_time: "03:00"
retention_days: 7
```

#### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `api_url` | string | Yes | (provided) | HomeSafe Backup API endpoint |
| `api_key` | string | Yes | - | Your HomeSafe API key |
| `auto_backup_enabled` | bool | No | true | Enable automatic daily backups |
| `backup_time` | string | No | 03:00 | Time for daily backup (24h format) |
| `retention_days` | int | No | 7 | How long to keep backups (managed by SaaS plan) |

### 3. Start the Add-on

1. Go to the **Info** tab
2. Enable **Start on boot** (recommended)
3. Enable **Watchdog** (recommended)
4. Click **Start**

## Usage

### Automatic Backups

Once configured and started, the add-on will:
- Perform an initial backup immediately
- Run daily backups at the configured time
- Automatically cleanup old local snapshots (keeps last 3)
- Upload backups securely to HomeSafe cloud

### Manual Backup

To trigger a manual backup:
1. Go to **Settings** → **Add-ons** → **HomeSafe Connector**
2. Go to **Log** tab
3. Restart the add-on (this will trigger a backup on startup)

### Viewing Logs

Check the **Log** tab in the add-on interface to see:
- Backup progress
- Upload status
- File sizes
- Errors (if any)

Example log output:
```
[INFO] HomeSafe Connector started
[INFO] API URL: https://iagsshcczgmjdrdweirb.supabase.co/functions/v1
[INFO] Auto backup: True
[INFO] Backup time: 03:00
[INFO] Scheduled daily backup at 03:00
[INFO] Performing initial backup...
[INFO] === Starting backup workflow ===
[INFO] Creating new snapshot...
[INFO] Snapshot created successfully: 12345abc
[INFO] Downloading snapshot: 12345abc
[INFO] Snapshot size: 156.78 MB
[INFO] Uploading snapshot to HomeSafe: 12345abc
[INFO] Backup uploaded successfully! Backup ID: uuid-here
[INFO] === Backup workflow completed in 45.32s - SUCCESS ===
```

## Backup Management

Your backups are managed in the HomeSafe Backup dashboard:
- View all backups
- Download specific backups
- Delete old backups
- Monitor storage usage
- Check subscription limits

## Troubleshooting

### "API Key not configured"
- Make sure you've added your API key in the configuration
- Verify the key is correct (starts with `hsb_`)

### "Failed to create snapshot"
- Check Home Assistant has enough disk space
- Verify the add-on has `hassio_role: admin` permission

### "Upload failed: Invalid or revoked API key"
- Your API key may have been revoked
- Generate a new key in the HomeSafe dashboard
- Update the add-on configuration

### "Backup limit reached"
- You've reached your plan's backup limit
- Delete old backups or upgrade your plan
- Check your subscription in the HomeSafe dashboard

### "File too large"
- Your backup exceeds your plan's storage limit
- Consider upgrading to a higher plan
- Clean up unused data in Home Assistant

## Security

- API keys are stored securely in the add-on configuration
- All uploads use HTTPS/TLS encryption
- Backups are stored in secure Supabase Storage
- No credentials are logged or exposed

## Support

- **Documentation**: https://YOUR_APP_URL.lovable.app/docs
- **GitHub Issues**: https://github.com/YOUR_USERNAME/homesafe-addon/issues
- **HomeSafe Dashboard**: https://YOUR_APP_URL.lovable.app

## License

MIT License - See LICENSE file for details

## Credits

Developed for integration with HomeSafe Backup SaaS platform.
