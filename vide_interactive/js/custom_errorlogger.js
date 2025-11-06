function initNotificationsPlugin(editor) {
    console.log("🔔 Initializing Notifications Plugin...");
    if (editor.Notifications) {
        console.log("✅ Notifications Plugin already initialized");
        return editor.Notifications;
    }

    // ====================== API configuration ======================
    const API_BASE_URL = 'http://192.168.0.188:8081';
    const API_ENDPOINTS = {
        logError: `${API_BASE_URL}/jsonLog`,
        fetchLogs: `${API_BASE_URL}/jsonLog`
    };

    // ====================== Plugin configuration ======================
    const notificationConfig = {
        timeout: 3000,
        maxNotifications: 5,
        reverse: false,
        recordsPerPage: 10,
        icons: {
            error: '✖',
            warning: '⚠',
            success: '✔',
            info: 'ℹ',
            debug: '•',
            event: '⟲'
        },
        i18n: {
            error: 'Error',
            warning: 'Warning',
            success: 'Success',
            info: 'Info',
            debug: 'Debug',
            event: 'Event',
            close: 'Close'
        }
    };

    // ====================== Container & styles ======================
    let notificationContainer = document.getElementById('gjs-notifications-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'gjs-notifications-container';
        notificationContainer.className = 'gjs-notifications-wrapper';
        document.body.appendChild(notificationContainer);
    }

    const notifications = [];

    const style = document.createElement('style');
    style.textContent = `
        .gjs-notifications-wrapper { position: fixed; top: 60px; right: 20px; z-index: 10000; max-width: 400px; pointer-events: none; }
        .gjs-notification { background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.15); margin-bottom: 12px; padding: 16px 20px; display: flex; align-items: flex-start; gap: 12px; animation: slideIn .3s ease-out; pointer-events: auto; border-left: 4px solid #ccc; transition: all .3s ease; }
        .gjs-notification:hover { box-shadow: 0 6px 16px rgba(0,0,0,.2); transform: translateX(-4px); }
        @keyframes slideIn { from { opacity: 0; transform: translateX(100%);} to { opacity: 1; transform: translateX(0);} }
        @keyframes slideOut { from { opacity: 1; transform: translateX(0);} to { opacity: 0; transform: translateX(100%);} }
        .gjs-notification.removing { animation: slideOut .3s ease-out forwards; }
        .gjs-notification__icon { font-size: 20px; font-weight: bold; flex-shrink: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
        .gjs-notification__content { flex: 1; min-width: 0; }
        .gjs-notification__type { font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; letter-spacing: .5px; }
        .gjs-notification__message { font-size: 14px; line-height: 1.4; color: #333; word-wrap: break-word; }
        .gjs-notification__close { background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #666; flex-shrink: 0; transition: color .2s; }
        .gjs-notification__close:hover { color: #000; }
        .gjs-notification__error { border-left-color: #dc3545; }
        .gjs-notification__error .gjs-notification__icon, .gjs-notification__error .gjs-notification__type { color: #dc3545; }
        .gjs-notification__warning { border-left-color: #ffc107; }
        .gjs-notification__warning .gjs-notification__icon, .gjs-notification__warning .gjs-notification__type { color: #ffc107; }
        .gjs-notification__success { border-left-color: #28a745; }
        .gjs-notification__success .gjs-notification__icon, .gjs-notification__success .gjs-notification__type { color: #28a745; }
        .gjs-notification__info { border-left-color: #17a2b8; }
        .gjs-notification__info .gjs-notification__icon, .gjs-notification__info .gjs-notification__type { color: #17a2b8; }
        .gjs-notification__debug { border-left-color: #6c757d; }
        .gjs-notification__debug .gjs-notification__icon, .gjs-notification__debug .gjs-notification__type { color: #6c757d; }
        .gjs-notification__event { border-left-color: #17a2b8; }
        .gjs-notification__event .gjs-notification__icon, .gjs-notification__event .gjs-notification__type { color: #17a2b8; }
        .gjs-pn-btn.notifications-btn { position: relative; }
        .notifications-badge { position: absolute; top: 5px; right: 5px; background: #dc3545; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 10px; font-weight: bold; min-width: 18px; text-align: center; }
        .date-filter-container { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px; display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
        .date-filter-group { display: flex; flex-direction: column; gap: 5px; }
        .date-filter-label { font-size: 12px; font-weight: 600; color: #666; }
        .date-filter-input { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; outline: none; transition: border-color .2s; }
        .date-filter-input:focus { border-color: #007bff; }
        .date-filter-button { padding: 7px 16px; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; transition: all .2s; font-weight: 500; }
        .date-filter-button.submit { background: #007bff; color: #fff; }
        .date-filter-button.submit:hover { background: #0056b3; }
        .date-filter-button.reset { background: #6c757d; color: #fff; }
        .date-filter-button.reset:hover { background: #545b62; }
        .pagination-container { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; }
        .pagination-button { background: #007bff; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background .2s; }
        .pagination-button:hover:not(:disabled) { background: #0056b3; }
        .pagination-button:disabled { background: #ccc; cursor: not-allowed; }
        .pagination-info { font-size: 13px; color: #666; }
        .loading-spinner { text-align: center; padding: 40px; color: #666; }
        .error-message { text-align: center; padding: 40px; color: #dc3545; }
    `;
    document.head.appendChild(style);

    // ====================== API helpers ======================
    async function logToBackend({ level, message, context }) {
        try {
            const cleanMessage = typeof message === 'string'
                ? message.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
                : String(message);

            const response = await fetch(API_ENDPOINTS.logError, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level: level || 'info', message: cleanMessage, context: context || {} })
            });

            if (!response.ok) {
                console.error('Failed to log to backend:', response.statusText);
            }
        } catch (error) {
            console.error('Error logging to backend:', error);
        }
    }

    async function fetchLogsFromBackend(fromDate = null, toDate = null) {
        try {
            let url = API_ENDPOINTS.fetchLogs;
            if (fromDate && toDate) url += `?from=${fromDate}&to=${toDate}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }
    }

    // ====================== UI helpers ======================
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

        const closeBtn = notifEl.querySelector('.gjs-notification__close');
        closeBtn.addEventListener('click', () => removeNotification(id));

        return notifEl;
    }

    function addNotification(notification) {
        const {
            type = 'info',
            message,
            timeout = notificationConfig.timeout,
            context = {}
        } = notification;

        if (!message) {
            console.warn('Notification message is required');
            return;
        }

        // mirror to backend with level + context
        logToBackend({ level: type, message, context });

        const id = Date.now() + Math.random();
        const notif = { id, type, message, timestamp: new Date(), context };
        notifications.push(notif);

        while (notifications.length > notificationConfig.maxNotifications) {
            const removed = notifications.shift();
            removeNotificationFromDOM(removed.id);
        }

        const notifEl = createNotificationElement(notif);
        if (notificationConfig.reverse) {
            notificationContainer.insertBefore(notifEl, notificationContainer.firstChild);
        } else {
            notificationContainer.appendChild(notifEl);
        }

        if (timeout > 0) setTimeout(() => removeNotification(id), timeout);

        updateBadge();
        editor.trigger('notifications:added', notif);
        editor.trigger('notifications:changed', notifications);
        return id;
    }

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

    function removeNotificationFromDOM(id) {
        const notifEl = notificationContainer.querySelector(`[data-notification-id="${id}"]`);
        if (notifEl) {
            notifEl.classList.add('removing');
            setTimeout(() => { if (notifEl.parentNode) notifEl.parentNode.removeChild(notifEl); }, 300);
        }
    }

    function clearNotifications() {
        const toRemove = [...notifications];
        notifications.length = 0;
        toRemove.forEach(n => removeNotificationFromDOM(n.id));
        updateBadge();
        editor.trigger('notifications:cleared');
        editor.trigger('notifications:changed', notifications);
    }

    function updateBadge() {
        const badge = document.querySelector('.notifications-badge');
        const errorCount = notifications.filter(n => n.type === 'error').length;
        if (badge) {
            if (errorCount > 0) { badge.textContent = errorCount; badge.style.display = 'block'; }
            else { badge.style.display = 'none'; }
        }
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // ====================== Logs modal (renders level correctly) ======================
    function renderNotificationLogs(logs, currentPage, totalPages) {
        if (logs.length === 0) {
            return '<div style="text-align: center; padding: 40px; color: #999;">No notifications found</div>';
        }

        const startIndex = (currentPage - 1) * notificationConfig.recordsPerPage;
        const endIndex = startIndex + notificationConfig.recordsPerPage;
        const paginatedLogs = logs.slice(startIndex, endIndex);

        const colorMap = { error:'#dc3545', warning:'#ff9800', success:'#28a745', info:'#17a2b8', debug:'#6c757d', event:'#17a2b8' };

        return paginatedLogs.map(log => {
            const level = (log.type || log.level || 'error').toLowerCase();
            const icon = notificationConfig.icons[level] || notificationConfig.icons.info;
            const typeLabel = notificationConfig.i18n[level] || level;
            const color = colorMap[level] || '#17a2b8';
            const msg = log.message || '(No message)';
            const timestampStr = (log.date && log.time)
                ? `${formatDate(log.date)} ${log.time}`
                : (log.timestamp ? `${formatDate(log.timestamp)} ${new Date(log.timestamp).toLocaleTimeString()}` : '');

            return `
                <div style="background:#f8f9fa; border-radius:6px; padding:12px 16px; margin-bottom:10px; border-left:4px solid ${color}; transition:all .2s;"
                     onmouseover="this.style.background='#e9ecef'; this.style.transform='translateX(-2px)'"
                     onmouseout="this.style.background='#f8f9fa'; this.style.transform='translateX(0)'">
                    <div style="display:flex; align-items:flex-start; gap:10px;">
                        <div style="font-size:18px; color:${color}; font-weight:bold; flex-shrink:0;">${icon}</div>
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:${color}; letter-spacing:.5px;">${typeLabel}</div>
                                <div style="font-size:11px; color:#666;">${timestampStr}</div>
                            </div>
                            <div style="font-size:13px; color:#333; line-height:1.4; word-wrap:break-word;">${msg}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function showNotificationsModal(editor) {
        let allLogs = [];
        let currentPage = 1;
        let fromDate = getTodayDate();
        let toDate = getTodayDate();

        const showLoadingState = () => {
            const modalContent = `
<div class="date-filter-container">
  <div class="date-filter-group">
    <label class="date-filter-label">From Date</label>
    <input type="date" id="filter-from-date" class="date-filter-input" value="${fromDate}">
  </div>
  <div class="date-filter-group">
    <label class="date-filter-label">To Date</label>
    <input type="date" id="filter-to-date" class="date-filter-input" value="${toDate}">
  </div>
  <button id="submit-filter-btn" class="date-filter-button submit">Submit</button>
  <button id="reset-filter-btn" class="date-filter-button reset">Reset</button>
  <button id="export-excel-btn" class="date-filter-button submit">Export Excel</button>
</div>`;
            editor.Modal.setContent(modalContent);
        };

        const showErrorState = (errorMsg) => {
            const modalContent = `
<div class="date-filter-container">
  <div class="date-filter-group">
    <label class="date-filter-label">From Date</label>
    <input type="date" id="filter-from-date" class="date-filter-input" value="${fromDate}">
  </div>
  <div class="date-filter-group">
    <label class="date-filter-label">To Date</label>
    <input type="date" id="filter-to-date" class="date-filter-input" value="${toDate}">
  </div>
  <button id="submit-filter-btn" class="date-filter-button submit">Submit</button>
  <button id="reset-filter-btn" class="date-filter-button reset">Reset</button>
</div>
<div class="error-message">${errorMsg}</div>`;
            editor.Modal.setContent(modalContent);
            attachFilterEventListeners();
        };

        const renderModal = () => {
            const totalPages = Math.ceil(allLogs.length / notificationConfig.recordsPerPage);
            const notificationsList = renderNotificationLogs(allLogs, currentPage, totalPages);

            const modalContent = `
<div class="date-filter-container">
  <div class="date-filter-group">
    <label class="date-filter-label">From Date</label>
    <input type="date" id="filter-from-date" class="date-filter-input" value="${fromDate}">
  </div>
  <div class="date-filter-group">
    <label class="date-filter-label">To Date</label>
    <input type="date" id="filter-to-date" class="date-filter-input" value="${toDate}">
  </div>
  <button id="submit-filter-btn" class="date-filter-button submit">Submit</button>
  <button id="reset-filter-btn" class="date-filter-button reset">Reset</button>
  <button id="export-excel-btn" class="date-filter-button submit">Export Excel</button>
</div>
<div style="max-height: 400px; overflow-y: auto; padding: 10px;">
  ${notificationsList}
</div>
${totalPages > 1 ? `
  <div class="pagination-container">
    <button id="prev-page-btn" class="pagination-button" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
    <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
    <button id="next-page-btn" class="pagination-button" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
  </div>` : ''}
<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; text-align: center;">
  <div style="font-size: 12px; color: #666;">
    Total: ${allLogs.length} notification${allLogs.length !== 1 ? 's' : ''}
  </div>
</div>`;
            editor.Modal.setContent(modalContent);
            attachEventListeners();
            attachExportEventListener();
        };

        const attachFilterEventListeners = () => {
            setTimeout(() => {
                const submitBtn = document.getElementById('submit-filter-btn');
                const resetBtn = document.getElementById('reset-filter-btn');
                const fromDateInput = document.getElementById('filter-from-date');
                const toDateInput = document.getElementById('filter-to-date');

                if (submitBtn) {
                    submitBtn.addEventListener('click', async () => {
                        fromDate = fromDateInput.value;
                        toDate = toDateInput.value;
                        currentPage = 1;
                        await loadLogs();
                    });
                }

                if (resetBtn) {
                    resetBtn.addEventListener('click', async () => {
                        fromDate = getTodayDate();
                        toDate = getTodayDate();
                        currentPage = 1;
                        await loadLogs();
                    });
                }
            }, 100);
        };

        function attachExportEventListener() {
            const exportBtn = document.getElementById('export-excel-btn');
            if (!exportBtn) return;

            exportBtn.addEventListener('click', () => {
                if (!allLogs || allLogs.length === 0) {
                    alert('No notifications to export.');
                    return;
                }

                console.log("🧾 Exporting Excel Report...", allLogs);

                const wsData = allLogs.map((log, index) => {
                    const typeValue = typeof log.type === 'string'
                        ? log.type.toUpperCase()
                        : (log.level ? String(log.level).toUpperCase() : 'ERROR');

                    const dateValue = log.date
                        ? log.date
                        : log.timestamp
                            ? formatDate(log.timestamp)
                            : '';

                    const timeValue = log.time
                        ? log.time
                        : log.timestamp
                            ? new Date(log.timestamp).toLocaleTimeString()
                            : '';

                    const messageValue = log.message || '(No message)';

                    return {
                        SNo: index + 1,
                        Type: typeValue,
                        Message: messageValue,
                        Date: dateValue,
                        Time: timeValue
                    };
                });

                if (wsData.length === 0) {
                    alert('No valid notification data to export.');
                    return;
                }

                try {
                    const ws = XLSX.utils.json_to_sheet(wsData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Notifications");
                    const filename = `notifications_${getTodayDate()}.xlsx`;
                    XLSX.writeFile(wb, filename);
                    console.log(`✅ Excel exported: ${filename}`);
                } catch (err) {
                    console.error("❌ Excel export failed:", err);
                    alert("Failed to export Excel. Check console for details.");
                }
            });
        }

        const attachEventListeners = () => {
            setTimeout(() => {
                const prevBtn = document.getElementById('prev-page-btn');
                const nextBtn = document.getElementById('next-page-btn');

                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        if (currentPage > 1) {
                            currentPage--;
                            renderModal();
                        }
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        const totalPages = Math.ceil(allLogs.length / notificationConfig.recordsPerPage);
                        if (currentPage < totalPages) {
                            currentPage++;
                            renderModal();
                        }
                    });
                }

                attachFilterEventListeners();
            }, 100);
        };

        const loadLogs = async () => {
            try {
                editor.Modal.setTitle('📬 Notifications');
                const skeleton = '<div class="loading-spinner">Loading...</div>';
                editor.Modal.setContent(skeleton);
                allLogs = await fetchLogsFromBackend(fromDate, toDate);
                renderModal();
            } catch (error) {
                const errMsg = 'Failed to load notifications. Please try again.';
                const wrap = (m) => `<div class="error-message">${m}</div>`;
                editor.Modal.setContent(wrap(errMsg));
            }
        };

        editor.Modal.setTitle('📬 Notifications');
        editor.Modal.open();
        await loadLogs();
    }

    // ====================== Commands & UI wiring ======================
    editor.Commands.add('toggle-notifications', { run(ed) { showNotificationsModal(ed); } });
    editor.Commands.add('notifications:add', { run(ed, s, opts = {}) { addNotification(opts); } });
    editor.Commands.add('notifications:remove', { run(ed, s, opts = {}) { if (opts.id) removeNotification(opts.id); } });
    editor.Commands.add('notifications:clear', { run() { clearNotifications(); } });

    editor.on("load", () => {
        const devicesPanel = editor.Panels.getPanel("devices-c");
        if (devicesPanel) {
            const buttons = devicesPanel.get("buttons");
            buttons.add([{
                id: 'notifications-panel-btn',
                className: "fa fa-bell notifications-btn",
                command: "toggle-notifications",
                attributes: { title: "Notifications" }
            }]);
        }
    });

    setTimeout(() => {
        const btnEl = document.querySelector('.notifications-btn');
        if (btnEl && !btnEl.querySelector('.notifications-badge')) {
            const badge = document.createElement('span');
            badge.className = 'notifications-badge';
            badge.style.display = 'none';
            btnEl.appendChild(badge);
        }
    }, 100);

    // ====================== Expose editor API ======================
    editor.Notifications = {
        add: addNotification,
        remove: removeNotification,
        clear: clearNotifications,
        getAll: () => [...notifications],
        get: (id) => notifications.find(n => n.id === id)
    };

    // ====================== DesignerLogger (no console interception) ======================
    (function exposeDesignerLogger() {
        let DEFAULT_CONTEXT = {};
        const emit = (level, message, ctx = {}) => {
            const merged = Object.assign({}, DEFAULT_CONTEXT, ctx);
            // mirror to UI
            editor.Notifications.add({ type: level, message: (typeof message === 'string' ? message : JSON.stringify(message, null, 2)), context: merged, timeout: level === 'error' ? 0 : notificationConfig.timeout });
            // ship to backend
            logToBackend({ level, message, context: merged });
        };

        const api = {
            log:    (m, c) => emit('info', m, c),
            info:   (m, c) => emit('info', m, c),
            warn:   (m, c) => emit('warning', m, c),
            error:  (m, c) => emit('error', m, c),
            success:(m, c) => emit('success', m, c),
            debug:  (m, c) => emit('debug', m, c),
            event:  (name, c = {}) => emit('event', `EVENT: ${name}`, c),
            try(fn, ctx = {}, onError) {
                try { return fn(); }
                catch (err) {
                    emit('error', err && err.stack ? err.stack : String(err), ctx);
                    if (onError) onError(err);
                }
            },
            setDefaultContext(ctx) { DEFAULT_CONTEXT = ctx || {}; }
        };

        // make globally reachable
        window.DesignerLogger = api;
    })();

    console.log("✅ Notifications Plugin initialized successfully");
    return { add: addNotification, remove: removeNotification, clear: clearNotifications };
}

// Make it globally available
window.initNotificationsPlugin = initNotificationsPlugin;
