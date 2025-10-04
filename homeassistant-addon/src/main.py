#!/usr/bin/env python3
import os
import time
import logging
import schedule
import requests
from datetime import datetime, timezone
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
from threading import Thread

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

# Flask app for API
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
connector_instance = None

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
    
    def get_current_ha_version(self):
        """Get current Home Assistant version"""
        try:
            response = requests.get(
                f'{self.supervisor_url}/core/info',
                headers=self._get_supervisor_headers(),
                timeout=30
            )
            response.raise_for_status()
            core_data = response.json().get('data', {})
            version = core_data.get('version', 'unknown')
            logger.info(f"Current HA version: {version}")
            return version
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get HA version: {e}")
            return None
    
    def check_version_changed(self):
        """Check if HA version changed since last backup"""
        try:
            current_version = self.get_current_ha_version()
            if not current_version:
                logger.warning("Could not determine current HA version")
                return False
            
            # Get last backup version from HomeSafe
            response = requests.get(
                f'{self.api_url}/backup-list',
                headers={'x-api-key': self.api_key},
                timeout=30
            )
            
            if not response.ok:
                logger.warning(f"Could not fetch backup list: {response.status_code}")
                return False
            
            backups = response.json().get('backups', [])
            
            if not backups:
                logger.info("No previous backups found, version change check skipped")
                return False
            
            last_version = backups[0].get('ha_version')
            
            if last_version and last_version != current_version:
                logger.info(f"🎯 HA version changed: {last_version} -> {current_version}")
                return True
            
            logger.info(f"HA version unchanged: {current_version}")
            return False
            
        except Exception as e:
            logger.error(f"Error checking version change: {e}")
            return False
    
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
    
    def upload_to_homesafe(self, snapshot_slug, snapshot_stream, trigger_type='manual'):
        """Upload snapshot to HomeSafe using direct upload with chunking"""
        logger.info(f"Uploading snapshot to HomeSafe: {snapshot_slug} (trigger: {trigger_type})")
        
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
            
            # Step 1: Initialize upload
            logger.info("Step 1/2: Initializing upload...")
            init_response = requests.post(
                f'{self.api_url}/backup-upload?action=init',
                headers={
                    'x-api-key': self.api_key,
                    'Content-Type': 'application/json'
                },
                json={
                    'file_size': file_size,
                    'ha_version': ha_version,
                    'backup_trigger': trigger_type
                },
                timeout=300
            )
            init_response.raise_for_status()
            init_data = init_response.json()
            
            if not init_data.get('success'):
                logger.error(f"Init failed: {init_data.get('error')}")
                return False
            
            backup_id = init_data['backup_id']
            storage_path = init_data['storage_path']
            logger.info(f"Upload initialized. Backup ID: {backup_id}")
            
            # Step 2: Upload file in chunks to edge function
            logger.info("Step 2/2: Uploading file (this may take several minutes)...")
            chunk_size = 50 * 1024 * 1024  # 50MB chunks
            uploaded_bytes = 0
            chunk_number = 0
            
            while uploaded_bytes < file_size:
                chunk_data = snapshot_stream.raw.read(chunk_size)
                if not chunk_data:
                    break
                
                chunk_number += 1
                chunk_length = len(chunk_data)
                
                logger.info(f"Uploading chunk {chunk_number}: {uploaded_bytes + chunk_length}/{file_size} bytes ({((uploaded_bytes + chunk_length) / file_size * 100):.1f}%)")
                
                # Upload chunk
                chunk_response = requests.post(
                    f'{self.api_url}/backup-upload?action=chunk',
                    headers={
                        'x-api-key': self.api_key,
                        'Content-Type': 'application/octet-stream',
                    },
                    params={
                        'backup_id': backup_id,
                        'chunk_number': chunk_number,
                        'offset': uploaded_bytes
                    },
                    data=chunk_data,
                    timeout=1800  # 30 minutes per chunk
                )
                
                if not chunk_response.ok:
                    logger.error(f"Chunk upload failed: {chunk_response.status_code} - {chunk_response.text}")
                    # Notify backend of failure
                    requests.post(
                        f'{self.api_url}/backup-upload?action=fail',
                        headers={
                            'x-api-key': self.api_key,
                            'Content-Type': 'application/json'
                        },
                        json={
                            'backup_id': backup_id,
                            'error_message': f"Chunk upload failed: {chunk_response.status_code}"
                        },
                        timeout=300
                    )
                    return False
                
                uploaded_bytes += chunk_length
            
            logger.info("All chunks uploaded successfully")
            
            # Step 3: Mark upload as complete
            logger.info("Finalizing backup...")
            complete_response = requests.post(
                f'{self.api_url}/backup-upload?action=complete',
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
            
            logger.info(f"Backup uploaded successfully! Backup ID: {backup_id}")
            return True
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to upload to HomeSafe: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text[:500]}")
            return False
    
    
    def perform_backup(self, trigger_type='manual'):
        """Complete backup workflow: create, download, and upload"""
        logger.info(f"=== Starting backup workflow (trigger: {trigger_type}) ===")
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
        
        # Step 3: Upload to Supabase Storage
        success = self.upload_to_homesafe(snapshot_slug, snapshot_stream, trigger_type)
        
        # Step 4: Delete local backup immediately after upload (success or failure)
        if success:
            logger.info("Upload successful, deleting local backup to save disk space...")
        else:
            logger.warning("Upload failed, deleting local backup to save disk space...")
        self.delete_local_snapshot(snapshot_slug)
        
        elapsed_time = time.time() - start_time
        logger.info(f"=== Backup workflow completed in {elapsed_time:.2f}s - {'SUCCESS' if success else 'FAILED'} ===")
        
        # Step 5: Sync YAML configs to GitHub if backup was successful
        if success:
            try:
                github_sync = GitHubSync(self.api_key)
                logger.info("Starting GitHub YAML sync...")
                github_sync.sync_yaml_configs()
            except Exception as git_error:
                logger.warning(f"GitHub sync failed (backup was successful): {git_error}")
        
        return success
    
    def delete_local_snapshot(self, snapshot_slug):
        """Delete a specific local snapshot (with existence check)"""
        try:
            # Step 1: Check if backup exists first
            logger.info(f"Checking if backup {snapshot_slug} exists...")
            check_response = requests.get(
                f'{self.supervisor_url}/backups/{snapshot_slug}/info',
                headers=self._get_supervisor_headers(),
                timeout=30
            )
            
            # If backup doesn't exist (404), just log and return
            if check_response.status_code == 404:
                logger.info(f"Backup {snapshot_slug} already deleted or not found (skip)")
                return
            
            check_response.raise_for_status()
            
            # Step 2: If exists, delete it
            logger.info(f"Deleting local snapshot: {snapshot_slug}")
            response = requests.post(
                f'{self.supervisor_url}/backups/{snapshot_slug}/remove',
                headers=self._get_supervisor_headers(),
                timeout=30
            )
            response.raise_for_status()
            logger.info(f"Successfully deleted local snapshot: {snapshot_slug}")
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                logger.info(f"Backup {snapshot_slug} not found (already deleted)")
            else:
                logger.warning(f"Failed to delete snapshot {snapshot_slug}: {e}")
        except Exception as e:
            logger.warning(f"Failed to delete snapshot {snapshot_slug}: {e}")
    
    def cleanup_old_snapshots(self):
        """Remove old local snapshots to save space (keeps 3 most recent)"""
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
                    logger.info(f"Deleting old local snapshot (cleanup): {slug}")
                    requests.post(
                        f'{self.supervisor_url}/backups/{slug}/remove',
                        headers=self._get_supervisor_headers(),
                        timeout=30
                    )
        except Exception as e:
                logger.warning(f"Failed to cleanup old snapshots: {e}")

class GitHubSync:
    """Sync Home Assistant YAML configurations to GitHub"""
    
    def __init__(self, api_key):
        self.api_key = api_key
        self.api_url = API_URL
        self.ha_config_path = Path('/config')
        self.supervisor_url = SUPERVISOR_URL
        self.supervisor_token = SUPERVISOR_TOKEN
    
    def get_user_github_settings(self):
        """Fetch user's GitHub settings from HomeSafe API"""
        try:
            response = requests.get(
                f'{self.api_url}/github-sync-config',
                headers={'x-api-key': self.api_key},
                timeout=30
            )
            
            if response.ok:
                data = response.json()
                settings = data.get('settings')
                
                if settings and settings.get('github_enabled'):
                    return {
                        'token': settings.get('github_token'),
                        'repo': settings.get('github_repo'),
                        'branch': settings.get('github_branch', 'main')
                    }
            
            return None
        except Exception as e:
            logger.error(f"Failed to fetch GitHub settings: {e}")
            return None
    
    def sync_yaml_configs(self):
        """Sync all YAML configuration files to GitHub"""
        try:
            settings = self.get_user_github_settings()
            
            if not settings:
                logger.info("GitHub sync not configured or disabled")
                return False
            
            logger.info("Starting GitHub YAML sync...")
            
            # Import git here to avoid errors if not installed
            try:
                from git import Repo, Actor
            except ImportError:
                logger.error("GitPython not installed! Cannot sync to GitHub.")
                return False
            
            # Create temp directory for git repo
            temp_dir = Path('/tmp/ha-config-sync')
            if temp_dir.exists():
                import shutil
                shutil.rmtree(temp_dir)
            temp_dir.mkdir(parents=True)
            
            # Clone or init repo
            repo_url = f"https://{settings['token']}@github.com/{settings['repo']}.git"
            
            try:
                logger.info(f"Cloning repository: {settings['repo']}")
                repo = Repo.clone_from(
                    repo_url,
                    temp_dir,
                    branch=settings['branch'],
                    depth=1
                )
            except Exception as clone_error:
                logger.warning(f"Clone failed, initializing new repo: {clone_error}")
                repo = Repo.init(temp_dir)
                origin = repo.create_remote('origin', repo_url)
                
                # Try to fetch existing branch
                try:
                    origin.fetch()
                    repo.git.checkout(settings['branch'])
                except:
                    # Create new branch
                    repo.git.checkout('-b', settings['branch'])
            
            # Copy YAML files
            yaml_files = list(self.ha_config_path.glob('*.yaml')) + \
                        list(self.ha_config_path.glob('*.yml'))
            
            if not yaml_files:
                logger.warning("No YAML files found in /config")
                return False
            
            logger.info(f"Found {len(yaml_files)} YAML files to sync")
            
            for yaml_file in yaml_files:
                dest = temp_dir / yaml_file.name
                try:
                    import shutil
                    shutil.copy2(yaml_file, dest)
                    logger.debug(f"Copied: {yaml_file.name}")
                except Exception as copy_error:
                    logger.warning(f"Failed to copy {yaml_file.name}: {copy_error}")
            
            # Check if there are changes
            if not repo.is_dirty(untracked_files=True):
                logger.info("No changes to commit")
                return True
            
            # Add all files
            repo.git.add(A=True)
            
            # Commit
            author = Actor("HomeSafe Backup", "backup@homesafe.app")
            commit_message = f"Auto-sync YAML configs - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')} UTC"
            repo.index.commit(commit_message, author=author, committer=author)
            logger.info(f"Created commit: {commit_message}")
            
            # Push
            origin = repo.remote('origin')
            origin.push(settings['branch'])
            logger.info(f"✅ Pushed to GitHub: {settings['repo']} (branch: {settings['branch']})")
            
            # Cleanup
            import shutil
            shutil.rmtree(temp_dir)
            
            return True
            
        except Exception as e:
            logger.error(f"GitHub sync failed: {e}")
            logger.error(f"Exception details: {type(e).__name__}")
            import traceback
            logger.error(traceback.format_exc())
            return False

# Flask API Endpoints
@app.route('/api/backups', methods=['GET'])
def get_backups():
    """Get list of backups from HomeSafe"""
    try:
        if not connector_instance:
            return jsonify({'success': False, 'error': 'Connector not initialized'}), 500
        
        response = requests.get(
            f'{connector_instance.api_url}/backup-list',
            headers={'x-api-key': connector_instance.api_key},
            timeout=30
        )
        
        if response.ok:
            data = response.json()
            return jsonify({'success': True, 'backups': data.get('backups', [])})
        else:
            return jsonify({'success': False, 'error': f'API error: {response.status_code}'}), 500
    
    except Exception as e:
        logger.error(f"Error fetching backups: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/backup/trigger', methods=['POST'])
def trigger_backup():
    """Trigger a manual backup"""
    try:
        if not connector_instance:
            return jsonify({'success': False, 'error': 'Connector not initialized'}), 500
        
        # Run backup in background thread
        def run_backup():
            connector_instance.perform_backup('manual')
        
        Thread(target=run_backup, daemon=True).start()
        
        return jsonify({'success': True, 'message': 'Backup started'})
    
    except Exception as e:
        logger.error(f"Error triggering backup: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get addon status"""
    try:
        return jsonify({
            'success': True,
            'status': 'running',
            'auto_backup': AUTO_BACKUP,
            'backup_time': BACKUP_TIME
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def run_flask():
    """Run Flask API in background"""
    app.run(host='0.0.0.0', port=8099, debug=False, use_reloader=False)

def main():
    global connector_instance
    
    logger.info("HomeSafe Connector started")
    logger.info(f"API URL: {API_URL}")
    logger.info(f"Auto backup: {AUTO_BACKUP}")
    logger.info(f"Backup time: {BACKUP_TIME}")
    
    connector = HomeSafeConnector()
    connector_instance = connector
    
    # Start Flask API in background thread
    flask_thread = Thread(target=run_flask, daemon=True)
    flask_thread.start()
    logger.info("Flask API started on port 8099")
    
    # Schedule automatic backups if enabled
    if AUTO_BACKUP:
        schedule.every().day.at(BACKUP_TIME).do(lambda: connector.perform_backup('scheduled'))
        logger.info(f"Scheduled daily backup at {BACKUP_TIME}")
    
    # Schedule version check every hour (Smart Scheduling)
    def check_and_backup_on_version_change():
        """Check if HA version changed and create backup if so"""
        if connector.check_version_changed():
            logger.info("🎯 Smart Backup: Creating pre-update backup...")
            connector.perform_backup('pre_update')
    
    schedule.every(1).hours.do(check_and_backup_on_version_change)
    logger.info("Scheduled hourly HA version check (Smart Scheduling)")
    
    # Perform initial backup on startup
    logger.info("Performing initial backup...")
    connector.perform_backup('manual')
    
    # Main loop
    logger.info("Entering main loop...")
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == '__main__':
    main()
