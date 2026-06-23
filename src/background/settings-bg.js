const ALB_DEFAULT_SETTINGS = {
  outputTemplate: "{title} : {affiliate_link}",
  outputSeparator: "\n",
  delayMs: 2000,
  siteStripeTimeoutMs: 15000,
  showDialogOnExtract: true,
  associateStoreId: "",
  associateTrackingId: "",
  useBackgroundApi: true,
};

function albClamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

async function albAutoSaveAssociateCredentials(credentials, settings) {
  const storeId = credentials?.storeId?.trim();
  const trackingId = credentials?.trackingId?.trim();
  if (!storeId || !trackingId) {
    return false;
  }

  const hasStore = Boolean(settings.associateStoreId?.trim());
  const hasTracking = Boolean(settings.associateTrackingId?.trim());
  if (hasStore && hasTracking) {
    return false;
  }

  await browser.storage.sync.set({
    associateStoreId: storeId,
    associateTrackingId: trackingId,
    useBackgroundApi: true,
  });
  console.info("[ALB] Auto-saved SiteStripe credentials:", storeId, trackingId);
  return true;
}

async function albGetSettings() {
  const stored = await browser.storage.sync.get(ALB_DEFAULT_SETTINGS);
  return {
    outputTemplate: stored.outputTemplate ?? ALB_DEFAULT_SETTINGS.outputTemplate,
    outputSeparator: stored.outputSeparator ?? ALB_DEFAULT_SETTINGS.outputSeparator,
    delayMs: albClamp(stored.delayMs ?? ALB_DEFAULT_SETTINGS.delayMs, 2000, 10000),
    siteStripeTimeoutMs: albClamp(
      stored.siteStripeTimeoutMs ?? ALB_DEFAULT_SETTINGS.siteStripeTimeoutMs,
      5000,
      60000
    ),
    showDialogOnExtract:
      stored.showDialogOnExtract ?? ALB_DEFAULT_SETTINGS.showDialogOnExtract,
    associateStoreId: stored.associateStoreId ?? ALB_DEFAULT_SETTINGS.associateStoreId,
    associateTrackingId:
      stored.associateTrackingId ?? ALB_DEFAULT_SETTINGS.associateTrackingId,
    useBackgroundApi: stored.useBackgroundApi ?? ALB_DEFAULT_SETTINGS.useBackgroundApi,
  };
}