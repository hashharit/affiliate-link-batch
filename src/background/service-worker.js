console.info("[ALB] Affiliate Link Batch background started");

browser.runtime.onConnect.addListener((port) => {
  if (port.name !== "alb-batch-keepalive") {
    return;
  }
  console.info("[ALB] Batch keepalive port connected");
  port.onMessage.addListener(() => {});
  port.onDisconnect.addListener(() => {
    console.info("[ALB] Batch keepalive port disconnected");
  });
});

browser.runtime.onMessage.addListener((message, sender) => {
  const sourceTabId = sender.tab?.id;

  switch (message?.type) {
    case "PING":
      return Promise.resolve({
        ok: true,
        version: browser.runtime.getManifest().version,
      });

    case "START_BATCH":
      console.info("[ALB] START_BATCH", message.products?.length, "products from tab", sourceTabId);
      return AlbBatch.start(message.products, sourceTabId);

    case "CANCEL_BATCH":
      return Promise.resolve(AlbBatch.cancel());

    case "RETRY_FAILED":
      return AlbBatch.retryFailed(message.failures, sourceTabId);

    default:
      return undefined;
  }
});