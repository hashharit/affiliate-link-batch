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
        els.failureList.innerHTML = "";
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
        els.historyList.innerHTML = "";
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

    function buildDialog() {
      const overlay = document.createElement("div");
      overlay.id = OVERLAY_ID;
      overlay.className = "alb-dialog-overlay";
      overlay.hidden = true;

      overlay.innerHTML = `
        <div class="alb-dialog" role="dialog" aria-modal="true" aria-label="Affiliate Link Batch">
          <header class="alb-dialog-header">
            <h2>Affiliate Link Batch</h2>
            <button type="button" class="alb-dialog-close" aria-label="Close">&times;</button>
          </header>
          <nav class="alb-dialog-tabs">
            <button type="button" data-tab="extract" class="alb-tab active">Extract</button>
            <button type="button" data-tab="output" class="alb-tab">Output</button>
            <button type="button" data-tab="failures" class="alb-tab">Failures</button>
            <button type="button" data-tab="history" class="alb-tab">History</button>
            <button type="button" data-tab="settings" class="alb-tab">Settings</button>
          </nav>
          <div class="alb-dialog-body">
            <section data-panel="extract" class="alb-panel active">
              <p class="alb-extract-progress">0 / 0</p>
              <p class="alb-status">Select products and click the floating button to start.</p>
              <div class="alb-extract-actions">
                <button type="button" class="alb-select-all">Select all on page</button>
                <button type="button" class="alb-clear-all">Clear all</button>
                <button type="button" class="alb-cancel-batch" disabled>Cancel</button>
              </div>
            </section>
            <section data-panel="output" class="alb-panel">
              <textarea class="alb-output" readonly placeholder="Successful lines appear here"></textarea>
              <button type="button" class="alb-copy-all" disabled>Copy all</button>
            </section>
            <section data-panel="failures" class="alb-panel">
              <ul class="alb-failure-list"></ul>
              <div class="alb-failure-actions">
                <button type="button" class="alb-copy-failed-urls" disabled>Copy failed URLs</button>
                <button type="button" class="alb-retry-failed" disabled>Retry failed</button>
              </div>
            </section>
            <section data-panel="history" class="alb-panel">
              <p class="alb-hint">Saved on this device only. Up to ${ALB.runHistory.MAX_RUNS} recent runs.</p>
              <p class="alb-history-empty" hidden>No runs yet. Complete a batch to see it here.</p>
              <ul class="alb-history-list"></ul>
              <button type="button" class="alb-clear-history" disabled>Clear history</button>
            </section>
            <section data-panel="settings" class="alb-panel">
              <form class="alb-settings-form">
                <label>Output template
                  <input name="outputTemplate" type="text" />
                </label>
                <p class="alb-hint">Placeholders: {title} {affiliate_link} {url} {asin}</p>
                <div class="alb-separator-field">
                  <label>Separator
                    <select name="separatorPreset"></select>
                  </label>
                  <label class="alb-separator-custom">Custom separator
                    <input name="outputSeparatorCustom" type="text" placeholder="\\n or |" />
                  </label>
                </div>
                <p class="alb-hint">Choose a preset or pick Custom. Use \\n for newline, \\t for tab.</p>
                <label>Store ID (SiteStripe)
                  <input name="associateStoreId" type="text" placeholder="e.g. yourstore-21" />
                </label>
                <label>Tracking ID (SiteStripe)
                  <input name="associateTrackingId" type="text" placeholder="e.g. yourstore-21" />
                </label>
                <p class="alb-hint">Auto-filled from your first successful link in a batch. Edit if you use multiple stores.</p>
                <label class="alb-checkbox-setting">
                  <input name="useBackgroundApi" type="checkbox" />
                  Use background API when possible (no product tab flash)
                </label>
                <label>Delay between products (ms)
                  <input name="delayMs" type="number" min="2000" max="10000" step="100" />
                </label>
                <label>SiteStripe timeout (ms)
                  <input name="siteStripeTimeoutMs" type="number" min="5000" max="60000" step="1000" />
                </label>
                <label class="alb-checkbox-setting">
                  <input name="showDialogOnExtract" type="checkbox" />
                  Show dialog when extraction starts
                </label>
                <button type="submit" class="alb-save-settings">Save settings</button>
                <p class="alb-settings-saved" hidden>Saved.</p>
              </form>
            </section>
          </div>
        </div>
      `;

      const presetSelect = overlay.querySelector('[name="separatorPreset"]');
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