# HomeSafe Connector Documentation

## Overview

HomeSafe Connector is a Home Assistant add-on that provides automated backup integration with the HomeSafe Backup SaaS platform. It creates full snapshots of your Home Assistant installation and securely uploads them to the cloud.

## How It Works

1. **Snapshot Creation**: Uses Home Assistant Supervisor API to create full backups
2. **Secure Upload**: Transfers backup files to HomeSafe cloud storage via encrypted HTTPS
3. **Metadata Tracking**: Stores backup information including size, date, and Home Assistant version
4. **Automatic Scheduling**: Runs daily backups at your configured time
5. **Local Cleanup**: Automatically removes old local snapshots to save disk space

## Architecture

```
┌─────────────────────┐
│  Home Assistant     │
│   Supervisor API    │
└──────────┬──────────┘
           │
           │ Create Snapshot
           ▼
┌─────────────────────┐
│  HomeSafe Add-on    │
│  (Python Service)   │
└──────────┬──────────┘
           │
           │ Upload via API
           ▼
┌─────────────────────┐
│  HomeSafe Backend   │
│  (Supabase/Cloud)   │
└─────────────────────┘
```

## API Integration

### Authentication

The add-on uses API key authentication:
- Header: `x-api-key: hs_live_YOUR_KEY_HERE`
- Keys are generated in the HomeSafe dashboard at https://homesafe.lovable.app/api-keys
- Each key is tied to a user account and subscription

### Lovelace Card Configuration

The HomeSafe Lovelace card displays your backups directly in Home Assistant. To configure it:

1. **Generate an API Key**:
   - Go to https://homesafe.lovable.app/api-keys
   - Click "Generate New API Key"
   - Copy the key (it starts with `hs_live_`)

2. **Configure the Card**:
   ```yaml
   type: custom:homesafe-card
   title: "HomeSafe Backups"
   api_key: "hs_live_your_key_here"
   ```

3. **Reload Lovelace** or restart Home Assistant

The card will now display your latest backups and allow you to trigger manual backups.

### Endpoints Used

#### POST /backup-upload
Uploads a backup file to HomeSafe cloud.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers: `x-api-key`
- Body:
  - `file`: Backup file (.tar)
  - `ha_version`: Home Assistant version

**Response**:
```json
{
  "success": true,
  "backup": {
    "id": "uuid",
    "filename": "backup.tar",
    "size_bytes": 123456789,
    "created_at": "2025-10-02T10:00:00Z",
    "status": "completed"
  }
}
```

## Subscription Limits

The add-on respects your HomeSafe subscription limits:

| Plan | Max Backups | Max Backup Size | Total Storage | Retention |
|------|-------------|-----------------|---------------|-----------|
| Free | 3 | 1 GB per backup | 1 GB total | 7 days |
| Pro | 30 | 5 GB per backup | 10 GB total | 90 days |
| Business | 100 | 8 GB per backup | 100 GB total | 180 days |

## Scheduling

The add-on uses Python's `schedule` library for automated backups:

```python
schedule.every().day.at("03:00").do(connector.perform_backup)
```

You can customize the time in the add-on configuration.

## Error Handling

The add-on handles common errors gracefully:

- **Network failures**: Retries with timeout
- **Disk space issues**: Logs error and continues
- **API errors**: Detailed error messages in logs
- **Authentication failures**: Clear instructions to user

## Development

### Local Testing

To test the add-on locally:

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export API_URL="https://iagsshcczgmjdrdweirb.supabase.co/functions/v1"
export API_KEY="hsb_your_test_key"
export AUTO_BACKUP="false"
export SUPERVISOR_TOKEN="your_supervisor_token"

# Run
python src/main.py
```

### Building the Add-on

```bash
docker build -t homesafe-connector .
```

## Advanced Configuration

### Multi-Instance Support

HomeSafe supports managing backups from multiple Home Assistant instances in a single account. This is useful if you have:
- Multiple homes with separate Home Assistant installations
- Test/development and production environments
- Different properties or locations

#### Configuration

To identify your instance:

1. **Instance Name** (Optional): A human-readable name like "Casa Principal", "Casa de Praia", or "Test Environment"
2. **Instance ID** (Optional): A unique identifier like "ha-main", "ha-beach-house"

If you don't provide an `instance_id`, the add-on will auto-generate one based on your system's hostname.

**Example Configuration**:
```yaml
instance_name: "Casa Principal"
instance_id: "ha-casa-principal"
```

#### Dashboard Filtering

In the HomeSafe dashboard, you can:
- View all backups from all instances
- Filter backups by specific instance
- See instance name badges on each backup

#### Plan Limits

- **Free Plan**: 1 instance
- **Pro Plan**: Up to 2 instances
- **Business Plan**: Up to 5 instances

Each instance's backups count towards your total storage and backup count limits.

### Custom Backup Names

Backups are automatically named: `HomeSafe-YYYYMMDD-HHMMSS`

### Webhook Support (Future)

Future versions will support webhooks for:
- Backup completion notifications
- Failure alerts
- Storage warnings

## Best Practices

1. **Schedule Wisely**: Run backups during low-activity hours (e.g., 3 AM)
2. **Monitor Logs**: Regularly check logs for errors
3. **Keep API Keys Safe**: Never share your API keys
4. **Test Restores**: Periodically test restoring from backups
5. **Upgrade Plan**: Upgrade if you hit storage limits

## Troubleshooting Guide

### Add-on Won't Start

1. Check configuration syntax
2. Verify API key is valid
3. Check Home Assistant logs
4. Ensure Supervisor API is accessible

### Backups Not Uploading

1. Check internet connectivity
2. Verify API URL is correct
3. Check subscription limits
4. Review add-on logs for errors

### Large Backup Times

- Backup time depends on:
  - Home Assistant installation size
  - Number of integrations
  - Upload speed
  - Server location

Typical times:
- Small HA (< 500 MB): 2-5 minutes
- Medium HA (500 MB - 2 GB): 5-15 minutes
- Large HA (> 2 GB): 15-45 minutes

## Security Considerations

- API keys are not logged or displayed
- All traffic uses HTTPS/TLS 1.2+
- Backups are encrypted in transit
- Storage uses Supabase security features
- Row Level Security (RLS) protects user data

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Changelog

### Version 1.0.0 (2025-10-02)
- Initial release
- Automated daily backups
- API key authentication
- Configurable schedule
- Automatic local cleanup
- Detailed logging

## Support

For issues and questions:
- GitHub: https://github.com/avenseElectro/home-assist-guard
- Dashboard: https://homesafe.avensat.com
