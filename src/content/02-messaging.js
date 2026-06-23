(function (ALB) {
  let keepalivePort = null;
  let keepaliveTimer = null;

  ALB.sendToBackground = function sendToBackground(type, payload = {}) {
    return browser.runtime.sendMessage({ type, ...payload });
  };

  ALB.startBatchKeepalive = function startBatchKeepalive() {
    ALB.stopBatchKeepalive();
    try {
      keepalivePort = browser.runtime.connect({ name: "alb-batch-keepalive" });
      keepaliveTimer = setInterval(() => {
        try {
          keepalivePort?.postMessage({ ping: Date.now() });
        } catch (_error) {
          ALB.stopBatchKeepalive();
        }
      }, 5000);
      keepalivePort.onDisconnect.addListener(() => {
        ALB.stopBatchKeepalive();
      });
    } catch (error) {
      console.warn("[ALB] Could not open keepalive port:", error);
    }
  };

  ALB.stopBatchKeepalive = function stopBatchKeepalive() {
    if (keepaliveTimer != null) {
      clearInterval(keepaliveTimer);
      keepaliveTimer = null;
    }
    if (keepalivePort != null) {
      try {
        keepalivePort.disconnect();
      } catch (_error) {
        // Port may already be gone.
      }
      keepalivePort = null;
    }
  };
})(window.ALB);