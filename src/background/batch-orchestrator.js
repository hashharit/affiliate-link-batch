const AlbBatch = {
  running: false,
  cancelled: false,
  sourceTabId: null,
  currentProducts: [],

  async start(products, sourceTabId) {
    if (this.running) {
      return { ok: false, error: "A batch is already running" };
    }

    if (!products?.length) {
      return { ok: false, error: "No products selected" };
    }

    this.running = true;
    this.cancelled = false;
    this.sourceTabId = sourceTabId;
    this.currentProducts = products;

    this.runBatch(products).catch((error) => {
      console.error("[ALB] Batch failed", error);
      this.notify(this.sourceTabId, {
        type: "BATCH_ERROR",
        error: error?.message || String(error),
      });
    }).finally(() => {
      this.running = false;
      this.cancelled = false;
      AlbWorkerTab.close();
    });

    return { ok: true, started: true };
  },

  cancel() {
    if (!this.running) {
      return { ok: false, error: "No batch running" };
    }
    this.cancelled = true;
    return { ok: true };
  },

  async retryFailed(failures, sourceTabId) {
    const products = failures
      .map((failure) => failure.product || failure)
      .filter(Boolean);

    if (!products.length) {
      return { ok: false, error: "No failed products to retry" };
    }

    return this.start(products, sourceTabId);
  },

  async runBatch(products) {
    let settings = await albGetSettings();
    const successes = [];
    const failures = [];
    const total = products.length;

    AlbWorkerTab.setSourceTab(this.sourceTabId);

    try {
      for (let index = 0; index < products.length; index++) {
        if (this.cancelled) {
          break;
        }

        const product = products[index];
        const current = index + 1;

        this.notify(this.sourceTabId, {
          type: "BATCH_PROGRESS",
          current,
          total,
          title: product.title,
        });

        console.info(
          "[ALB] Processing",
          current,
          "/",
          total,
          product.asin || product.url
        );
        const outcome = await this.processProduct(product, settings.siteStripeTimeoutMs, settings);
        console.info("[ALB] Result", current, outcome.ok ? "ok" : outcome.reason);

        if (outcome.ok && outcome.associateCredentials) {
          const saved = await albAutoSaveAssociateCredentials(
            outcome.associateCredentials,
            settings
          );
          if (saved) {
            settings = await albGetSettings();
            this.notify(this.sourceTabId, { type: "SETTINGS_UPDATED" });
          }
        }

        if (outcome.ok) {
          successes.push({ product, affiliateLink: outcome.link });
        } else {
          failures.push({
            product,
            title: product.title,
            url: product.url,
            reason: outcome.reason || "Unknown error",
          });
        }

        if (index < products.length - 1 && !this.cancelled) {
          await albDelay(settings.delayMs);
        }
      }
    } finally {
      await AlbWorkerTab.close();
    }

    const separator = albParseSeparator(settings.outputSeparator);
    const output = albFormatOutput(settings.outputTemplate, separator, successes);

    this.notify(this.sourceTabId, {
      type: "BATCH_COMPLETE",
      cancelled: this.cancelled,
      successes,
      failures,
      output,
      total,
    });
  },

  async processProduct(product, siteStripeTimeoutMs, settings) {
    let lastReason = "Unknown error";

    if (settings.useBackgroundApi && settings.associateTrackingId?.trim()) {
      try {
        const bgResult = await AlbSiteStripeApi.fetchShortLink(product, settings);
        if (bgResult.ok) {
          return bgResult;
        }
        console.warn("[ALB] Background API failed, using worker tab:", bgResult.reason);
        lastReason = bgResult.reason || lastReason;
      } catch (error) {
        console.warn("[ALB] Background API error, using worker tab:", error);
        lastReason = error?.message || String(error);
      }
    }

    try {
      await AlbWorkerTab.navigate(product.url);
    } catch (error) {
      return { ok: false, reason: error?.message || String(error) };
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await AlbWorkerTab.extractAffiliateLink(siteStripeTimeoutMs);
        if (result.ok) {
          return result;
        }
        lastReason = result.reason || lastReason;
        console.warn("[ALB] Worker extract attempt", attempt + 1, "failed:", lastReason);
      } catch (error) {
        lastReason = error?.message || String(error);
        console.warn("[ALB] Worker extract attempt", attempt + 1, "error:", lastReason);
      }

      if (attempt === 0) {
        await albDelay(albIsAmazonThrottleError(lastReason) ? 5000 : 2500);
      }
    }

    return { ok: false, reason: lastReason };
  },

  notify(tabId, payload) {
    if (tabId == null) {
      return;
    }
    browser.tabs.sendMessage(tabId, payload).catch((error) => {
      console.warn("[ALB] Could not notify tab", error);
    });
  },
};

function albDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function albIsAmazonThrottleError(reason) {
  const text = String(reason || "").toLowerCase();
  return text.includes("unable to generate") || text.includes("try again");
}