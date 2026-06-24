(function (ALB) {
  const OVERLAY_ID = "alb-dialog-overlay";

  ALB.createDialog = function createDialog(handlers = {}) {
    let overlay = document.getElementById(OVERLAY_ID);

    function showTab(name) {
      overlay.querySelectorAll(".alb-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.tab === name);
      });
      overlay.querySelectorAll(".alb-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === name);
      });
    }

    if (!overlay) {
      overlay = buildDialog();
      document.documentElement.appendChild(overlay);
      wireDialogEvents(overlay, handlers, showTab);
    }

    const els = {
      overlay,
      status: overlay.querySelector(".alb-status"),
      progress: overlay.querySelector(".alb-extract-progress"),
      cancelBtn: overlay.querySelector(".alb-cancel-batch"),
      output: overlay.querySelector(".alb-output"),
      copyAllBtn: overlay.querySelector(".alb-copy-all"),
      failureList: overlay.querySelector(".alb-failure-list"),
      copyFailedBtn: overlay.querySelector(".alb-copy-failed-urls"),
      retryFailedBtn: overlay.querySelector(".alb-retry-failed"),
      selectAllBtn: overlay.querySelector(".alb-select-all"),
      clearAllBtn: overlay.querySelector(".alb-clear-all"),
      settingsForm: overlay.querySelector(".alb-settings-form"),
      settingsSaved: overlay.querySelector(".alb-settings-saved"),
      historyList: overlay.querySelector(".alb-history-list"),
      historyEmpty: overlay.querySelector(".alb-history-empty"),
      clearHistoryBtn: overlay.querySelector(".alb-clear-history"),
      historyTab: overlay.querySelector('[data-tab="history"]'),
    };

    return {
      show() {
        overlay.hidden = false;
      },
      hide() {
        overlay.hidden = true;
      },
      showTab,
      setStatus(text) {
        els.status.textContent = text;
      },
      setProgress(current, total, title) {
        els.status.textContent = `${current} / ${total} — Getting link for: ${title}`;
        els.progress.textContent = `${current} / ${total}`;
      },
      setOutput(text) {
        els.output.value = text;
        els.copyAllBtn.disabled = !text;
      },
      setFailures(failures) {
        els.failureList.replaceChildren();
        for (const failure of failures) {
          const item = document.createElement("li");
          item.className = "alb-failure-item";

          const title = document.createElement("div");
          title.className = "alb-failure-title";
          title.textContent = failure.title || failure.product?.title || "Unknown product";

          const link = document.createElement("a");
          link.className = "alb-failure-url";
          link.href = failure.url || failure.product?.url || "#";
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = failure.url || failure.product?.url || "";

          const reason = document.createElement("div");
          reason.className = "alb-failure-reason";
          reason.textContent = failure.reason || "Unknown error";

          item.append(title, link, reason);
          els.failureList.appendChild(item);
        }

        const hasFailures = failures.length > 0;
        els.copyFailedBtn.disabled = !hasFailures;
        els.retryFailedBtn.disabled = !hasFailures;
      },
      setBatchUiActive(active) {
        els.cancelBtn.disabled = !active;
        els.selectAllBtn.disabled = active;
        els.clearAllBtn.disabled = active;
      },
      async loadSettings() {
        const settings = await ALB.getSettings();
        els.settingsForm.outputTemplate.value = settings.outputTemplate;
        els.settingsForm.separatorPreset.value = ALB.detectSeparatorPreset(
          settings.outputSeparator
        );
        els.settingsForm.outputSeparatorCustom.value = ALB.formatSeparatorForInput(
          settings.outputSeparator
        );
        els.settingsForm.delayMs.value = settings.delayMs;
        els.settingsForm.siteStripeTimeoutMs.value = settings.siteStripeTimeoutMs;
        els.settingsForm.showDialogOnExtract.checked = settings.showDialogOnExtract;
        els.settingsForm.associateStoreId.value = settings.associateStoreId || "";
        els.settingsForm.associateTrackingId.value = settings.associateTrackingId || "";
        els.settingsForm.useBackgroundApi.checked = settings.useBackgroundApi;
        syncSeparatorCustomVisibility(els.settingsForm);
      },
      flashSettingsSaved() {
        els.settingsSaved.hidden = false;
        setTimeout(() => {
          els.settingsSaved.hidden = true;
        }, 2000);
      },
      getSettingsFromForm() {
        return {
          outputTemplate: els.settingsForm.outputTemplate.value,
          outputSeparator: ALB.resolveSeparatorFromForm(
            els.settingsForm.separatorPreset.value,
            els.settingsForm.outputSeparatorCustom.value
          ),
          delayMs: Number(els.settingsForm.delayMs.value),
          siteStripeTimeoutMs: Number(els.settingsForm.siteStripeTimeoutMs.value),
          showDialogOnExtract: els.settingsForm.showDialogOnExtract.checked,
          associateStoreId: els.settingsForm.associateStoreId.value.trim(),
          associateTrackingId: els.settingsForm.associateTrackingId.value.trim(),
          useBackgroundApi: els.settingsForm.useBackgroundApi.checked,
        };
      },
      setHistoryTabBadge(count) {
        if (!els.historyTab) {
          return;
        }
        const base = "History";
        els.historyTab.textContent = count > 0 ? `${base} (${count})` : base;
      },
      renderHistory(runs) {
        els.historyList.replaceChildren();
        const hasRuns = runs.length > 0;
        els.historyEmpty.hidden = hasRuns;
        els.clearHistoryBtn.disabled = !hasRuns;

        for (const run of runs) {
          const item = document.createElement("li");
          item.className = "alb-history-item";

          const when = document.createElement("div");
          when.className = "alb-history-when";
          when.textContent = ALB.runHistory.formatWhen(run.completedAt);

          const summary = document.createElement("div");
          summary.className = "alb-history-summary";
          summary.textContent = ALB.runHistory.formatSummary(run);

          const actions = document.createElement("div");
          actions.className = "alb-history-actions";

          const openBtn = document.createElement("button");
          openBtn.type = "button";
          openBtn.className = "alb-history-open";
          openBtn.textContent = "Open";
          openBtn.addEventListener("click", () => {
            if (handlers.onOpenHistoryRun) {
              handlers.onOpenHistoryRun(run);
            }
          });

          const copyBtn = document.createElement("button");
          copyBtn.type = "button";
          copyBtn.className = "alb-history-copy";
          copyBtn.textContent = "Copy output";
          copyBtn.disabled = !run.output;
          copyBtn.addEventListener("click", async () => {
            if (handlers.onCopyHistoryRun) {
              await handlers.onCopyHistoryRun(run);
            }
          });

          actions.append(openBtn, copyBtn);
          item.append(when, summary, actions);
          els.historyList.appendChild(item);
        }
      },
      elements: els,
    };

    function createLabeledInput(labelText, input) {
      const label = document.createElement("label");
      label.append(labelText, document.createTextNode(" "), input);
      return label;
    }

    function createTabButton(name, active) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.dataset.tab = name;
      tab.className = active ? "alb-tab active" : "alb-tab";
      tab.textContent = name.charAt(0).toUpperCase() + name.slice(1);
      return tab;
    }

    function createPanel(name, active) {
      const panel = document.createElement("section");
      panel.dataset.panel = name;
      panel.className = active ? "alb-panel active" : "alb-panel";
      return panel;
    }

    function buildDialog() {
      const overlay = document.createElement("div");
      overlay.id = OVERLAY_ID;
      overlay.className = "alb-dialog-overlay";
      overlay.hidden = true;

      const dialog = document.createElement("div");
      dialog.className = "alb-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "Affiliate Link Batch");

      const header = document.createElement("header");
      header.className = "alb-dialog-header";
      const title = document.createElement("h2");
      title.textContent = "Affiliate Link Batch";
      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "alb-dialog-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.textContent = "\u00d7";
      header.append(title, closeBtn);

      const tabs = document.createElement("nav");
      tabs.className = "alb-dialog-tabs";
      tabs.append(
        createTabButton("extract", true),
        createTabButton("output", false),
        createTabButton("failures", false),
        createTabButton("history", false),
        createTabButton("settings", false)
      );

      const body = document.createElement("div");
      body.className = "alb-dialog-body";

      const extractPanel = createPanel("extract", true);
      const extractProgress = document.createElement("p");
      extractProgress.className = "alb-extract-progress";
      extractProgress.textContent = "0 / 0";
      const status = document.createElement("p");
      status.className = "alb-status";
      status.textContent = "Select products and click the floating button to start.";
      const extractActions = document.createElement("div");
      extractActions.className = "alb-extract-actions";
      const selectAllBtn = document.createElement("button");
      selectAllBtn.type = "button";
      selectAllBtn.className = "alb-select-all";
      selectAllBtn.textContent = "Select all on page";
      const clearAllBtn = document.createElement("button");
      clearAllBtn.type = "button";
      clearAllBtn.className = "alb-clear-all";
      clearAllBtn.textContent = "Clear all";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "alb-cancel-batch";
      cancelBtn.disabled = true;
      cancelBtn.textContent = "Cancel";
      extractActions.append(selectAllBtn, clearAllBtn, cancelBtn);
      extractPanel.append(extractProgress, status, extractActions);

      const outputPanel = createPanel("output", false);
      const outputArea = document.createElement("textarea");
      outputArea.className = "alb-output";
      outputArea.readOnly = true;
      outputArea.placeholder = "Successful lines appear here";
      const copyAllBtn = document.createElement("button");
      copyAllBtn.type = "button";
      copyAllBtn.className = "alb-copy-all";
      copyAllBtn.disabled = true;
      copyAllBtn.textContent = "Copy all";
      outputPanel.append(outputArea, copyAllBtn);

      const failuresPanel = createPanel("failures", false);
      const failureList = document.createElement("ul");
      failureList.className = "alb-failure-list";
      const failureActions = document.createElement("div");
      failureActions.className = "alb-failure-actions";
      const copyFailedBtn = document.createElement("button");
      copyFailedBtn.type = "button";
      copyFailedBtn.className = "alb-copy-failed-urls";
      copyFailedBtn.disabled = true;
      copyFailedBtn.textContent = "Copy failed URLs";
      const retryFailedBtn = document.createElement("button");
      retryFailedBtn.type = "button";
      retryFailedBtn.className = "alb-retry-failed";
      retryFailedBtn.disabled = true;
      retryFailedBtn.textContent = "Retry failed";
      failureActions.append(copyFailedBtn, retryFailedBtn);
      failuresPanel.append(failureList, failureActions);

      const historyPanel = createPanel("history", false);
      const historyHint = document.createElement("p");
      historyHint.className = "alb-hint";
      historyHint.textContent = `Saved on this device only. Up to ${ALB.runHistory.MAX_RUNS} recent runs.`;
      const historyEmpty = document.createElement("p");
      historyEmpty.className = "alb-history-empty";
      historyEmpty.hidden = true;
      historyEmpty.textContent = "No runs yet. Complete a batch to see it here.";
      const historyList = document.createElement("ul");
      historyList.className = "alb-history-list";
      const clearHistoryBtn = document.createElement("button");
      clearHistoryBtn.type = "button";
      clearHistoryBtn.className = "alb-clear-history";
      clearHistoryBtn.disabled = true;
      clearHistoryBtn.textContent = "Clear history";
      historyPanel.append(historyHint, historyEmpty, historyList, clearHistoryBtn);

      const settingsPanel = createPanel("settings", false);
      const settingsForm = document.createElement("form");
      settingsForm.className = "alb-settings-form";

      const outputTemplateInput = document.createElement("input");
      outputTemplateInput.name = "outputTemplate";
      outputTemplateInput.type = "text";
      settingsForm.append(
        createLabeledInput("Output template", outputTemplateInput),
        Object.assign(document.createElement("p"), {
          className: "alb-hint",
          textContent: "Placeholders: {title} {affiliate_link} {url} {asin}",
        })
      );

      const separatorField = document.createElement("div");
      separatorField.className = "alb-separator-field";
      const presetSelect = document.createElement("select");
      presetSelect.name = "separatorPreset";
      const separatorCustomInput = document.createElement("input");
      separatorCustomInput.name = "outputSeparatorCustom";
      separatorCustomInput.type = "text";
      separatorCustomInput.placeholder = "\\n or |";
      const separatorCustomLabel = document.createElement("label");
      separatorCustomLabel.className = "alb-separator-custom";
      separatorCustomLabel.append("Custom separator", document.createTextNode(" "), separatorCustomInput);
      separatorField.append(
        createLabeledInput("Separator", presetSelect),
        separatorCustomLabel
      );
      settingsForm.append(
        separatorField,
        Object.assign(document.createElement("p"), {
          className: "alb-hint",
          textContent: "Choose a preset or pick Custom. Use \\n for newline, \\t for tab.",
        })
      );

      const storeIdInput = document.createElement("input");
      storeIdInput.name = "associateStoreId";
      storeIdInput.type = "text";
      storeIdInput.placeholder = "e.g. yourstore-21";
      const trackingIdInput = document.createElement("input");
      trackingIdInput.name = "associateTrackingId";
      trackingIdInput.type = "text";
      trackingIdInput.placeholder = "e.g. yourstore-21";
      settingsForm.append(
        createLabeledInput("Store ID (SiteStripe)", storeIdInput),
        createLabeledInput("Tracking ID (SiteStripe)", trackingIdInput),
        Object.assign(document.createElement("p"), {
          className: "alb-hint",
          textContent: "Auto-filled from your first successful link in a batch. Edit if you use multiple stores.",
        })
      );

      const useBackgroundApiInput = document.createElement("input");
      useBackgroundApiInput.name = "useBackgroundApi";
      useBackgroundApiInput.type = "checkbox";
      const useBackgroundApiLabel = document.createElement("label");
      useBackgroundApiLabel.className = "alb-checkbox-setting";
      useBackgroundApiLabel.append(useBackgroundApiInput, " Use background API when possible (no product tab flash)");

      const delayInput = document.createElement("input");
      delayInput.name = "delayMs";
      delayInput.type = "number";
      delayInput.min = "2000";
      delayInput.max = "10000";
      delayInput.step = "100";

      const timeoutInput = document.createElement("input");
      timeoutInput.name = "siteStripeTimeoutMs";
      timeoutInput.type = "number";
      timeoutInput.min = "5000";
      timeoutInput.max = "60000";
      timeoutInput.step = "1000";

      const showDialogInput = document.createElement("input");
      showDialogInput.name = "showDialogOnExtract";
      showDialogInput.type = "checkbox";
      const showDialogLabel = document.createElement("label");
      showDialogLabel.className = "alb-checkbox-setting";
      showDialogLabel.append(showDialogInput, " Show dialog when extraction starts");

      const saveSettingsBtn = document.createElement("button");
      saveSettingsBtn.type = "submit";
      saveSettingsBtn.className = "alb-save-settings";
      saveSettingsBtn.textContent = "Save settings";
      const settingsSaved = document.createElement("p");
      settingsSaved.className = "alb-settings-saved";
      settingsSaved.hidden = true;
      settingsSaved.textContent = "Saved.";

      settingsForm.append(
        useBackgroundApiLabel,
        createLabeledInput("Delay between products (ms)", delayInput),
        createLabeledInput("SiteStripe timeout (ms)", timeoutInput),
        showDialogLabel,
        saveSettingsBtn,
        settingsSaved
      );
      settingsPanel.appendChild(settingsForm);

      body.append(extractPanel, outputPanel, failuresPanel, historyPanel, settingsPanel);
      dialog.append(header, tabs, body);
      overlay.appendChild(dialog);

      for (const preset of ALB.SEPARATOR_PRESETS) {
        const option = document.createElement("option");
        option.value = preset.id;
        option.textContent = preset.label;
        presetSelect.appendChild(option);
      }

      return overlay;
    }

    function syncSeparatorCustomVisibility(form) {
      const isCustom = form.separatorPreset.value === "custom";
      form.outputSeparatorCustom.closest(".alb-separator-custom").hidden = !isCustom;
    }

    function wireDialogEvents(overlay, handlers, showTabFn) {
      overlay.querySelector(".alb-dialog-close").addEventListener("click", () => {
        overlay.hidden = true;
      });

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
          overlay.hidden = true;
        }
      });

      overlay.querySelectorAll(".alb-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          showTabFn(tab.dataset.tab);
          if (tab.dataset.tab === "history" && handlers.onShowHistory) {
            handlers.onShowHistory();
          }
        });
      });

      overlay.querySelector(".alb-clear-history").addEventListener("click", async () => {
        if (handlers.onClearHistory) {
          await handlers.onClearHistory();
        }
      });

      overlay.querySelector(".alb-copy-all").addEventListener("click", async () => {
        const text = overlay.querySelector(".alb-output").value;
        if (!text) {
          return;
        }
        try {
          await navigator.clipboard.writeText(text);
        } catch (error) {
          console.error("[ALB] Copy failed", error);
        }
      });

      overlay.querySelector(".alb-copy-failed-urls").addEventListener("click", async () => {
        if (handlers.onCopyFailedUrls) {
          await handlers.onCopyFailedUrls();
        }
      });

      overlay.querySelector(".alb-retry-failed").addEventListener("click", () => {
        if (handlers.onRetryFailed) {
          handlers.onRetryFailed();
        }
      });

      overlay.querySelector(".alb-cancel-batch").addEventListener("click", () => {
        if (handlers.onCancelBatch) {
          handlers.onCancelBatch();
        }
      });

      overlay.querySelector(".alb-select-all").addEventListener("click", () => {
        if (handlers.onSelectAll) {
          handlers.onSelectAll();
        }
      });

      overlay.querySelector(".alb-clear-all").addEventListener("click", () => {
        if (handlers.onClearAll) {
          handlers.onClearAll();
        }
      });

      const settingsForm = overlay.querySelector(".alb-settings-form");
      settingsForm.separatorPreset.addEventListener("change", () => {
        syncSeparatorCustomVisibility(settingsForm);
      });

      settingsForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (handlers.onSaveSettings) {
          await handlers.onSaveSettings();
        }
      });
    }
  };
})(window.ALB);