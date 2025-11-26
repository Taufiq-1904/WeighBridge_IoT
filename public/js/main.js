// Global utilities and theme management

class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.apply();
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.apply();
    localStorage.setItem('theme', this.theme);
  }

  apply() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// API Helper
class API {
  static async get(endpoint) {
    try {
      const response = await fetch(`/api${endpoint}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  }

  static async post(endpoint, data) {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  }
}

// Animation utilities using requestAnimationFrame
class AnimationUtils {
  // Smooth number counter
  static animateValue(element, start, end, duration = 500) {
    const startTime = performance.now();
    const range = end - start;

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (range * eased);
      
      element.textContent = Math.round(current).toLocaleString('id-ID');
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }

  // Fade in element
  static fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const startTime = performance.now();
    
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }

  // Slide in element
  static slideIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    const startTime = performance.now();
    
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      
      element.style.opacity = progress;
      element.style.transform = `translateY(${20 - (20 * eased)}px)`;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }
}

// Format date/time
function formatTime(date = new Date()) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Toast notification (optional, lightweight)
class Toast {
  static show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 16px 24px;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      opacity: 0;
      transform: translateY(20px);
      transition: all var(--transition-fast);
    `;
    
    document.body.appendChild(toast);
    
    // Fade in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    
    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Export for use in other scripts
window.ThemeManager = themeManager;
window.API = API;
window.AnimationUtils = AnimationUtils;
window.Toast = Toast;
window.formatTime = formatTime;
window.formatDate = formatDate;