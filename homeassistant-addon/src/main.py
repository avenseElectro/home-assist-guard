#!/usr/bin/env python3
import os
import time
import logging
import schedule
import requests
from datetime import datetime, timezone
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

# Storage provider configuration
STORAGE_PROVIDER = os.getenv('STORAGE_PROVIDER', 'supabase').lower()
BASEROW_API_URL = os.getenv('BASEROW_API_URL', '')
BASEROW_API_TOKEN = os.getenv('BASEROW_API_TOKEN', '')
BASEROW_DATABASE_ID = os.getenv('BASEROW_DATABASE_ID', '')
BASEROW_TABLE_ID = os.getenv('BASEROW_TABLE_ID', '')

class HomeSafeConnector:
    def __init__(self):
        self.api_url = API_URL
        self.api_key = API_KEY
        self.supervisor_token = SUPERVISOR_TOKEN
        self.supervisor_url = SUPERVISOR_URL
        
        # TEMPORARY: Hardcoded for testing Baserow integration
        self.storage_provider = 'baserow'
        self.baserow_api_url = 'https://baserow.avensat.com'
        self.baserow_api_token = 'Gkc7lS02kjPGrljfj7cUuV7oHFK4wIwT'
        self.baserow_database_id = '246'
        self.baserow_table_id = '708'
        
        if not self.api_key:
            logger.error("API Key not configured! Please configure the add-on.")
            exit(1)
        
        if self.storage_provider == 'baserow':
            if not self.baserow_api_url or not self.baserow_api_token:
                logger.error("Baserow configuration incomplete!")
                exit(1)
            logger.info(f"Using Baserow storage: {self.baserow_api_url}")
    
    def _get_supervisor_headers(self):
        """Get headers for Supervisor API requests"""
        return {
            'Authorization': f'Bearer {self.supervisor_token}',
            'Content-Type': 'application/json'
        }
    
    def create_snapshot(self):
        """Create a new snapshot using Home Assistant Supervisor API with hybrid fallback"""
        logger.info("Creating new snapshot...")
        
        try:
            # Capture start time for fallback method
            backup_start_time = datetime.now(timezone.utc)
            
            # Payload with optional parameters for full backup
            payload = {
                'name': f'HomeSafe-{backup_start_time.strftime("%Y%m%d-%H%M%S")}',
                'compressed': True
            }
            expected_name = payload['name']  # Save expected name for fallback
            
            logger.info(f"Starting backup job at: {self.supervisor_url}/backups/new/full")
            
            # Start the backup job (may take several minutes for large systems)
            response = requests.post(
                f'{self.supervisor_url}/backups/new/full',
                headers=self._get_supervisor_headers(),
                json=payload,
                timeout=900  # 15 minutes timeout for large backups
            )
            
            if not response.ok:
                logger.error(f"Failed to start backup job with status {response.status_code}")
                logger.error(f"Response: {response.text}")
                response.raise_for_status()
            
            job_data = response.json()
            logger.info(f"Backup job response: {job_data}")
            
            # Extract job_id from response
            job_id = None
            if job_data.get('result') == 'ok':
                job_id = job_data.get('data', {}).get('job_id')
            
            if not job_id:
                # Fallback: try to extract slug directly (older API versions)
                snapshot_slug = job_data.get('data', {}).get('slug')
                if snapshot_slug:
                    logger.info(f"Snapshot created successfully (synchronous): {snapshot_slug}")
                    return snapshot_slug
                else:
                    logger.error(f"Failed to get job_id or slug from response: {job_data}")
                    return None
            
            logger.info(f"Backup job started with ID: {job_id}")
            logger.info("Waiting for backup to complete (this may take several minutes)...")
            
            # Poll for job completion with fallback detection
            max_async_wait = 120  # 2 minutes for async method
            poll_interval = 5  # Check every 5 seconds
            elapsed = 0
            unknown_state_time = 0  # Track time in "unknown" state
            
            while elapsed < max_async_wait:
                time.sleep(poll_interval)
                elapsed += poll_interval
                
                try:
                    # Check job status
                    job_url = f"{self.supervisor_url}/jobs/{job_id}"
                    job_response = requests.get(
                        job_url,
                        headers=self._get_supervisor_headers(),
                        timeout=10
                    )
                    
                    if job_response.ok:
                        job_status = job_response.json()
                        
                        if job_status.get('result') == 'ok':
                            job_info = job_status.get('data', {})
                            state = job_info.get('state', 'unknown')
                            progress = job_info.get('progress', 0)
                            
                            logger.info(f"Job state: {state}, progress: {progress}% (waited {elapsed}s)")
                            
                            if state == 'completed':
                                # Job completed - get the backup slug
                                reference = job_info.get('reference')
                                if reference:
                                    logger.info(f"Snapshot created successfully: {reference}")
                                    return reference
                                else:
                                    logger.error(f"Job completed but no reference found: {job_info}")
                                    return None
                            
                            elif state == 'failed':
                                error = job_info.get('errors', ['Unknown error'])
                                logger.error(f"Backup job failed: {error}")
                                return None
                            
                            elif state == 'unknown':
                                # Track time in unknown state
                                unknown_state_time += poll_interval
                                if unknown_state_time >= max_async_wait:
                                    logger.warning(f"Job state stuck at 'unknown' for {unknown_state_time}s")
                                    logger.info("Switching to fallback method: backup discovery by listing")
                                    return self._discover_backup_by_listing(expected_name, backup_start_time)
                            else:
                                # Reset unknown state counter if we get a different state
                                unknown_state_time = 0
                
                except requests.exceptions.RequestException as poll_error:
                    logger.warning(f"Error checking job status (will retry): {poll_error}")
                    continue
            
            # If we exit the loop, try fallback
            logger.warning(f"Async method timeout after {max_async_wait}s")
            logger.info("Switching to fallback method: backup discovery by listing")
            return self._discover_backup_by_listing(expected_name, backup_start_time)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create snapshot: {e}")
            logger.error(f"Exception type: {type(e).__name__}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response text: {e.response.text[:500]}")
            return None
    
    def _discover_backup_by_listing(self, expected_name, start_time):
        """
        Fallback method: Discover backup by listing all backups
        and finding the one created after start_time
        """
        logger.info("=== FALLBACK METHOD: Discovering backup by listing ===")
        logger.info(f"Looking for backup: {expected_name}")
        logger.info(f"Created after: {start_time.isoformat()}")
        
        max_fallback_wait = 600  # 10 minutes
        poll_interval = 10  # Check every 10 seconds
        elapsed = 0
        
        while elapsed < max_fallback_wait:
            try:
                # List all backups
                response = requests.get(
                    f'{self.supervisor_url}/backups',
                    headers=self._get_supervisor_headers(),
                    timeout=30
                )
                
                if response.ok:
                    backups_data = response.json()
                    
                    if backups_data.get('result') == 'ok':
                        backups = backups_data.get('data', {}).get('backups', [])
                        
                        # Search for matching backup
                        for backup in backups:
                            backup_name = backup.get('name', '')
                            backup_slug = backup.get('slug', '')
                            backup_date_str = backup.get('date', '')
                            
                            # Check if this is our backup
                            if expected_name in backup_name or backup_name.startswith('HomeSafe-'):
                                # Convert backup date to datetime
                                try:
                                    # Handle ISO format with or without 'Z'
                                    if backup_date_str.endswith('Z'):
                                        backup_date_str = backup_date_str[:-1] + '+00:00'
                                    backup_date = datetime.fromisoformat(backup_date_str)
                                    
                                    # Check if created AFTER our job started
                                    if backup_date >= start_time:
                                        logger.info(f"✅ Found matching backup!")
                                        logger.info(f"   Name: {backup_name}")
                                        logger.info(f"   Slug: {backup_slug}")
                                        logger.info(f"   Date: {backup_date_str}")
                                        logger.info(f"   Size: {backup.get('size', 0)} bytes")
                                        return backup_slug
                                except (ValueError, AttributeError) as date_error:
                                    logger.warning(f"Could not parse backup date '{backup_date_str}': {date_error}")
                                    continue
                    
                    logger.info(f"No matching backup found yet (waited {elapsed}s)")
            
            except requests.exceptions.RequestException as e:
                logger.warning(f"Error listing backups (will retry): {e}")
            
            time.sleep(poll_interval)
            elapsed += poll_interval
        
        logger.error(f"Fallback method timeout - no backup found after {max_fallback_wait}s")
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
                timeout=600  # 10 minutes for download
            )
            response.raise_for_status()
            return response  # Return stream response, not content
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download snapshot: {e}")
            return None
    
    def upload_to_homesafe(self, snapshot_slug, snapshot_stream):
        """Upload snapshot to HomeSafe using presigned URL (direct to storage)"""
        logger.info(f"Uploading snapshot to HomeSafe: {snapshot_slug}")
        
        # Get snapshot info for metadata
        snapshot_info = self.get_snapshot_info(snapshot_slug)
        ha_version = snapshot_info.get('homeassistant', 'unknown') if snapshot_info else 'unknown'
        
        try:
            # Get file size from Content-Length header (streaming compatible)
            file_size = int(snapshot_stream.headers.get('Content-Length', 0))
            
            # Fallback: get size from snapshot info if header not available
            if file_size == 0:
                logger.warning("Content-Length header not available, using snapshot info")
                file_size = snapshot_info.get('size', 0)
            
            if file_size == 0:
                logger.error("Could not determine file size")
                return False
            
            logger.info(f"File size: {file_size} bytes ({file_size / (1024*1024*1024):.2f} GB)")
            
            # Step 1: Initialize upload and get presigned URL
            logger.info("Step 1/3: Initializing upload...")
            init_response = requests.post(
                f'{self.api_url}/backup-upload?action=init',
                headers={
                    'x-api-key': self.api_key,
                    'Content-Type': 'application/json'
                },
                json={
                    'file_size': file_size,
                    'ha_version': ha_version
                },
                timeout=300  # 5 minutes for init
            )
            init_response.raise_for_status()
            init_data = init_response.json()
            
            if not init_data.get('success'):
                logger.error(f"Init failed: {init_data.get('error')}")
                return False
            
            backup_id = init_data['backup_id']
            upload_url = init_data['upload_url']
            token = init_data['token']
            logger.info(f"Upload initialized. Backup ID: {backup_id}")
            
            # Step 2: Upload directly to storage using presigned URL
            logger.info("Step 2/3: Uploading file to storage (this may take several minutes)...")
            upload_response = requests.put(
                upload_url,
                data=snapshot_stream.raw,
                headers={
                    'Content-Type': 'application/x-tar',
                    'x-upsert': 'false'
                },
                timeout=3600  # 1 hour timeout for large files
            )
            
            if not upload_response.ok:
                logger.error(f"Storage upload failed: {upload_response.status_code} - {upload_response.text}")
                # Notify backend of failure
                requests.post(
                    f'{self.api_url}/backup-upload?action=fail',
                    headers={
                        'x-api-key': self.api_key,
                        'Content-Type': 'application/json'
                    },
                    json={
                        'backup_id': backup_id,
                        'error_message': f"Storage upload failed: {upload_response.status_code}"
                    },
                    timeout=300  # 5 minutes for failure notification
                )
                return False
            
            logger.info("Upload to storage completed successfully")
            
            # Step 3: Mark upload as complete
            logger.info("Step 3/3: Finalizing backup...")
            complete_response = requests.post(
                f'{self.api_url}/backup-upload?action=complete',
                headers={
                    'x-api-key': self.api_key,
                    'Content-Type': 'application/json'
                },
                json={
                    'backup_id': backup_id
                },
                timeout=300  # 5 minutes for completion
            )
            complete_response.raise_for_status()
            
            logger.info(f"Backup uploaded successfully! Backup ID: {backup_id}")
            return True
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload to HomeSafe: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text[:500]}")
            return False
    
    def upload_to_baserow(self, snapshot_slug, snapshot_stream):
        """Upload snapshot to Baserow using chunked streaming to minimize memory usage"""
        logger.info(f"Uploading snapshot to Baserow (chunked mode): {snapshot_slug}")
        
        # Get snapshot info for metadata
        snapshot_info = self.get_snapshot_info(snapshot_slug)
        ha_version = snapshot_info.get('homeassistant', 'unknown') if snapshot_info else 'unknown'
        
        try:
            # Get file size from Content-Length header (streaming compatible)
            file_size = int(snapshot_stream.headers.get('Content-Length', 0))
            
            # Fallback: get size from snapshot info if header not available
            if file_size == 0:
                logger.warning("Content-Length header not available, using snapshot info")
                file_size = snapshot_info.get('size', 0)
            
            if file_size == 0:
                logger.error("Could not determine file size")
                return False
            
            logger.info(f"File size: {file_size} bytes ({file_size / (1024*1024*1024):.2f} GB)")
            
            # Step 1: Initialize upload via edge function
            logger.info("Step 1/3: Initializing upload with Baserow...")
            init_response = requests.post(
                f'{self.api_url}/backup-upload-baserow?action=init',
                headers={
                    'x-api-key': self.api_key,
                    'Content-Type': 'application/json'
                },
                json={
                    'file_size': file_size,
                    'ha_version': ha_version
                },
                timeout=300
            )
            init_response.raise_for_status()
            init_data = init_response.json()
            
            if not init_data.get('success'):
                logger.error(f"Init failed: {init_data.get('error')}")
                return False
            
            backup_id = init_data['backup_id']
            row_id = init_data['row_id']
            baserow_url = init_data['baserow_url']
            baserow_table_id = init_data['baserow_table_id']
            logger.info(f"Upload initialized. Backup ID: {backup_id}, Baserow Row ID: {row_id}")
            
            # Step 2: Upload file directly to Baserow using chunked streaming
            logger.info("Step 2/3: Uploading file to Baserow in chunks (this may take several minutes)...")
            
            try:
                from requests_toolbelt import MultipartEncoder, MultipartEncoderMonitor
                
                # Prepare multipart encoder with streaming file upload
                # MultipartEncoder handles chunking internally to minimize memory usage
                encoder = MultipartEncoder(
                    fields={
                        'file': ('backup.tar', snapshot_stream.raw, 'application/x-tar'),
                        'status': 'completed'
                    }
                )
                
                # Add progress monitoring
                last_logged_progress = 0
                def progress_callback(monitor):
                    nonlocal last_logged_progress
                    if file_size > 0:
                        progress = (monitor.bytes_read / file_size) * 100
                        # Log every 10% to avoid spam
                        if int(progress) >= last_logged_progress + 10:
                            logger.info(f"Upload progress: {progress:.1f}%")
                            last_logged_progress = int(progress)
                
                monitor = MultipartEncoderMonitor(encoder, progress_callback)
                
                upload_response = requests.patch(
                    f'{baserow_url}/api/database/rows/table/{baserow_table_id}/{row_id}/',
                    headers={
                        'Authorization': f'Token {self.baserow_api_token}',
                        'Content-Type': monitor.content_type
                    },
                    data=monitor,
                    timeout=3600  # 1 hour timeout for large files
                )
                
            except ImportError:
                # Fallback to non-chunked upload if requests-toolbelt is not available
                logger.warning("requests-toolbelt not available, using non-chunked upload (higher memory usage)")
                files = {
                    'file': ('backup.tar', snapshot_stream.raw, 'application/x-tar')
                }
                data = {
                    'status': 'completed'
                }
                
                upload_response = requests.patch(
                    f'{baserow_url}/api/database/rows/table/{baserow_table_id}/{row_id}/',
                    headers={
                        'Authorization': f'Token {self.baserow_api_token}'
                    },
                    files=files,
                    data=data,
                    timeout=3600
                )
            
            if not upload_response.ok:
                logger.error(f"Baserow upload failed: {upload_response.status_code} - {upload_response.text}")
                # Notify backend of failure
                requests.post(
                    f'{self.api_url}/backup-upload-baserow?action=fail',
                    headers={
                        'x-api-key': self.api_key,
                        'Content-Type': 'application/json'
                    },
                    json={
                        'backup_id': backup_id,
                        'error_message': f"Baserow upload failed: {upload_response.status_code}"
                    },
                    timeout=300
                )
                return False
            
            logger.info("Upload to Baserow completed successfully")
            
            # Step 3: Mark upload as complete
            logger.info("Step 3/3: Finalizing backup...")
            complete_response = requests.post(
                f'{self.api_url}/backup-upload-baserow?action=complete',
                headers={
                    'x-api-key': self.api_key,
                    'Content-Type': 'application/json'
                },
                json={
                    'backup_id': backup_id
                },
                timeout=300
            )
            complete_response.raise_for_status()
            
            logger.info(f"Backup uploaded successfully to Baserow! Backup ID: {backup_id}")
            return True
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload to Baserow: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text[:500]}")
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
        
        # Step 3: Upload to storage provider (streaming)
        if self.storage_provider == 'baserow':
            success = self.upload_to_baserow(snapshot_slug, snapshot_stream)
        else:
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
    logger.info(f"Storage Provider: {STORAGE_PROVIDER}")
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
