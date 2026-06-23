(function (ALB) {
  const DEFAULT_SETTINGS = {
    outputTemplate: "{title} : {affiliate_link}",
    outputSeparator: "\n",
    delayMs: 2000,
    siteStripeTimeoutMs: 15000,
    showDialogOnExtract: true,
    associateStoreId: "",
    associateTrackingId: "",
    useBackgroundApi: true,
  };

  ALB.SEPARATOR_PRESETS = [
    { id: "newline", label: "New line", value: "\n" },
    { id: "comma", label: "Comma (, )", value: ", " },
    { id: "semicolon", label: "Semicolon (;)", value: ";" },
    { id: "tab", label: "Tab", value: "\t" },
    { id: "pipe", label: "Pipe ( | )", value: " | " },
    { id: "custom", label: "Custom…", value: null },
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  ALB.parseSeparatorLiteral = function parseSeparatorLiteral(raw) {
    if (raw == null) {
      return "\n";
    }
    return String(raw).replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  };

  ALB.detectSeparatorPreset = function detectSeparatorPreset(value) {
    const match = ALB.SEPARATOR_PRESETS.find(
      (preset) => preset.id !== "custom" && preset.value === value
    );
    return match ? match.id : "custom";
  };

  ALB.resolveSeparatorFromForm = function resolveSeparatorFromForm(presetId, customValue) {
    if (presetId === "custom") {
      return ALB.parseSeparatorLiteral(customValue);
    }
    const preset = ALB.SEPARATOR_PRESETS.find((item) => item.id === presetId);
    return preset?.value ?? "\n";
  };

  ALB.formatSeparatorForInput = function formatSeparatorForInput(value) {
    return String(value).replace(/\n/g, "\\n").replace(/\t/g, "\\t");
  };

  ALB.getSettings = async function getSettings() {
    const stored = await browser.storage.sync.get(DEFAULT_SETTINGS);
    return {
      outputTemplate: stored.outputTemplate ?? DEFAULT_SETTINGS.outputTemplate,
      outputSeparator: stored.outputSeparator ?? DEFAULT_SETTINGS.outputSeparator,
      delayMs: clamp(stored.delayMs ?? DEFAULT_SETTINGS.delayMs, 2000, 10000),
      siteStripeTimeoutMs: clamp(
        stored.siteStripeTimeoutMs ?? DEFAULT_SETTINGS.siteStripeTimeoutMs,
        5000,
        60000
      ),
      showDialogOnExtract:
        stored.showDialogOnExtract ?? DEFAULT_SETTINGS.showDialogOnExtract,
      associateStoreId: stored.associateStoreId ?? DEFAULT_SETTINGS.associateStoreId,
      associateTrackingId:
        stored.associateTrackingId ?? DEFAULT_SETTINGS.associateTrackingId,
      useBackgroundApi: stored.useBackgroundApi ?? DEFAULT_SETTINGS.useBackgroundApi,
    };
  };

  ALB.saveSettings = async function saveSettings(partial) {
    await browser.storage.sync.set(partial);
  };

})(window.ALB);