#!/usr/bin/env python3
import os
import time
import logging
import schedule
import requests
from datetime import datetime
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('homesafe-connector')

# Configuration from environment variables
API_URL = os.getenv('API_URL', 'https://iagsshcczgmjdrdweirb.supabase.co/functions/v1')
API_KEY = os.getenv('API_KEY', '')
AUTO_BACKUP = os.getenv('AUTO_BACKUP', 'true').lower() == 'true'
BACKUP_TIME = os.getenv('BACKUP_TIME', '03:00')
SUPERVISOR_TOKEN = os.getenv('SUPERVISOR_TOKEN', '')
SUPERVISOR_URL = 'http://supervisor'

class HomeSafeConnector:
    def __init__(self):
        self.api_url = API_URL
        self.api_key = API_KEY
        self.supervisor_token = SUPERVISOR_TOKEN
        self.supervisor_url = SUPERVISOR_URL
        
        if not self.api_key:
            logger.error("API Key not configured! Please configure the add-on.")
            exit(1)
    
    def _get_supervisor_headers(self):
        """Get headers for Supervisor API requests"""
        return {
            'Authorization': f'Bearer {self.supervisor_token}',
            'Content-Type': 'application/json'
        }
    
    def create_snapshot(self):
        """Create a new snapshot using Home Assistant Supervisor API"""
        logger.info("Creating new snapshot...")
        
        try:
            # Payload with optional parameters for full backup
            payload = {
                'name': f'HomeSafe-{datetime.now().strftime("%Y%m%d-%H%M%S")}',
                'compressed': True
            }
            
            logger.info(f"Sending backup request to: {self.supervisor_url}/backups/new/full")
            logger.info(f"Payload: {payload}")
            logger.info(f"Token present: {bool(self.supervisor_token)}")
            
            response = requests.post(
                f'{self.supervisor_url}/backups/new/full',
                headers=self._get_supervisor_headers(),
                json=payload,
                timeout=600
            )
            
            # Log detailed error info
            if not response.ok:
                logger.error(f"Snapshot creation failed with status {response.status_code}")
                logger.error(f"Response headers: {dict(response.headers)}")
                logger.error(f"Response body: {response.text}")
            
            response.raise_for_status()
            
            snapshot_data = response.json()
            logger.info(f"Snapshot API response: {snapshot_data}")
            
            # API returns slug directly in response (not nested in 'data')
            snapshot_slug = snapshot_data.get('slug') or snapshot_data.get('data', {}).get('slug')
            
            if not snapshot_slug:
                logger.error(f"Failed to get snapshot slug from response: {snapshot_data}")
                return None
            
            logger.info(f"Snapshot created successfully: {snapshot_slug}")
            return snapshot_slug
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create snapshot: {e}")
            logger.error(f"Exception type: {type(e).__name__}")
            return None
    
    def get_snapshot_info(self, snapshot_slug):
        """Get information about a specific snapshot"""
        try:
            response = requests.get(
                f'{self.supervisor_url}/backups/{snapshot_slug}/info',
                headers=self._get_supervisor_headers(),
                timeout=30
            )
            response.raise_for_status()
            return response.json().get('data', {})
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get snapshot info: {e}")
            return None
    
    def download_snapshot(self, snapshot_slug):
        """Download snapshot file from Supervisor (returns stream)"""
        logger.info(f"Downloading snapshot: {snapshot_slug}")
        
        try:
            response = requests.get(
                f'{self.supervisor_url}/backups/{snapshot_slug}/download',
                headers=self._get_supervisor_headers(),
                stream=True,
                timeout=300
            )
            response.raise_for_status()
            return response  # Return stream response, not content
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download snapshot: {e}")
            return None
    
    def upload_to_homesafe(self, snapshot_slug, snapshot_stream):
        """Upload snapshot to HomeSafe Backup SaaS (true streaming)"""
        logger.info(f"Uploading snapshot to HomeSafe: {snapshot_slug}")
        
        # Get snapshot info for metadata
        snapshot_info = self.get_snapshot_info(snapshot_slug)
        ha_version = snapshot_info.get('homeassistant', 'unknown') if snapshot_info else 'unknown'
        
        try:
            # Stream directly as raw body (no multipart, no buffering)
            headers = {
                'x-api-key': self.api_key,
                'x-ha-version': ha_version,
                'Content-Type': 'application/x-tar'
            }
            
            # Upload with true streaming
            response = requests.put(
                f'{self.api_url}/backup-upload',
                data=snapshot_stream.raw,
                headers=headers,
                timeout=1800
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get('success'):
                logger.info(f"Backup uploaded successfully! Backup ID: {result.get('backup', {}).get('id')}")
                return True
            else:
                logger.error(f"Upload failed: {result.get('error')}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload to HomeSafe: {e}")
            return False
    
    def perform_backup(self):
        """Complete backup workflow: create, download, and upload"""
        logger.info("=== Starting backup workflow ===")
        start_time = time.time()
        
        # Step 1: Create snapshot
        snapshot_slug = self.create_snapshot()
        if not snapshot_slug:
            logger.error("Backup workflow failed: Could not create snapshot")
            return False
        
        # Step 2: Download snapshot (returns stream)
        snapshot_stream = self.download_snapshot(snapshot_slug)
        if not snapshot_stream:
            logger.error("Backup workflow failed: Could not download snapshot")
            return False
        
        logger.info("Snapshot downloaded (streaming mode - minimal memory usage)")
        
        # Step 3: Upload to HomeSafe (streaming)
        success = self.upload_to_homesafe(snapshot_slug, snapshot_stream)
        
        elapsed_time = time.time() - start_time
        logger.info(f"=== Backup workflow completed in {elapsed_time:.2f}s - {'SUCCESS' if success else 'FAILED'} ===")
        
        return success
    
    def cleanup_old_snapshots(self):
        """Remove old local snapshots to save space"""
        try:
            response = requests.get(
                f'{self.supervisor_url}/backups',
                headers=self._get_supervisor_headers(),
                timeout=30
            )
            response.raise_for_status()
            
            snapshots = response.json().get('data', {}).get('snapshots', [])
            
            # Keep only the 3 most recent snapshots locally
            if len(snapshots) > 3:
                snapshots_to_delete = sorted(
                    snapshots,
                    key=lambda x: x.get('date', ''),
                    reverse=True
                )[3:]
                
                for snapshot in snapshots_to_delete:
                    slug = snapshot.get('slug')
                    logger.info(f"Deleting old local snapshot: {slug}")
                    requests.post(
                        f'{self.supervisor_url}/backups/{slug}/remove',
                        headers=self._get_supervisor_headers(),
                        timeout=30
                    )
        except Exception as e:
            logger.warning(f"Failed to cleanup old snapshots: {e}")

def main():
    logger.info("HomeSafe Connector started")
    logger.info(f"API URL: {API_URL}")
    logger.info(f"Auto backup: {AUTO_BACKUP}")
    logger.info(f"Backup time: {BACKUP_TIME}")
    
    connector = HomeSafeConnector()
    
    # Schedule automatic backups if enabled
    if AUTO_BACKUP:
        schedule.every().day.at(BACKUP_TIME).do(connector.perform_backup)
        logger.info(f"Scheduled daily backup at {BACKUP_TIME}")
    
    # Perform initial backup on startup
    logger.info("Performing initial backup...")
    connector.perform_backup()
    
    # Cleanup old local snapshots
    connector.cleanup_old_snapshots()
    
    # Main loop
    logger.info("Entering main loop...")
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == '__main__':
    main()
