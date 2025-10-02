#!/usr/bin/with-contenv bashio

echo "Starting HomeSafe Connector..."

# Get configuration
API_URL=$(bashio::config 'api_url')
API_KEY=$(bashio::config 'api_key')
AUTO_BACKUP=$(bashio::config 'auto_backup_enabled')
BACKUP_TIME=$(bashio::config 'backup_time')
RETENTION_DAYS=$(bashio::config 'retention_days')

# Export environment variables for Python app
export API_URL
export API_KEY
export AUTO_BACKUP
export BACKUP_TIME
export RETENTION_DAYS
export SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"

# Start the Python application
python3 /app/main.py
