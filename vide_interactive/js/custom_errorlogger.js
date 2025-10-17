/**
 * GrapesJS Notifications Plugin Integration
 * Standalone implementation for Interactive Designer
 * 
 * This plugin provides a notification system for errors, warnings, success messages, and info
 * Place this file in your ./js/ directory and include it in your HTML
 */

function initNotificationsPlugin(editor) {
  console.log("🔔 Initializing Notifications Plugin...");

  // Plugin configuration
  const notificationConfig = {
    timeout: 5000, // Auto-hide after 5 seconds (0 = no timeout)
    maxNotifications: 5, // Maximum visible notifications
    reverse: false, // Show newest at top
    icons: {
      error: '✖',
      warning: '⚠',
      success: '✔',
      info: 'ℹ'
    },
    i18n: {
      error: 'Error',
      warning: 'Warning',
      success: 'Success',
      info: 'Info',
      close: 'Close'
    }
  };

  // Create notification container
  let notificationContainer = document.getElementById('gjs-notifications-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'gjs-notifications-container';
    notificationContainer.className = 'gjs-notifications-wrapper';
    document.body.appendChild(notificationContainer);
  }

  // Notification storage
  const notifications = [];

  // Add custom styles
  const style = document.createElement('style');
  style.textContent = `
    .gjs-notifications-wrapper {
      position: fixed;
      top: 60px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      pointer-events: none;
    }

    .gjs-notification {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      pointer-events: auto;
      border-left: 4px solid #ccc;
      transition: all 0.3s ease;
    }

    .gjs-notification:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      transform: translateX(-4px);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }

    .gjs-notification.removing {
      animation: slideOut 0.3s ease-out forwards;
    }

    .gjs-notification__icon {
      font-size: 20px;
      font-weight: bold;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gjs-notification__content {
      flex: 1;
      min-width: 0;
    }

    .gjs-notification__type {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }

    .gjs-notification__message {
      font-size: 14px;
      line-height: 1.4;
      color: #333;
      word-wrap: break-word;
    }

    .gjs-notification__close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .gjs-notification__close:hover {
      color: #000;
    }

    .gjs-notification__error {
      border-left-color: #dc3545;
    }

    .gjs-notification__error .gjs-notification__icon {
      color: #dc3545;
    }

    .gjs-notification__error .gjs-notification__type {
      color: #dc3545;
    }

    .gjs-notification__warning {
      border-left-color: #ffc107;
    }

    .gjs-notification__warning .gjs-notification__icon {
      color: #ffc107;
    }

    .gjs-notification__warning .gjs-notification__type {
      color: #ffc107;
    }

    .gjs-notification__success {
      border-left-color: #28a745;
    }

    .gjs-notification__success .gjs-notification__icon {
      color: #28a745;
    }

    .gjs-notification__success .gjs-notification__type {
      color: #28a745;
    }

    .gjs-notification__info {
      border-left-color: #17a2b8;
    }

    .gjs-notification__info .gjs-notification__icon {
      color: #17a2b8;
    }

    .gjs-notification__info .gjs-notification__type {
      color: #17a2b8;
    }

    /* Navbar button styles */
    .gjs-pn-btn.notifications-btn {
      position: relative;
    }

    .notifications-badge {
      position: absolute;
      top: 5px;
      right: 5px;
      background: #dc3545;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: bold;
      min-width: 18px;
      text-align: center;
    }
  `;
  document.head.appendChild(style);

  // Helper function to create notification element
  function createNotificationElement(notification) {
    const { type, message, id } = notification;
    const icon = notificationConfig.icons[type] || notificationConfig.icons.info;
    const typeLabel = notificationConfig.i18n[type] || type;

    const notifEl = document.createElement('div');
    notifEl.className = `gjs-notification gjs-notification__${type}`;
    notifEl.setAttribute('data-notification-id', id);
    notifEl.innerHTML = `
      <div class="gjs-notification__icon">${icon}</div>
      <div class="gjs-notification__content">
        <div class="gjs-notification__type">${typeLabel}</div>
        <div class="gjs-notification__message">${message}</div>
      </div>
      <button class="gjs-notification__close" title="Close">×</button>
    `;

    // Close button handler
    const closeBtn = notifEl.querySelector('.gjs-notification__close');
    closeBtn.addEventListener('click', () => {
      removeNotification(id);
    });

    return notifEl;
  }

  // Add notification
  function addNotification(notification) {
    const { type = 'info', message, timeout = notificationConfig.timeout, component } = notification;
    
    if (!message) {
      console.warn('Notification message is required');
      return;
    }

    const id = Date.now() + Math.random();
    const notif = { id, type, message, component, timestamp: new Date() };

    notifications.push(notif);

    // Trim to max notifications
    while (notifications.length > notificationConfig.maxNotifications) {
      const removed = notifications.shift();
      removeNotificationFromDOM(removed.id);
    }

    // Create and add to DOM
    const notifEl = createNotificationElement(notif);
    
    if (notificationConfig.reverse) {
      notificationContainer.insertBefore(notifEl, notificationContainer.firstChild);
    } else {
      notificationContainer.appendChild(notifEl);
    }

    // Auto-remove after timeout
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    // Update badge
    updateBadge();

    // Trigger event
    editor.trigger('notifications:added', notif);
    editor.trigger('notifications:changed', notifications);

    return id;
  }

  // Remove notification
  function removeNotification(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) return;

    const notif = notifications[index];
    notifications.splice(index, 1);

    removeNotificationFromDOM(id);
    updateBadge();

    editor.trigger('notifications:removed', notif);
    editor.trigger('notifications:changed', notifications);
  }

  // Remove from DOM with animation
  function removeNotificationFromDOM(id) {
    const notifEl = notificationContainer.querySelector(`[data-notification-id="${id}"]`);
    if (notifEl) {
      notifEl.classList.add('removing');
      setTimeout(() => {
        if (notifEl.parentNode) {
          notifEl.parentNode.removeChild(notifEl);
        }
      }, 300);
    }
  }

  // Clear all notifications
  function clearNotifications() {
    const toRemove = [...notifications];
    notifications.length = 0;
    
    toRemove.forEach(notif => {
      removeNotificationFromDOM(notif.id);
    });

    updateBadge();
    updatePanel();

    editor.trigger('notifications:cleared');
    editor.trigger('notifications:changed', notifications);
  }

  // Update badge count
  function updateBadge() {
    const badge = document.querySelector('.notifications-badge');
    const errorCount = notifications.filter(n => n.type === 'error').length;
    
    if (badge) {
      if (errorCount > 0) {
        badge.textContent = errorCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // Show notifications in GrapesJS modal
  function showNotificationsModal(editor) {
    const notificationsList = notifications.length === 0
      ? '<div style="text-align: center; padding: 40px; color: #999;">No notifications</div>'
      : notifications
          .slice()
          .reverse()
          .map(notif => {
            const icon = notificationConfig.icons[notif.type];
            const typeLabel = notificationConfig.i18n[notif.type];
            const colorMap = {
              error: '#dc3545',
              warning: '#ffc107',
              success: '#28a745',
              info: '#17a2b8'
            };
            const color = colorMap[notif.type] || '#17a2b8';
            
            return `
              <div style="
                background: #f8f9fa;
                border-radius: 6px;
                padding: 12px 16px;
                margin-bottom: 10px;
                border-left: 4px solid ${color};
                cursor: pointer;
                transition: all 0.2s;
              " 
              onmouseover="this.style.background='#e9ecef'; this.style.transform='translateX(-2px)'"
              onmouseout="this.style.background='#f8f9fa'; this.style.transform='translateX(0)'">
                <div style="
                  display: flex;
                  align-items: flex-start;
                  gap: 10px;
                ">
                  <div style="
                    font-size: 18px;
                    color: ${color};
                    font-weight: bold;
                    flex-shrink: 0;
                  ">${icon}</div>
                  <div style="flex: 1;">
                    <div style="
                      font-size: 11px;
                      font-weight: 600;
                      text-transform: uppercase;
                      color: ${color};
                      margin-bottom: 4px;
                      letter-spacing: 0.5px;
                    ">${typeLabel}</div>
                    <div style="
                      font-size: 13px;
                      color: #333;
                      line-height: 1.4;
                      word-wrap: break-word;
                    ">${notif.message}</div>
                  </div>
                </div>
              </div>
            `;
          })
          .join('');

    const modalContent = `
      <div style="max-height: 500px; overflow-y: auto; padding: 10px;">
        ${notificationsList}
      </div>
      <div style="
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div style="font-size: 12px; color: #666;">
          Total: ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}
        </div>
        <button 
          id="clear-all-notifications-btn"
          style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: background 0.2s;
          "
          onmouseover="this.style.background='#c82333'"
          onmouseout="this.style.background='#dc3545'"
        >Clear All</button>
      </div>
    `;

    editor.Modal.setTitle('📬 Notifications');
    editor.Modal.setContent(modalContent);
    editor.Modal.open();

    // Add event listener for clear button
    setTimeout(() => {
      const clearBtn = document.getElementById('clear-all-notifications-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          clearNotifications();
          editor.Modal.close();
        });
      }
    }, 100);
  }

  // Register commands FIRST (before adding button)
  editor.Commands.add('toggle-notifications', {
    run(editor) {
      showNotificationsModal(editor);
    }
  });

  // Register commands FIRST (before adding button)
  editor.Commands.add('toggle-notifications', {
    run(editor) {
      showNotificationsModal(editor);
    }
  });

  editor.Commands.add('notifications:add', {
    run(editor, sender, options = {}) {
      addNotification(options);
    }
  });

  editor.Commands.add('notifications:remove', {
    run(editor, sender, options = {}) {
      if (options.id) {
        removeNotification(options.id);
      }
    }
  });

  editor.Commands.add('notifications:clear', {
    run(editor) {
      clearNotifications();
    }
  });

  // Add notification button to navbar AFTER commands are registered
  const panels = editor.Panels;
  const notificationsPanelId = 'notifications-panel-btn';

  panels.addButton('options', {
    id: notificationsPanelId,
    className: 'fa fa-bell notifications-btn',
    command: 'toggle-notifications',
    attributes: { title: 'Notifications' },
    active: false,
  });



  // Expose API on editor
  editor.Notifications = {
    add: addNotification,
    remove: removeNotification,
    clear: clearNotifications,
    getAll: () => [...notifications],
    get: (id) => notifications.find(n => n.id === id)
  };

  // Capture console errors and warnings (optional)
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function(...args) {
    originalError.apply(console, args);
    addNotification({
      type: 'error',
      message: args.join(' '),
      timeout: 0 // Don't auto-hide errors
    });
  };

  console.warn = function(...args) {
    originalWarn.apply(console, args);
    addNotification({
      type: 'warning',
      message: args.join(' ')
    });
  };

  console.log("✅ Notifications Plugin initialized successfully");

  return {
    add: addNotification,
    remove: removeNotification,
    clear: clearNotifications
  };
}

// Make it globally available
window.initNotificationsPlugin = initNotificationsPlugin;