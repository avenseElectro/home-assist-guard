/**
 * HomeSafe Lovelace Custom Card
 * Displays backup status and allows manual backups
 */

class HomeSafeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._backups = [];
    this._loading = true;
    this._error = null;
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    this._config = config;
    this.render();
    this.loadBackups();
  }

  set hass(hass) {
    this._hass = hass;
  }

  getApiUrl() {
    return `${window.location.protocol}//${window.location.hostname}:8099`;
  }

  async loadBackups() {
    this._loading = true;
    this._error = null;
    this.render();

    try {
      const response = await fetch(`${this.getApiUrl()}/api/backups`);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        this._backups = data.backups.slice(0, 5); // Show only 5 most recent
      } else {
        this._error = data.error || 'Failed to load backups';
        console.error('Failed to load backups:', data.error);
      }
    } catch (error) {
      this._error = 'Cannot connect to HomeSafe API. Check if addon is running.';
      console.error('Error loading backups:', error);
    }

    this._loading = false;
    this.render();
  }

  async triggerBackup() {
    if (this._loading) return;
    
    this._loading = true;
    this.render();

    try {
      const response = await fetch(`${this.getApiUrl()}/api/backup/trigger`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Backup iniciado com sucesso!');
        // Reload backups after 5 seconds
        setTimeout(() => this.loadBackups(), 5000);
      } else {
        alert('Erro ao iniciar backup: ' + data.error);
      }
    } catch (error) {
      alert('Erro ao conectar com HomeSafe: ' + error.message);
    }

    this._loading = false;
    this.render();
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSize(bytes) {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  }

  getStatusIcon(status) {
    switch (status) {
      case 'completed':
        return '&#9989;'; // ✅
      case 'uploading':
        return '&#8987;'; // ⏳
      case 'failed':
        return '&#10060;'; // ❌
      default:
        return '&#10067;'; // ❓
    }
  }

  getTriggerBadge(trigger) {
    switch (trigger) {
      case 'manual':
        return '&#128100; Manual'; // 👤
      case 'scheduled':
        return '&#9200; Agendado'; // ⏰
      case 'pre_update':
        return '&#127919; Pré-Update'; // 🎯
      default:
        return trigger || 'N/A';
    }
  }

  render() {
    const title = this._config.title || 'HomeSafe Backups';

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          font-family: var(--primary-font-family);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--primary-text-color);
        }
        .backup-button {
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .backup-button:hover {
          opacity: 0.9;
        }
        .backup-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .loading {
          text-align: center;
          padding: 20px;
          color: var(--secondary-text-color);
        }
        .backup-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .backup-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--secondary-background-color);
          border-radius: 8px;
          border-left: 4px solid var(--primary-color);
        }
        .backup-info {
          flex: 1;
        }
        .backup-name {
          font-weight: 500;
          color: var(--primary-text-color);
          margin-bottom: 4px;
        }
        .backup-meta {
          font-size: 0.85rem;
          color: var(--secondary-text-color);
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .backup-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 1.2rem;
        }
        .trigger-badge {
          display: inline-block;
          padding: 2px 8px;
          background: var(--primary-color);
          color: white;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--secondary-text-color);
        }
        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }
      </style>

      <ha-card>
        <div class="header">
          <div class="title">${title}</div>
          <button 
            class="backup-button" 
            ${this._loading ? 'disabled' : ''}
            onclick="this.getRootNode().host.triggerBackup()"
          >
            ${this._loading ? '&#8987; A carregar...' : '&#128260; Backup Manual'}
          </button>
        </div>

        ${this._loading ? `
          <div class="loading">
            <div>&#8987; A carregar backups...</div>
          </div>
        ` : this._error ? `
          <div class="empty-state">
            <div class="empty-state-icon">&#9888;</div>
            <div style="color: var(--error-color, #e74c3c);">${this._error}</div>
            <div style="margin-top: 8px; font-size: 0.9rem;">
              Verifique se o addon HomeSafe esta em execucao
            </div>
          </div>
        ` : this._backups.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">&#128230;</div>
            <div>Nenhum backup encontrado</div>
            <div style="margin-top: 8px; font-size: 0.9rem;">
              Clique em "Backup Manual" para criar o primeiro backup
            </div>
          </div>
        ` : `
          <div class="backup-list">
            ${this._backups.map(backup => `
              <div class="backup-item">
                <div class="backup-info">
                  <div class="backup-name">${backup.filename || 'Backup sem nome'}</div>
                  <div class="backup-meta">
                    <span>&#128197; ${this.formatDate(backup.created_at)}</span>
                    <span>&#128190; ${this.formatSize(backup.size_bytes)}</span>
                    <span class="trigger-badge">${this.getTriggerBadge(backup.backup_trigger)}</span>
                    ${backup.ha_version ? `<span>&#127968; HA ${backup.ha_version}</span>` : ''}
                  </div>
                </div>
                <div class="backup-status">
                  ${this.getStatusIcon(backup.status)}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </ha-card>
    `;
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement('homesafe-card-editor');
  }

  static getStubConfig() {
    return {
      title: 'HomeSafe Backups'
    };
  }
}

customElements.define('homesafe-card', HomeSafeCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'homesafe-card',
  name: 'HomeSafe Card',
  description: 'Display HomeSafe backup status and trigger manual backups'
});
