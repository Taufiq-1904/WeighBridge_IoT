class ControlPanelController {
  constructor() {
    this.commandLog = document.getElementById('command-log');
    this.statusBadges = {
      'gate-in': document.getElementById('gate-in-status-badge'),
      'gate-out': document.getElementById('gate-out-status-badge'),
      'led-red': document.getElementById('led-red-status-badge'),
      'led-yellow': document.getElementById('led-yellow-status-badge'),
      'led-green': document.getElementById('led-green-status-badge'),
      'buzzer': document.getElementById('buzzer-status-badge')
    };

    // WebSocket connection
    this.ws = null;
    this.wsConnected = false;

    // ...existing code...
    this.ACTION_TO_MQTT = {
      // Gate Controls
      'gate-in-open': 'OPEN1',
      'gate-in-close': 'CLOSE1',
      'gate-out-open': 'OPEN2',
      'gate-out-close': 'CLOSE2',
      
      // LED Controls
      'led-red-on': 'LED_RED',
      'led-red-off': 'LED_RED_OFF',
      'led-yellow-on': 'LED_YELLOW',
      'led-yellow-off': 'LED_YELLOW_OFF',
      'led-green-on': 'LED_GREEN',
      'led-green-off': 'LED_GREEN_OFF',
      
      // Buzzer Controls
      'buzzer-on': 'BEEP',
      'buzzer-off': 'BUZZER_OFF',
      
      // Quick Actions
      'reset-all': 'LED_OFF',
      'system-check': 'BEEP_DOUBLE',
      'start-system': 'BEEP_TRIPLE'
    };

    this.init();
  }

  init() {
    this.connectWebSocket();
    this.attachEventListeners();
  }

  connectWebSocket() {
    try {
      // Connect ke WebSocket server di port 3001
      this.ws = new WebSocket('ws://localhost:3001');

      this.ws.onopen = () => {
        console.log('🟢 WebSocket connected');
        this.wsConnected = true;
        this.logCommand('🟢 WebSocket Connected');
        Toast.show('Connected to server', 'success', 2000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);
          // Update UI dengan data terbaru dari server
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.logCommand('❌ WebSocket connection error');
        Toast.show('Connection error', 'error', 2000);
      };

      this.ws.onclose = () => {
        console.log('🔴 WebSocket disconnected');
        this.wsConnected = false;
        this.logCommand('🔴 WebSocket Disconnected');
        // Reconnect setelah 3 detik
        setTimeout(() => this.connectWebSocket(), 3000);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.logCommand('⚠️ Cannot connect to server');
    }
  }

  attachEventListeners() {
    // Control buttons (semua button dengan data-action)
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.handleControlAction(action, e.currentTarget);
      });
    });
  }

  async handleControlAction(action, button) {
    // Get MQTT command dari mapping
    const mqttCommand = this.ACTION_TO_MQTT[action];
    
    if (!mqttCommand) {
      console.error('Unknown action:', action);
      Toast.show(`Unknown action: ${action}`, 'error', 2000);
      return;
    }

    // Show loading state
    button.classList.add('loading');
    button.disabled = true;
    
    try {
      // Kirim command ke backend via WebSocket
      const result = await this.sendMqttCommand(mqttCommand);

      // Remove loading state
      button.classList.remove('loading');
      button.disabled = false;

      if (result.success) {
        // Update status badge
        this.updateStatusFromCommand(mqttCommand);
        
        // Log command
        this.logCommand(`✅ ${mqttCommand} sent successfully`);
        
        // Show toast
        Toast.show(`Command sent: ${mqttCommand}`, 'success', 2000);
        
        // Visual feedback
        button.classList.add('active');
        setTimeout(() => button.classList.remove('active'), 300);
      } else {
        Toast.show(`Failed to send: ${mqttCommand}`, 'error', 2000);
        this.logCommand(`❌ Failed to send ${mqttCommand}`);
      }
    } catch (error) {
      button.classList.remove('loading');
      button.disabled = false;
      console.error('Error sending command:', error);
      Toast.show('Network error occurred', 'error', 2000);
      this.logCommand(`❌ Error: ${error.message}`);
    }
  }

  async sendMqttCommand(command) {
    return new Promise((resolve, reject) => {
      // Cek koneksi WebSocket
      if (!this.wsConnected || this.ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket not connected');
        return resolve({ success: false, error: 'WebSocket not connected' });
      }

      try {
        console.log('📤 Sending command via WebSocket:', command);
        
        // Kirim command ke server
        this.ws.send(command);
        
        // Asumsikan berhasil jika tidak ada error
        resolve({ success: true });
      } catch (error) {
        console.error('Failed to send MQTT command:', error);
        resolve({ success: false, error: error.message });
      }
    });
  }

  updateStatusFromCommand(command) {
    switch(command) {
      // Gate Masuk
      case 'OPEN1':
        this.updateStatusBadge('gate-in', 'Open', true);
        break;
      case 'CLOSE1':
        this.updateStatusBadge('gate-in', 'Closed', false);
        break;
      
      // Gate Keluar
      case 'OPEN2':
        this.updateStatusBadge('gate-out', 'Open', true);
        break;
      case 'CLOSE2':
        this.updateStatusBadge('gate-out', 'Closed', false);
        break;
      
      // LED Merah
      case 'LED_RED':
        this.updateStatusBadge('led-red', 'On', true);
        break;
      case 'LED_RED_OFF':
        this.updateStatusBadge('led-red', 'Off', false);
        break;
      
      // LED Kuning
      case 'LED_YELLOW':
        this.updateStatusBadge('led-yellow', 'On', true);
        break;
      case 'LED_YELLOW_OFF':
        this.updateStatusBadge('led-yellow', 'Off', false);
        break;
      
      // LED Hijau
      case 'LED_GREEN':
        this.updateStatusBadge('led-green', 'On', true);
        break;
      case 'LED_GREEN_OFF':
        this.updateStatusBadge('led-green', 'Off', false);
        break;
      
      // Semua LED OFF
      case 'LED_OFF':
        this.updateStatusBadge('led-red', 'Off', false);
        this.updateStatusBadge('led-yellow', 'Off', false);
        this.updateStatusBadge('led-green', 'Off', false);
        break;
      
      // Buzzer
      case 'BEEP':
      case 'BEEP_DOUBLE':
      case 'BEEP_TRIPLE':
      case 'BEEP_LONG':
        this.updateStatusBadge('buzzer', 'Active', true);
        // Auto turn off setelah 2 detik
        setTimeout(() => {
          this.updateStatusBadge('buzzer', 'Off', false);
        }, 2000);
        break;
      case 'BUZZER_OFF':
        this.updateStatusBadge('buzzer', 'Off', false);
        break;
    }
  }

  updateStatusBadge(component, statusText, isActive) {
    const badge = this.statusBadges[component];
    
    if (badge) {
      // Update text
      badge.textContent = statusText;
      
      // Update class
      badge.classList.remove('status-active', 'status-inactive');
      badge.classList.add(isActive ? 'status-active' : 'status-inactive');
      
      // Pulse animation
      badge.style.animation = 'none';
      setTimeout(() => {
        badge.style.animation = 'pulse 0.5s ease-out';
      }, 10);
    }
  }

  logCommand(text) {
    const time = formatTime();
    
    // Create log item
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    
    // Add color based on text content
    if (text.includes('✅') || text.includes('🟢')) {
      logItem.classList.add('log-success');
    } else if (text.includes('❌') || text.includes('🔴')) {
      logItem.classList.add('log-error');
    }
    
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