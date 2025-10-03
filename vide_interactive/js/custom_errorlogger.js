function customErrorLogger(editor) {
  // Global log store
  window.gjsErrorLogs = [];

  // Config state
  let config = {
    currentLevel: "Severe",
    suspendMessages: false,
    showConsoleOnError: true,
    showFullTrace: false,
  };

  // Severity ranking
  const severityRank = {
    "Severe": 1,
    "Warning": 2,
    "Info": 3,
    "Finest": 4,
  };

  // Logging function
  function logError(err, context = "Unknown", level = "Severe") {
    if (config.suspendMessages) return;

    const errorMessage =
      err instanceof Error ? err.message : (err?.toString?.() || "Unknown error");
    const errorStack =
      err instanceof Error && err.stack ? err.stack : "No stack trace available";

    const errorObj = {
      time: new Date().toLocaleString(),
      context,
      message: errorMessage,
      stack: errorStack,
      level,
    };

    window.gjsErrorLogs.push(errorObj);

    if (config.showConsoleOnError) {
      const color =
        level === "Severe" ? "color:red" :
        level === "Warning" ? "color:orange" :
        level === "Info" ? "color:blue" :
        "color:gray";
      console.error(`%c[${level}] ${context}: ${errorMessage}`, color, err);
    }

    updateErrorModal();
  }

  // Modal renderer
  const modal = editor.Modal;
  function updateErrorModal() {
    const logs = window.gjsErrorLogs.filter(
      log => severityRank[log.level] <= severityRank[config.currentLevel]
    );

    let html = `
      <div style="font-family: sans-serif; font-size: 13px;">
        <div style="margin-bottom: 10px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
          <!-- Dropdown -->
          <label><b>Detail Level:</b>
            <select id="error-filter-level">
              ${Object.keys(severityRank).map(level =>
                `<option value="${level}" ${config.currentLevel === level ? "selected" : ""}>${level}</option>`
              ).join("")}
            </select>
          </label>

          <!-- Checkboxes -->
          <label><input type="checkbox" id="error-suspend" ${config.suspendMessages ? "checked" : ""}/> Suspend Messages</label>
          <label><input type="checkbox" id="error-console" ${config.showConsoleOnError ? "checked" : ""}/> Show Console on Error</label>
          <label><input type="checkbox" id="error-trace" ${config.showFullTrace ? "checked" : ""}/> Show Full Exception Trace</label>
        </div>
    `;

    if (logs.length === 0) {
      html += `<p style="color: gray;">No errors logged at this level.</p>`;
    } else {
      html += `<div style="max-height: 300px; overflow-y: auto;">`;
      logs.forEach((log, i) => {
        const color =
          log.level === "Severe" ? "red" :
          log.level === "Warning" ? "orange" :
          log.level === "Info" ? "blue" : "gray";

        html += `
          <div style="margin-bottom:8px; padding:6px; border:1px solid #ddd; border-radius:5px">
            <strong>#${i + 1} [${log.level}] - ${log.time}</strong><br/>
            <b>Context:</b> ${log.context}<br/>
            <b>Message:</b> ${log.message}<br/>
            ${config.showFullTrace ? `<pre style="white-space: pre-wrap; font-size: 11px;">${log.stack}</pre>` : ""}
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;

    modal.setTitle("Error Logs");
    modal.setContent(html);

    // Bind controls
    setTimeout(() => {
      document.getElementById("error-filter-level").onchange = (e) => {
        config.currentLevel = e.target.value;
        updateErrorModal();
      };
      document.getElementById("error-suspend").onchange = (e) => {
        config.suspendMessages = e.target.checked;
      };
      document.getElementById("error-console").onchange = (e) => {
        config.showConsoleOnError = e.target.checked;
      };
      document.getElementById("error-trace").onchange = (e) => {
        config.showFullTrace = e.target.checked;
        updateErrorModal();
      };
    }, 0);
  }

  editor.on("load", () => {
    const devicesPanel = editor.Panels.getPanel("devices-c");

    if (devicesPanel) {
      const buttons = devicesPanel.get("buttons");

      buttons.add([{
        id: "error-logger-btn",
        className: "fa fa-bug",
        command: "open-error-logger",
        attributes: {
          title: "View Errorss"
        }
      }]);
    }
  });


  // Command
  editor.Commands.add("open-error-logger", {
    run() {
      updateErrorModal();
      modal.open();
    },
  });

  // GrapesJS command wrapper
  const origRunCommand = editor.runCommand.bind(editor);
  editor.runCommand = function (id, opts = {}) {
    try {
      return origRunCommand(id, opts);
    } catch (err) {
      logError(err, `Command: ${id}`, "Severe");
      throw err;
    }
  };

  // Global error handlers
  window.onerror = function (message, source, lineno, colno, error) {
    logError(error || message, `Global Error at ${source}:${lineno}:${colno}`, "Severe");
  };
  window.onunhandledrejection = function (event) {
    logError(event.reason, "Unhandled Promise Rejection", "Warning");
  };

  // --- Wrap fetch for network issues ---
  const origFetch = window.fetch;
  window.fetch = function (...args) {
    return origFetch(...args).catch(err => {
      logError(err, `Fetch Error: ${args[0]}`, "Warning");
      throw err;
    });
  };

  // --- Wrap XMLHttpRequest for network issues ---
  const origXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return origXhrOpen.call(this, method, url, ...rest);
  };
  const origXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("error", () => logError(new Error("XHR error"), `XHR Error: ${this._url}`, "Warning"));
    this.addEventListener("timeout", () => logError(new Error("XHR timeout"), `XHR Timeout: ${this._url}`, "Warning"));
    this.addEventListener("abort", () => logError(new Error("XHR aborted"), `XHR Abort: ${this._url}`, "Info"));
    return origXhrSend.apply(this, args);
  };

  // Expose API
  window.gjsLogError = logError;
}
