// Control page JavaScript
class ControlPanelController {
  constructor() {
    this.commandLog = document.getElementById('command-log');
    this.statusBadges = {
      gate: document.getElementById('gate-status-badge'),
      led: document.getElementById('led-status-badge'),
      buzzer: document.getElementById('buzzer-status-badge')
    };

    this.init();
  }

  init() {
    this.attachEventListeners();
    this.pollStatus();
    setInterval(() => this.pollStatus(), 2000);
  }

  attachEventListeners() {
    // Control buttons
    document.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.handleControlAction(action, e.currentTarget);
      });
    });

    // Quick action buttons
    document.querySelectorAll('.quick-actions .btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.handleQuickAction(action, e.currentTarget);
      });
    });
  }

  async handleControlAction(action, button) {
    // Show loading state
    button.classList.add('loading');
    
    // Parse action (e.g., "gate-open" -> component: "gate", command: "open")
    const [component, command] = action.split('-');
    
    // Send command to API
    const result = await API.post('/control', {
      component,
      command
    });

    // Remove loading state
    button.classList.remove('loading');

    if (result) {
      // Update UI
      this.updateStatusBadge(component, command);
      
      // Log command
      this.logCommand(`${component.toUpperCase()}: ${command}`);
      
      // Show toast
      Toast.show(`${component} ${command} successful`, 'success', 2000);
      
      // Visual feedback
      button.classList.add('active');
      setTimeout(() => button.classList.remove('active'), 300);
    } else {
      Toast.show(`Failed to ${command} ${component}`, 'error', 2000);
    }
  }

  async handleQuickAction(action, button) {
    button.classList.add('loading');
    
    let message = '';
    
    switch(action) {
      case 'reset-all':
        // Reset all components
        await API.post('/control', { action: 'reset' });
        message = 'All systems reset';
        break;
      case 'system-check':
        // Perform system check
        await API.post('/control', { action: 'check' });
        message = 'System check completed';
        break;
      case 'start-system':
        // Start system
        await API.post('/control', { action: 'start' });
        message = 'Start activated';
        break;
    }
    
    button.classList.remove('loading');
    this.logCommand(message);
    Toast.show(message, 'info', 2000);
  }

  updateStatusBadge(component, status) {
    const badge = this.statusBadges[component];
    
    if (badge) {
      // Update text
      let statusText = status;
      if (component === 'gate') {
        statusText = status === 'open' ? 'Open' : 'Closed';
      } else {
        statusText = status === 'on' ? 'On' : 'Off';
      }
      
      badge.textContent = statusText;
      
      // Update class
      if (status === 'open' || status === 'on') {
        badge.classList.remove('status-inactive');
        badge.classList.add('status-active');
      } else {
        badge.classList.remove('status-active');
        badge.classList.add('status-inactive');
      }
      
      // Pulse animation
      badge.style.animation = 'none';
      setTimeout(() => {
        badge.style.animation = 'pulse 0.5s ease-out';
      }, 10);
    }
  }

  async pollStatus() {
    const status = await API.get('/status');
    
    if (status) {
      this.updateStatusBadge('gate', status.gate);
      this.updateStatusBadge('led', status.led);
      this.updateStatusBadge('buzzer', status.buzzer);
    }
  }

  logCommand(text) {
    const time = formatTime();
    
    // Create log item
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.innerHTML = `
      <span class="log-time">${time}</span>
      <span class="log-text">${text}</span>
    `;
    
    // Remove "waiting" message if exists
    const waiting = this.commandLog.querySelector('.log-item');
    if (waiting && waiting.textContent.includes('Waiting')) {
      waiting.remove();
    }
    
    // Add to top
    this.commandLog.insertBefore(logItem, this.commandLog.firstChild);
    
    // Keep only last 20 logs
    while (this.commandLog.children.length > 20) {
      this.commandLog.lastChild.remove();
    }
  }
}

// Initialize controller
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ControlPanelController();
  });
} else {
  new ControlPanelController();
}