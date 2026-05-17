import type { GeminiSettings } from '../shared/types';
import { GEMINI_API_ENDPOINT } from '../shared/constants';

const DEFAULT_SETTINGS: GeminiSettings = {
  apiKey: '',
  enabled: false,
  dailyQuota: 10,
  callsToday: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  useAgentDuringExtraction: true,
};

export class SettingsModal {
  private modalEl: HTMLElement | null = null;
  private apiKeyInput: HTMLInputElement | null = null;
  private enableToggle: HTMLInputElement | null = null;
  private useAgentToggle: HTMLInputElement | null = null;
  private quotaSlider: HTMLInputElement | null = null;
  private quotaDisplay: HTMLElement | null = null;
  private testBtn: HTMLButtonElement | null = null;
  private saveBtn: HTMLButtonElement | null = null;
  private cancelBtn: HTMLButtonElement | null = null;
  private feedbackEl: HTMLElement | null = null;

  constructor() {
    this.createModal();
    this.attachListeners();
  }

  private createModal() {
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'settings-modal hidden';
    modal.innerHTML = `
      <div class="settings-modal-overlay"></div>
      <div class="settings-modal-content">
        <div class="settings-modal-header">
          <h2>LLM Settings</h2>
          <button class="settings-close-btn" aria-label="Close">×</button>
        </div>
        <div class="settings-modal-body">
          <div class="settings-field">
            <label for="gemini-api-key">Gemini API Key:</label>
            <input
              id="gemini-api-key"
              type="password"
              placeholder="AIza..."
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="settings-field">
            <label for="enable-llm">
              <input id="enable-llm" type="checkbox" />
              Enable AI Refinement
            </label>
          </div>
          <div class="settings-field">
            <label for="use-agent-extraction">
              <input id="use-agent-extraction" type="checkbox" />
              Use Agent During Extraction
            </label>
          </div>
          <div class="settings-field">
            <label for="daily-quota">Daily Quota:</label>
            <div class="quota-control">
              <input
                id="daily-quota"
                type="range"
                min="1"
                max="50"
                value="10"
              />
              <span id="quota-display" class="quota-display">10</span>
            </div>
          </div>
          <div id="settings-feedback" class="settings-feedback hidden"></div>
          <div class="settings-modal-buttons">
            <button id="test-connection-btn" class="btn btn-secondary">
              Test Connection
            </button>
            <button id="settings-save-btn" class="btn btn-primary">Save</button>
            <button id="settings-cancel-btn" class="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;
    this.apiKeyInput = document.getElementById('gemini-api-key') as HTMLInputElement;
    this.enableToggle = document.getElementById('enable-llm') as HTMLInputElement;
    this.useAgentToggle = document.getElementById('use-agent-extraction') as HTMLInputElement;
    this.quotaSlider = document.getElementById('daily-quota') as HTMLInputElement;
    this.quotaDisplay = document.getElementById('quota-display');
    this.testBtn = document.getElementById('test-connection-btn') as HTMLButtonElement;
    this.saveBtn = document.getElementById('settings-save-btn') as HTMLButtonElement;
    this.cancelBtn = document.getElementById('settings-cancel-btn') as HTMLButtonElement;
    this.feedbackEl = document.getElementById('settings-feedback');
  }

  private attachListeners() {
    if (!this.modalEl || !this.quotaSlider) return;

    // Close button
    this.modalEl.querySelector('.settings-close-btn')?.addEventListener('click', () => {
      this.close();
    });

    // Overlay click to close
    this.modalEl.querySelector('.settings-modal-overlay')?.addEventListener('click', () => {
      this.close();
    });

    // Quota slider display
    this.quotaSlider.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (this.quotaDisplay) {
        this.quotaDisplay.textContent = value;
      }
    });

    // Test connection
    this.testBtn?.addEventListener('click', () => this.testConnection());

    // Save
    this.saveBtn?.addEventListener('click', () => this.save());

    // Cancel
    this.cancelBtn?.addEventListener('click', () => this.close());

    // Prevent closing on modal content click
    this.modalEl.querySelector('.settings-modal-content')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  async open() {
    await this.loadSettings();
    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }

  private async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
      const data = settings as GeminiSettings;

      if (this.apiKeyInput) this.apiKeyInput.value = data.apiKey || '';
      if (this.enableToggle) this.enableToggle.checked = data.enabled || false;
      if (this.useAgentToggle) this.useAgentToggle.checked = data.useAgentDuringExtraction ?? true;
      if (this.quotaSlider) this.quotaSlider.value = String(data.dailyQuota || 10);
      if (this.quotaDisplay) this.quotaDisplay.textContent = String(data.dailyQuota || 10);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private async testConnection() {
    if (!this.apiKeyInput?.value) {
      this.showFeedback('API key required', 'error');
      return;
    }

    this.testBtn!.disabled = true;
    this.showFeedback('Testing...', 'info');

    try {
      const response = await fetch(
        `${GEMINI_API_ENDPOINT}?key=${encodeURIComponent(this.apiKeyInput.value)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Test' }] }],
          }),
        }
      );

      if (response.ok) {
        this.showFeedback('✓ Connection successful', 'success');
      } else {
        const error = await response.json();
        this.showFeedback(`✕ ${error.error?.message || 'Connection failed'}`, 'error');
      }
    } catch (error) {
      this.showFeedback('✕ Network error', 'error');
    } finally {
      this.testBtn!.disabled = false;
    }
  }

  private async save() {
    if (!this.apiKeyInput?.value) {
      this.showFeedback('API key required', 'error');
      return;
    }

    const settings: GeminiSettings = {
      apiKey: this.apiKeyInput.value,
      enabled: this.enableToggle?.checked || false,
      dailyQuota: Number(this.quotaSlider?.value) || 10,
      callsToday: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      useAgentDuringExtraction: this.useAgentToggle?.checked ?? true,
    };

    try {
      await chrome.storage.sync.set(settings);
      this.showFeedback('✓ Settings saved', 'success');
      setTimeout(() => this.close(), 500);
    } catch (error) {
      this.showFeedback('✕ Failed to save settings', 'error');
    }
  }

  private showFeedback(message: string, type: 'success' | 'error' | 'info') {
    if (!this.feedbackEl) return;
    this.feedbackEl.textContent = message;
    this.feedbackEl.className = `settings-feedback ${type}`;
  }
}
