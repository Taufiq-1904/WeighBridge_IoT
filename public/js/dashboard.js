// ===============================
// MQTT WebSocket Connection
// ===============================

class DashboardController {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 3000;
    this.activityLog = [];
    this.vehicleCount = 0;
    this.totalWeight = 0;
    this.startTime = Date.now();

    this.init();
  }

  init() {
    this.connectWebSocket();
    this.startUptimeCounter();
  }

  connectWebSocket() {
    console.log('🔌 Connecting to MQTT WebSocket...');

    try {
      this.ws = new WebSocket('ws://localhost:3001');

      this.ws.onopen = () => {
        console.log(' WebSocket connected to MQTT server');
        Toast.show('Connected to MQTT server', 'success', 2000);
        this.updateSystemStatus('active');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(' Received MQTT data:', data);
          this.handleMqttData(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error(' WebSocket error:', error);
        Toast.show('WebSocket connection error', 'error', 3000);
        this.updateSystemStatus('error');
      };

      this.ws.onclose = () => {
        console.log(' WebSocket disconnected');
        Toast.show('Disconnected from server', 'error', 2000);
        this.updateSystemStatus('offline');

        // Attempt to reconnect
        setTimeout(() => {
          console.log(' Attempting to reconnect...');
          this.connectWebSocket();
        }, this.reconnectInterval);
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }

  handleMqttData(data) {
    // Update weight display
    if (data.weight !== null && data.weight !== undefined) {
      this.updateWeight(data.weight);
    }

    // Update status display
    if (data.status !== null && data.status !== undefined) {
      this.updateStatus(data.status);
      this.addActivity(data.status);
    }

    // Update connection indicator
    if (data.connected !== undefined) {
      this.updateSystemStatus(data.connected ? 'active' : 'offline');
    }
  }

  updateWeight(weight) {
    const weightElement = document.getElementById('current-weight');
    const progressBar = document.getElementById('weight-progress');

    if (weightElement) {
      // Display weight (convert to grams if needed, or keep as kg)
      const displayWeight = Math.abs(weight).toFixed(2);
      weightElement.textContent = displayWeight;

      // Update progress bar (max 1000 for visualization)
      const percentage = Math.min((Math.abs(weight) / 1000) * 100, 100);
      if (progressBar) {
        progressBar.style.width = percentage + '%';
      }

      // Update total weight counter
      if (weight > 10) { // Ignore noise/negative values
        this.totalWeight += weight;
        const totalElement = document.getElementById('total-weight');
        if (totalElement) {
          totalElement.textContent = this.totalWeight.toFixed(2) + ' g';
        }
      }
    }
  }

  updateStatus(statusText) {
    // Parse status and update relevant components
    const status = statusText.toUpperCase();

    // Gate status
    if (status.includes('ENTRY GATE')) {
      const isOpen = status.includes('OPENED');
      this.updateComponentStatus('gate-in', isOpen ? 'Open' : 'Closed', isOpen ? 'open' : 'closed');
    }

    if (status.includes('EXIT GATE')) {
      const isOpen = status.includes('OPENED');
      this.updateComponentStatus('gate-out', isOpen ? 'Open' : 'Closed', isOpen ? 'open' : 'closed');
    }

    // LED status
    if (status.includes('LED RED')) {
      this.updateComponentStatus('led-red', 'On', 'active');
    } else if (status.includes('LED_RED_OFF')) {
      this.updateComponentStatus('led-red', 'Off', 'off');
    }

    if (status.includes('LED YELLOW')) {
      this.updateComponentStatus('led-yellow', 'On', 'active');
    } else if (status.includes('LED_YELLOW_OFF')) {
      this.updateComponentStatus('led-yellow', 'Off', 'off');
    }

    if (status.includes('LED GREEN')) {
      this.updateComponentStatus('led-green', 'On', 'active');
    } else if (status.includes('LED_GREEN_OFF')) {
      this.updateComponentStatus('led-green', 'Off', 'off');
    }

    // Buzzer status
    if (status.includes('BUZZER ON')) {
      this.updateComponentStatus('buzzer', 'Active', 'active');
      // Auto turn off display after 2 seconds
      setTimeout(() => {
        this.updateComponentStatus('buzzer', 'Off', 'off');
      }, 2000);
    }

    // Count vehicles (when gate closes after weighing)
    if (status.includes('ENTRY GATE CLOSED') || status.includes('EXIT GATE CLOSED')) {
      this.vehicleCount++;
      const vehicleElement = document.getElementById('vehicles-today');
      if (vehicleElement) {
        vehicleElement.textContent = this.vehicleCount;
      }
    }
  }

  updateComponentStatus(componentId, statusText, statusIndicator) {
    // Update status text
    const statusElement = document.getElementById(`${componentId}-status`);
    if (statusElement) {
      statusElement.textContent = statusText;
    }

    // Update status indicator
    const card = document.querySelector(`[data-component="${componentId}"]`);
    if (card) {
      const indicator = card.querySelector('.status-indicator');
      if (indicator) {
        indicator.setAttribute('data-status', statusIndicator);
      }
    }
  }

  updateSystemStatus(status) {
    const systemElement = document.getElementById('system-status');
    const systemIndicator = document.querySelector('[data-component="system"] .status-indicator');

    if (systemElement) {
      const statusMap = {
        'active': 'Running',
        'offline': 'Offline',
        'error': 'Error'
      };
      systemElement.textContent = statusMap[status] || 'Unknown';
    }

    if (systemIndicator) {
      systemIndicator.setAttribute('data-status', status);
    }
  }

  addActivity(text) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    // Remove "Waiting for data" placeholder
    const placeholder = activityList.querySelector('.activity-item');
    if (placeholder && placeholder.textContent.includes('Waiting')) {
      placeholder.remove();
    }

    // Create new activity item
    const li = document.createElement('li');
    li.className = 'activity-item';

    const time = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    li.innerHTML = `
      <span class="activity-time">${time}</span>
      <span class="activity-text">${text}</span>
    `;

    // Add to top
    activityList.insertBefore(li, activityList.firstChild);

    // Keep only last 10 items
    while (activityList.children.length > 10) {
      activityList.lastChild.remove();
    }
  }

  startUptimeCounter() {
    setInterval(() => {
      const uptime = Date.now() - this.startTime;
      const hours = Math.floor(uptime / (1000 * 60 * 60));
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

      const uptimeElement = document.getElementById('uptime');
      if (uptimeElement) {
        uptimeElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    }, 1000);
  }

  sendCommand(command) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(command);
      console.log(' Sent command:', command);
    } else {
      console.error(' WebSocket not connected');
      Toast.show('Cannot send command: Not connected', 'error', 2000);
    }
  }
}

// Initialize dashboard
let dashboard;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardController();
  });
} else {
  dashboard = new DashboardController();
}