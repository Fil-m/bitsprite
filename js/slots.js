// BitSprite Exploits and Action Slots Manager
class ExploitsManager {
  constructor() {
    this.unlockedAchievements = [];
    this.slotBindings = [null, null, null, null, null]; // 5 action slots
    this.activeSlotIndex = 0; // selected slot index
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const savedAchievements = localStorage.getItem('bitsprite_achievements');
      const savedBindings = localStorage.getItem('bitsprite_bindings');
      
      if (savedAchievements) {
        this.unlockedAchievements = JSON.parse(savedAchievements);
      } else {
        // Start empty in normal narrative play
        this.unlockedAchievements = [];
      }

      if (savedBindings) {
        this.slotBindings = JSON.parse(savedBindings);
        while (this.slotBindings.length < 5) {
          this.slotBindings.push(null);
        }
      } else {
        this.slotBindings = [null, null, null, null, null];
      }
    } catch (e) {
      console.warn("Failed to read localStorage bindings:", e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('bitsprite_achievements', JSON.stringify(this.unlockedAchievements));
      localStorage.setItem('bitsprite_bindings', JSON.stringify(this.slotBindings));
    } catch (e) {
      console.warn("Failed to write localStorage bindings:", e);
    }
  }

  resetProgress() {
    this.unlockedAchievements = [];
    this.slotBindings = [null, null, null, null, null];
    this.activeSlotIndex = 0;
    this.saveToStorage();
  }

  unlock(exploitId) {
    if (!this.unlockedAchievements.includes(exploitId)) {
      this.unlockedAchievements.push(exploitId);
      this.saveToStorage();
      if (window.AudioEngine) {
        window.AudioEngine.play('achievement');
      }
      this.showAchievementBanner(exploitId);
      // Auto bind to first empty slot if possible
      const emptyIdx = this.slotBindings.indexOf(null);
      if (emptyIdx !== -1) {
        this.bind(emptyIdx, exploitId);
      }
      return true;
    }
    return false;
  }

  bind(slotIndex, exploitId) {
    if (slotIndex >= 0 && slotIndex < 5) {
      this.slotBindings[slotIndex] = exploitId;
      this.saveToStorage();
      this.updateUIPanels();
    }
  }

  selectSlot(idx) {
    if (idx >= 0 && idx < 5) {
      this.activeSlotIndex = idx;
      this.updateUIPanels();
    }
  }

  getActiveExploit() {
    return this.slotBindings[this.activeSlotIndex];
  }

  showAchievementBanner(exploitId) {
    const banner = document.createElement('div');
    banner.className = 'achievement-banner';
    const name = window.translations ? window.translations.exploits[exploitId].name : exploitId.toUpperCase();
    const desc = window.translations ? window.translations.exploits[exploitId].desc : '';
    banner.innerHTML = `
      <div class="achievement-title">Achievement Unlocked!</div>
      <div class="achievement-name">${name}</div>
      <div class="achievement-desc">${desc}</div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.classList.add('visible'), 100);
    setTimeout(() => {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 500);
    }, 5000);
  }

  updateUIPanels() {
    // Sync slots UI layout in HUD
    for (let i = 0; i < 5; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      if (slotEl) {
        slotEl.className = `action-slot ${this.activeSlotIndex === i ? 'selected' : ''}`;
        const exploit = this.slotBindings[i];
        if (exploit) {
          slotEl.innerHTML = `<span class="exploit-icon">${exploit[0].toUpperCase()}</span>`;
          slotEl.title = exploit.toUpperCase();
        } else {
          slotEl.innerHTML = '';
          slotEl.title = 'Empty Slot';
        }
      }
    }

    // Sync bottom action button icon
    const actionBtn = document.getElementById('btn-action');
    if (actionBtn) {
      const exploit = this.getActiveExploit();
      if (exploit) {
        actionBtn.innerHTML = exploit[0].toUpperCase();
        actionBtn.className = `touch-btn action-active exploit-${exploit}`;
      } else {
        actionBtn.innerHTML = '🔨'; // Default hammer
        actionBtn.className = 'touch-btn action-active';
      }
    }
  }

  triggerExploit(context) {
    const exploit = this.getActiveExploit();
    if (!exploit) {
      // No exploit active, default hammer action is handled elsewhere
      return 'hammer';
    }

    let success = false;

    if (exploit === 'rowhammer') {
      // Rowhammer: Changes frequency discretely, permanent until changed. Needs no special nearby context.
      success = true;
    } else if (exploit === 'spectre') {
      // Spectre can always be activated to trigger the scan wave!
      success = true;
    } else if (exploit === 'hijack') {
      // Bus Hijack: Needs Packy to be nearby (within 150px) and in blocked state "BUS_WAIT"
      if (context.game && context.game.packy && context.game.packy.state === 'BUS_WAIT') {
        const dist = Math.hypot(context.player.x - context.game.packy.x, context.player.y - context.game.packy.y);
        if (dist < 160) {
          success = true;
        }
      }
    } else if (exploit === 'overflow') {
      // Buffer Overflow: Evaluated automatically by aligning instruction stack. Cannot trigger out of stack context.
      success = false;
    } else if (exploit === 'glitch') {
      // Glitch (Voltage): Needs to strike exactly near oscilloscope limits
      if (context.game && (context.game.oscilloscopeVoltage > 1.71 || context.game.oscilloscopeVoltage < 0.69)) {
        success = true;
      }
    }

    if (success) {
      if (window.AudioEngine) {
        window.AudioEngine.play('exploit_activate');
      }
      return exploit;
    } else {
      // Exploit activation failed! Trigger error sound and visual slot flash error
      if (window.AudioEngine) {
        window.AudioEngine.play('error');
      }
      
      const activeSlotEl = document.getElementById(`slot-${this.activeSlotIndex}`);
      if (activeSlotEl) {
        activeSlotEl.classList.add('exploit-error');
        setTimeout(() => activeSlotEl.classList.remove('exploit-error'), 400);
      }
      return false;
    }
  }
}

// Global Slots and Achievements Engine
const Slots = new ExploitsManager();
window.SlotsEngine = Slots;
