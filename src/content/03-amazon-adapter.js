(function (ALB) {
  const SEARCH_PATH = /^\/s(?:\/|$)/;

  const CARD_SELECTORS = [
    '[data-component-type="s-search-result"][data-asin]',
    ".s-result-item.s-asin[data-asin]",
    ".s-result-item[data-asin]",
  ];

  function isAmazonHost(hostname) {
    const host = hostname.replace(/^www\./, "");
    return host === "amazon.in" || host === "amazon.com";
  }

  ALB.amazonAdapter = {
    isSearchPage(location) {
      if (!isAmazonHost(location.hostname)) {
        return false;
      }
      return SEARCH_PATH.test(location.pathname) || location.pathname === "/s";
    },

    findProductCards(root = document) {
      const products = [];
      const processed = new WeakSet();

      for (const selector of CARD_SELECTORS) {
        for (const card of root.querySelectorAll(selector)) {
          if (processed.has(card)) {
            continue;
          }
          processed.add(card);

          const asin = card.getAttribute("data-asin")?.trim();
          if (!asin) {
            continue;
          }

          const product = extractProductFromCard(card, asin, window.location, products.length);
          if (product) {
            products.push(product);
          }
        }
      }

      return products;
    },
  };

  function extractProductFromCard(card, asin, location, index) {
    const titleEl =
      card.querySelector("h2 a span") ||
      card.querySelector("h2 span") ||
      card.querySelector("[data-cy='title-recipe'] span") ||
      card.querySelector("a.a-link-normal span") ||
      card.querySelector("[data-cy='title-recipe-title']");

    const title = titleEl?.textContent?.trim();
    const url = resolveProductUrl(card, asin, location);

    if (!title || !url) {
      return null;
    }

    const mount =
      card.querySelector('[data-cy="asin-faceout-container"]') ||
      card.querySelector(".puis-card-container") ||
      card;

    const instanceKey =
      card.getAttribute("data-uuid") ||
      card.getAttribute("data-index") ||
      String(index);

    return {
      id: `${asin}-${instanceKey}`,
      asin,
      title,
      url,
      sponsored: isSponsoredCard(card),
      element: card,
      mount,
    };
  }

  function isSponsoredCard(card) {
    return (
      card.classList.contains("AdHolder") ||
      !!card.querySelector('[data-component-type="sp-sponsored-result"]') ||
      !!card.closest(".AdHolder")
    );
  }

  function resolveProductUrl(card, asin, location) {
    const candidates = card.querySelectorAll("a[href]");
    for (const link of candidates) {
      const href = link.getAttribute("href");
      if (!href) {
        continue;
      }

      const resolved = resolveHref(href, location);
      if (resolved) {
        return resolved;
      }
    }

    return ALB.amazonAdapter.buildProductUrl(asin, location);
  }

  function resolveHref(href, location) {
    try {
      const absolute = new URL(href, location.origin);

      if (absolute.pathname.includes("/sspa/click")) {
        const encodedTarget = absolute.searchParams.get("url");
        if (encodedTarget) {
          const target = new URL(encodedTarget, location.origin);
          if (target.pathname.includes("/dp/")) {
            return target.toString();
          }
        }
      }

      if (absolute.pathname.includes("/dp/")) {
        return absolute.toString();
      }
    } catch (_error) {
      return null;
    }

    return null;
  }

  ALB.amazonAdapter.buildProductUrl = function buildProductUrl(asin, location) {
    const host = location.hostname.includes("amazon.com")
      ? "www.amazon.com"
      : "www.amazon.in";
    return `https://${host}/dp/${asin}`;
  };
})(window.ALB);