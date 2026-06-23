const AlbWorkerTab = {
  tabId: null,
  sourceTabId: null,
  canHideTabs: typeof browser.tabs.hide === "function",
  workerIsHidden: false,

  setSourceTab(tabId) {
    this.sourceTabId = tabId;
  },

  async acquire() {
    if (this.tabId != null) {
      try {
        await browser.tabs.get(this.tabId);
        return this.tabId;
      } catch (_error) {
        this.tabId = null;
      }
    }

    const tab = await browser.tabs.create({ url: "about:blank", active: false });
    this.tabId = tab.id;
    this.workerIsHidden = false;

    if (this.canHideTabs) {
      try {
        await browser.tabs.hide(tab.id);
        this.workerIsHidden = true;
      } catch (error) {
        console.warn("[ALB] tabs.hide failed:", error);
      }
    } else {
      console.info("[ALB] tabs.hide not supported; using inactive background tab");
    }

    return tab.id;
  },

  async navigate(url, timeoutMs = 60000) {
    const tabId = await this.acquire();
    const tab = await browser.tabs.get(tabId);
    const normalizedUrl = albCanonicalProductUrl(url);
    const targetAsin = albAsinFromUrl(normalizedUrl);
    const currentAsin = albAsinFromUrl(tab.url || "");

    if (targetAsin && targetAsin === currentAsin) {
      console.info("[ALB] Worker already on", targetAsin, "- skipping navigation");
      await albDelay(1000);
      return tabId;
    }

    await new Promise((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        browser.tabs.onUpdated.removeListener(onUpdated);
        reject(new Error("Navigation timeout"));
      }, timeoutMs);

      function onUpdated(updatedId, info) {
        if (updatedId !== tabId || info.status !== "complete") {
          return;
        }
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        browser.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }

      browser.tabs.onUpdated.addListener(onUpdated);
      browser.tabs.update(tabId, { url: normalizedUrl }).catch((error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        browser.tabs.onUpdated.removeListener(onUpdated);
        reject(error);
      });
    });

    console.info("[ALB] Worker navigated to", normalizedUrl);
    await albDelay(1500);
    return tabId;
  },

  async activateWorker() {
    if (this.tabId == null) {
      return;
    }
    await browser.tabs.update(this.tabId, { active: true });
    console.info("[ALB] Worker tab activated");
  },

  async restoreSourceTab() {
    if (this.sourceTabId == null) {
      return;
    }
    try {
      await browser.tabs.update(this.sourceTabId, { active: true });
    } catch (error) {
      console.warn("[ALB] Could not restore source tab:", error);
    }
  },

  async rehide() {
    if (this.tabId == null) {
      return;
    }

    if (this.canHideTabs) {
      try {
        await browser.tabs.hide(this.tabId);
        this.workerIsHidden = true;
        console.info("[ALB] Worker tab hidden");
        return;
      } catch (error) {
        console.warn("[ALB] tabs.hide failed:", error);
      }
    }

    await browser.tabs.update(this.tabId, { active: false });
    await this.restoreSourceTab();
    console.info("[ALB] Worker tab deactivated, source tab restored");
  },

  async close() {
    if (this.tabId == null) {
      return;
    }
    try {
      await browser.tabs.remove(this.tabId);
    } catch (_error) {
      // Tab may already be closed.
    }
    this.tabId = null;
    this.workerIsHidden = false;
    await this.restoreSourceTab();
  },

  async waitForSiteStripe(timeoutMs) {
    const tabId = this.tabId;
    if (tabId == null) {
      return false;
    }

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const [{ result }] = await browser.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          func: albSiteStripeReadyInPage,
        });
        if (result?.ready) {
          console.info("[ALB] SiteStripe ready on worker tab");
          return true;
        }
      } catch (error) {
        console.warn("[ALB] SiteStripe probe error:", error?.message || error);
      }
      await albDelay(500);
    }
    return false;
  },

  async extractAffiliateLink(siteStripeTimeoutMs) {
    if (this.tabId == null) {
      return { ok: false, reason: "Worker tab not available" };
    }

    try {
      console.info("[ALB] Activating worker tab for SiteStripe API (must stay focused during fetch)");
      await this.activateWorker();

      const ready = await this.waitForSiteStripe(siteStripeTimeoutMs);
      if (!ready) {
        return {
          ok: false,
          reason:
            "SiteStripe not detected. Log into Amazon Associates with SiteStripe enabled.",
        };
      }

      await albDelay(800);
      return await this.runExtraction(siteStripeTimeoutMs);
    } finally {
      await this.restoreSourceTab();
      console.info("[ALB] Returned to search tab");
    }
  },

  async runExtraction(siteStripeTimeoutMs) {
    const tabId = this.tabId;
    if (tabId == null) {
      return { ok: false, reason: "Worker tab not available" };
    }

    try {
      const [{ result }] = await browser.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: albExtractAffiliateLinkInPage,
        args: [siteStripeTimeoutMs],
      });
      console.info(
        "[ALB] Extraction result:",
        result?.ok ? `ok (${result.kind || "link"})` : result?.reason
      );
      return result || { ok: false, reason: "No result from page script" };
    } catch (error) {
      console.error("[ALB] executeScript failed:", error);
      return { ok: false, reason: error?.message || String(error) };
    }
  },

};

function albAsinFromUrl(urlString) {
  try {
    const match = new URL(urlString).pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    return match ? match[1].toUpperCase() : null;
  } catch (_error) {
    return null;
  }
}

function albCanonicalProductUrl(urlString) {
  try {
    const asin = albAsinFromUrl(urlString);
    if (!asin) {
      return urlString;
    }
    const host = urlString.includes("amazon.com") ? "www.amazon.com" : "www.amazon.in";
    return `https://${host}/dp/${asin}`;
  } catch (_error) {
    return urlString;
  }
}

function albDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function albSiteStripeReadyInPage() {
  const button = document.querySelector("#amzn-ss-get-link-button");
  const root =
    document.querySelector("#nav-AssociateStripe") ||
    document.querySelector("#amzn-ss-wrap");
  const moduleLoader = window.P || window.AmazonUIPageJS;
  return {
    ready: Boolean(
      root && button && !button.disabled && typeof moduleLoader?.when === "function"
    ),
  };
}

function albExtractAffiliateLinkInPage(siteStripeTimeoutMs) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function isValidLink(link) {
    if (!link) {
      return false;
    }
    return (
      link.includes("amzn.to") ||
      link.includes("amazon.in") ||
      link.includes("amazon.com") ||
      link.startsWith("http")
    );
  }

  function getModuleLoader() {
    return window.P || window.AmazonUIPageJS;
  }

  function isDetailPage(context) {
    return context.isDetailPage === "1" || context.isDetailPage === true;
  }

  function buildLinkContext(context, storeData, storeTag, subType) {
    const detailPage = isDetailPage(context);
    const C = {
      toolCreation: "SS",
      adUnitType: "TEXT",
      adUnitDescription: "Product links Text only link",
      destinationType: detailPage ? "ASIN" : "MULTIPLE",
      marketplaceId: context.marketplaceId,
      store: storeData.storeId,
      tag: storeData.trackingId,
      asin: storeTag.getAsin(),
      adUnitSubType: subType,
    };

    if (subType === "ShortLinks") {
      C.linkCode = detailPage
        ? context.linkCode.textShortLink_dp
        : context.linkCode.textShortLink_ndp;
    } else {
      C.linkCode = detailPage
        ? context.linkCode.textLongLink_dp
        : context.linkCode.textLongLink_ndp;
    }

    return C;
  }

  function buildLongUrl(storeTag, linkIdMod, context, sitestripe, ga, C) {
    let longUrl = storeTag.getLongUrlTemplate();
    const linkId = linkIdMod.get(C);
    longUrl = longUrl.split("__LINKCODE__").join(C.linkCode);
    longUrl = longUrl.split("__REFTAG__").join(context.refTag.textLink);
    longUrl = longUrl.split("__TRACKINGID__").join(C.tag);
    longUrl = longUrl.split("__LINKID__").join(linkId);

    const language = sitestripe.getLanguagePreferance?.();
    if (language) {
      longUrl = longUrl.split("__LANGUAGE__").join(language);
    }

    if (ga?.isGlobalAvailabilityWidgetEnabled?.()) {
      longUrl = longUrl.split("__GA_OPT_IN_STATUS__").join(String(ga.isOptedIn()));
      if (!ga.isOptedIn()) {
        longUrl = longUrl.split("__GA_OPT_OUT_TIME__").join(String(Date.now()));
      }
    }

    return longUrl;
  }

  function fetchShortUrl(longUrl, context, C, enhanced) {
    const params = new URLSearchParams({
      longUrl,
      marketplaceId: String(C.marketplaceId),
    });
    if (enhanced) {
      params.set("storeId", String(C.store));
    }

    return fetch(`/associates/sitestripe/getShortUrl?${params}`, {
      credentials: "include",
      headers: { Accept: "application/json, text/javascript, */*; q=0.01" },
    }).then((response) => response.json());
  }

  function fetchViaSiteStripeModules(timeoutMs) {
    const loader = getModuleLoader();
    if (!loader?.when) {
      return Promise.resolve({ error: "Amazon page modules not loaded" });
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ error: "SiteStripe module timeout" });
      }, timeoutMs);

      loader
        .when(
          "A",
          "amzn-ss-store-tag",
          "amzn-ss-link-id",
          "amzn-ss-context",
          "amzn-ss-sitestripe",
          "amzn-ss-global-availability"
        )
        .execute(function (_A, storeTag, linkIdMod, context, sitestripe, ga) {
          try {
            const storeData = storeTag.getGlobalStoreTag();
            if (!storeData?.trackingId) {
              clearTimeout(timer);
              resolve({ error: "No SiteStripe tracking ID configured" });
              return;
            }

            const enhanced = Boolean(context.isCreatorLinkingEnhancementEnabled);
            const shortContext = buildLinkContext(
              context,
              storeData,
              storeTag,
              "ShortLinks"
            );
            const longUrl = buildLongUrl(
              storeTag,
              linkIdMod,
              context,
              sitestripe,
              ga,
              shortContext
            );

            fetchShortUrl(longUrl, context, shortContext, enhanced)
              .then((data) => {
                const credentials = {
                  storeId: storeData.storeId,
                  trackingId: storeData.trackingId,
                };

                if (data?.isOk && data.shortUrl) {
                  clearTimeout(timer);
                  resolve({ link: data.shortUrl, kind: "short", associateCredentials: credentials });
                  return;
                }

                const fullContext = buildLinkContext(
                  context,
                  storeData,
                  storeTag,
                  "FullLinks"
                );
                const fullUrl = buildLongUrl(
                  storeTag,
                  linkIdMod,
                  context,
                  sitestripe,
                  ga,
                  fullContext
                );
                clearTimeout(timer);
                resolve({
                  link: fullUrl,
                  kind: "full",
                  associateCredentials: credentials,
                  warning: data?.shortUrl === null ? "Short URL unavailable, using full link" : undefined,
                });
              })
              .catch((error) => {
                clearTimeout(timer);
                resolve({ error: error?.message || "getShortUrl request failed" });
              });
          } catch (error) {
            clearTimeout(timer);
            resolve({ error: error?.message || String(error) });
          }
        });
    });
  }

  return (async () => {
    try {
      await sleep(800);
      const result = await fetchViaSiteStripeModules(siteStripeTimeoutMs);
      const link = result?.link;

      if (link && isValidLink(link)) {
        return {
          ok: true,
          link,
          kind: result.kind,
          associateCredentials: result.associateCredentials,
        };
      }

      return {
        ok: false,
        reason: result?.error || "Could not fetch affiliate link via SiteStripe API",
      };
    } catch (error) {
      return { ok: false, reason: error?.message || String(error) };
    }
  })();
}