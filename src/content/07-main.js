(function (ALB) {
  const DESKTOP_MIN_WIDTH = 900;

  function markActive(reason) {
    document.documentElement.dataset.albActive = reason;
  }

  function showInitError(error) {
    console.error("[ALB] Failed to initialize", error);
    markActive("error");

    const banner = document.createElement("div");
    banner.className = "alb-init-error";
    banner.textContent = `Affiliate Link Batch failed to load: ${error?.message || error}`;
    document.documentElement.appendChild(banner);
  }

  function bootstrap() {
    if (!ALB.amazonAdapter.isSearchPage(window.location)) {
      console.info("[ALB] Not a search page, skipping UI", window.location.href);
      return;
    }

    let products = [];
    let batchRunning = false;
    let hasCompletedResults = false;
    let completedBatchKey = null;
    let lastFailures = [];
    let lastResultsTab = "output";
    let resultsObserver = null;

    function selectionKey(selection) {
      return selection
        .map((item) => item.product?.id || item.product?.asin || item.id || item.asin)
        .filter(Boolean)
        .sort()
        .join("\u0000");
    }

    function selectionMatchesCompletedBatch(selection) {
      return (
        hasCompletedResults &&
        completedBatchKey != null &&
        selectionKey(selection) === completedBatchKey
      );
    }

    function clearCompletedResults() {
      hasCompletedResults = false;
      completedBatchKey = null;
    }

    const checkboxInjector = ALB.createCheckboxInjector({
      onSelectionChange(selection) {
        if (!batchRunning && !selectionMatchesCompletedBatch(selection)) {
          clearCompletedResults();
        }
        if (!batchRunning) {
          updateFloatingButton(selection);
        }
      },
    });

    async function refreshHistoryUi() {
      const runs = await ALB.runHistory.list();
      dialog.renderHistory(runs);
      dialog.setHistoryTabBadge(runs.length);
      floatingButton.setHistoryCount(runs.length);
    }

    function openHistoryRun(run) {
      lastFailures = run.failures || [];
      lastResultsTab = run.output ? "output" : "failures";
      dialog.setOutput(run.output || "");
      dialog.setFailures(lastFailures);

      if (run.cancelled) {
        dialog.setStatus("Cancelled run. Partial results loaded from history.");
      } else if (lastFailures.length) {
        dialog.setStatus(
          `History run: ${run.successCount} succeeded, ${lastFailures.length} failed.`
        );
      } else {
        dialog.setStatus(`History run: ${run.successCount} links loaded.`);
      }

      dialog.showTab(lastResultsTab);
    }

    const dialog = ALB.createDialog({
      onSelectAll: () => {
        products = ALB.amazonAdapter.findProductCards();
        checkboxInjector.selectAll(products);
      },
      onClearAll: () => checkboxInjector.clearAll(),
      onCancelBatch: async () => {
        await ALB.sendToBackground("CANCEL_BATCH");
        dialog.setStatus("Cancelling after current product...");
      },
      onRetryFailed: () => startBatch(lastFailures, { retry: true }),
      onCopyFailedUrls: async () => {
        const urls = lastFailures
          .map((f) => f.url || f.product?.url)
          .filter(Boolean)
          .join("\n");
        if (urls) {
          await navigator.clipboard.writeText(urls);
        }
      },
      onSaveSettings: async () => {
        const partial = dialog.getSettingsFromForm();
        await ALB.saveSettings(partial);
        dialog.flashSettingsSaved();
      },
      onShowHistory: () => refreshHistoryUi(),
      onOpenHistoryRun: (run) => openHistoryRun(run),
      onCopyHistoryRun: async (run) => {
        if (!run.output) {
          return;
        }
        try {
          await navigator.clipboard.writeText(run.output);
        } catch (error) {
          console.error("[ALB] Copy history output failed", error);
        }
      },
      onClearHistory: async () => {
        if (!window.confirm("Clear all saved runs on this device?")) {
          return;
        }
        await ALB.runHistory.clear();
        await refreshHistoryUi();
      },
    });

    const floatingButton = ALB.createFloatingButton({
      onHistoryClick: async () => {
        dialog.show();
        dialog.showTab("history");
        await refreshHistoryUi();
      },
      onClick: async (event) => {
        if (batchRunning) {
          dialog.show();
          dialog.showTab("extract");
          return;
        }

        const selection = checkboxInjector.getSelection();
        if (selection.length === 0) {
          dialog.show();
          dialog.showTab("extract");
          dialog.setStatus("Select at least one product first.");
          return;
        }

        if (selectionMatchesCompletedBatch(selection) && !event?.shiftKey) {
          dialog.show();
          dialog.showTab(lastResultsTab);
          return;
        }

        await startBatch(selection);
      },
    });

    async function startBatch(selection, options = {}) {
      const settings = await ALB.getSettings();

      if (settings.showDialogOnExtract || options.retry) {
        dialog.show();
        dialog.showTab("extract");
      }

      clearCompletedResults();
      batchRunning = true;
      resultsObserver?.disconnect();
      ALB.startBatchKeepalive();
      checkboxInjector.setDisabled(true);
      dialog.setBatchUiActive(true);
      floatingButton.setState({
        text: `0 / ${selection.length}`,
        disabled: false,
        progressRatio: 0,
        progressText: `0 / ${selection.length}`,
      });

      dialog.setStatus("Starting batch extraction...");
      dialog.setOutput("");
      if (!options.retry) {
        dialog.setFailures([]);
      }

      const payload = selection.map((item) =>
        item.product
          ? {
              id: item.product.id,
              asin: item.product.asin,
              title: item.product.title,
              url: item.product.url,
              sponsored: item.product.sponsored,
            }
          : {
              id: item.id,
              asin: item.asin,
              title: item.title,
              url: item.url,
              sponsored: item.sponsored,
            }
      );

      try {
        const ping = await ALB.sendToBackground("PING");
        if (!ping?.ok) {
          throw new Error("Background script not responding. Reload the extension in about:debugging.");
        }

        console.info("[ALB] Starting batch for", payload.length, "products");
        const response = await ALB.sendToBackground("START_BATCH", { products: payload });
        if (!response?.ok) {
          finishBatchUi();
          dialog.setStatus(response?.error || "Could not start batch.");
        }
      } catch (error) {
        console.error("[ALB] Batch start failed", error);
        finishBatchUi();
        dialog.setStatus(`Background error: ${error?.message || error}`);
      }
    }

    function finishBatchUi() {
      batchRunning = false;
      ALB.stopBatchKeepalive();
      checkboxInjector.setDisabled(false);
      dialog.setBatchUiActive(false);
      observeResults();
      updateFloatingButton(checkboxInjector.getSelection());
    }

    function updateFloatingButton(selection) {
      if (batchRunning) {
        return;
      }

      const selectedCount = selection.length;
      if (selectedCount === 0) {
        floatingButton.setState({ text: "Select products", disabled: true });
        return;
      }

      if (selectionMatchesCompletedBatch(selection)) {
        floatingButton.setState({
          text: `View results (${selectedCount})`,
          disabled: false,
        });
        return;
      }

      floatingButton.setState({
        text: `Get affiliate links (${selectedCount})`,
        disabled: false,
      });
    }

    function refreshProducts() {
      products = ALB.amazonAdapter.findProductCards();
      checkboxInjector.injectAll(products, { notify: !batchRunning });
      const sponsored = products.filter((p) => p.sponsored).length;
      console.info(
        "[ALB] Found product cards:",
        products.length,
        `(sponsored: ${sponsored})`
      );
    }

    function observeResults() {
      resultsObserver?.disconnect();

      const target =
        document.querySelector(".s-main-slot.s-result-list") ||
        document.querySelector('[data-component-type="s-search-results"]') ||
        document.body;

      resultsObserver = new MutationObserver(() => {
        refreshProducts();
      });

      resultsObserver.observe(target, { childList: true, subtree: true });
    }

    browser.runtime.onMessage.addListener((message) => {
      switch (message?.type) {
        case "BATCH_PROGRESS":
          dialog.setProgress(message.current, message.total, message.title);
          floatingButton.setState({
            text: `${message.current} / ${message.total}`,
            disabled: false,
            progressRatio: message.current / message.total,
            progressText: `${message.current} / ${message.total}`,
          });
          break;

        case "BATCH_COMPLETE": {
          const selection = checkboxInjector.getSelection();
          hasCompletedResults = true;
          completedBatchKey = selectionKey(selection);
          lastResultsTab = message.output ? "output" : "failures";
          finishBatchUi();
          lastFailures = message.failures || [];
          dialog.setOutput(message.output || "");
          dialog.setFailures(lastFailures);

          if (message.cancelled) {
            dialog.setStatus("Batch cancelled. Partial results are available.");
          } else if (lastFailures.length) {
            dialog.setStatus(
              `Done. ${message.successes?.length || 0} succeeded, ${lastFailures.length} failed.`
            );
          } else {
            dialog.setStatus(`Done. ${message.successes?.length || 0} links copied to output.`);
          }

          dialog.showTab(lastResultsTab);

          ALB.runHistory
            .add({
              completedAt: Date.now(),
              searchUrl: window.location.href,
              productCount: message.total || selection.length,
              successCount: message.successes?.length || 0,
              failureCount: lastFailures.length,
              cancelled: Boolean(message.cancelled),
              output: message.output || "",
              failures: lastFailures,
              selectionKey: completedBatchKey,
            })
            .then(() => refreshHistoryUi())
            .catch((error) => console.error("[ALB] Failed to save run history", error));
          break;
        }

        case "BATCH_ERROR":
          finishBatchUi();
          dialog.setStatus(`Batch error: ${message.error}`);
          break;

        case "SETTINGS_UPDATED":
          dialog.loadSettings();
          break;

        default:
          break;
      }
    });

    refreshProducts();
    observeResults();
    updateFloatingButton([]);
    dialog.loadSettings();
    refreshHistoryUi().catch((error) => console.error("[ALB] Failed to load run history", error));
    markActive("yes");

    console.info("[ALB] Affiliate Link Batch active on search page");
  }

  try {
    bootstrap();
  } catch (error) {
    showInitError(error);
  }
})(window.ALB);