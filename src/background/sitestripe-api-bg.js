const AlbSiteStripeApi = {
  async fetchShortLink(product, settings) {
    if (!settings.useBackgroundApi) {
      return { ok: false, reason: "Background API disabled" };
    }

    const storeId = settings.associateStoreId?.trim();
    const trackingId = settings.associateTrackingId?.trim();
    if (!storeId || !trackingId) {
      return {
        ok: false,
        reason: "Set Store ID and Tracking ID in Settings to use background API",
      };
    }

    const domain = albDomainFromProductUrl(product.url);
    const config = albMarketplaceConfig(domain);
    if (!config) {
      return { ok: false, reason: `Unsupported Amazon domain: ${domain}` };
    }

    const asin = product.asin || albAsinFromProductUrl(product.url);
    if (!asin) {
      return { ok: false, reason: "Could not resolve ASIN" };
    }

    const longUrl = albBuildLongUrl({
      config,
      asin,
      storeId,
      trackingId,
      subType: "ShortLinks",
    });

    try {
      const params = new URLSearchParams({
        longUrl,
        marketplaceId: config.marketplaceId,
        storeId,
      });

      const response = await fetch(
        `${config.origin}/associates/sitestripe/getShortUrl?${params}`,
        {
          credentials: "include",
          headers: { Accept: "application/json, text/javascript, */*; q=0.01" },
        }
      );

      if (!response.ok) {
        return { ok: false, reason: `getShortUrl HTTP ${response.status}` };
      }

      const data = await response.json();
      if (data?.isOk && data.shortUrl) {
        console.info("[ALB] Background API short link ok for", asin);
        return { ok: true, link: data.shortUrl, kind: "short" };
      }

      const fullUrl = albBuildLongUrl({
        config,
        asin,
        storeId,
        trackingId,
        subType: "FullLinks",
      });
      console.info("[ALB] Background API using full link for", asin);
      return { ok: true, link: fullUrl, kind: "full" };
    } catch (error) {
      return { ok: false, reason: error?.message || String(error) };
    }
  },
};

function albDomainFromProductUrl(urlString) {
  try {
    const host = new URL(urlString).hostname.replace(/^www\./, "");
    return host.includes("amazon.com") ? "amazon.com" : "amazon.in";
  } catch (_error) {
    return "amazon.in";
  }
}

function albAsinFromProductUrl(urlString) {
  try {
    const match = new URL(urlString).pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    return match ? match[1].toUpperCase() : null;
  } catch (_error) {
    return null;
  }
}

function albMarketplaceConfig(domain) {
  if (domain === "amazon.com") {
    return {
      origin: "https://www.amazon.com",
      marketplaceId: "ATVPDKIKX0DER",
      linkCode: { shortDp: "ll1", longDp: "lg1" },
      refTag: "ss_li",
    };
  }
  return {
    origin: "https://www.amazon.in",
    marketplaceId: "A21TJRUUN4KGV",
    linkCode: { shortDp: "ll1", longDp: "lg1" },
    refTag: "ss_li",
  };
}

function albBuildLongUrl({ config, asin, storeId, trackingId, subType }) {
  const linkCode =
    subType === "ShortLinks" ? config.linkCode.shortDp : config.linkCode.longDp;
  const linkId = albGenerateLinkId({
    marketplaceId: config.marketplaceId,
    store: storeId,
    tag: trackingId,
    asin,
    linkCode,
    adUnitSubType: subType,
  });

  const base = `${config.origin}/dp/${asin}`;
  const params = new URLSearchParams();
  params.set("linkCode", linkCode);
  params.set("tag", trackingId);
  params.set("linkId", linkId);
  params.set("ref_", config.refTag);
  return `${base}?${params.toString()}`;
}

function albGenerateLinkId(fields) {
  const payload = {
    p_parameter: "SS v2",
    test_name: "Sitestripe",
    toolCreation: "SS",
    adUnitType: "TEXT",
    adUnitDescription: "Product links Text only link",
    destinationType: "ASIN",
    marketplaceId: String(fields.marketplaceId),
    store: fields.store,
    tag: fields.tag,
    asin: fields.asin,
    adUnitSubType: fields.adUnitSubType,
    linkCode: fields.linkCode,
    createTime: Date.now(),
  };
  return albMd5(JSON.stringify(payload));
}

function albMd5(input) {
  function cmn(q, a, b, x, s, t) {
    a = albAdd32(albAdd32(a, q), albAdd32(albAdd32(x, t), s));
    return albAdd32((a << b) | (a >>> (32 - b)), b);
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md5cycle(state, block) {
    let [a, b, c, d] = state;
    a = ff(a, b, c, d, block[0], 7, -680876936);
    d = ff(d, a, b, c, block[1], 12, -389564586);
    c = ff(c, d, a, b, block[2], 17, 606105819);
    b = ff(b, c, d, a, block[3], 22, -1044525330);
    a = ff(a, b, c, d, block[4], 7, -176418897);
    d = ff(d, a, b, c, block[5], 12, 1200080426);
    c = ff(c, d, a, b, block[6], 17, -1473231341);
    b = ff(b, c, d, a, block[7], 22, -45705983);
    a = ff(a, b, c, d, block[8], 7, 1770035416);
    d = ff(d, a, b, c, block[9], 12, -1958414417);
    c = ff(c, d, a, b, block[10], 17, -42063);
    b = ff(b, c, d, a, block[11], 22, -1990404162);
    a = ff(a, b, c, d, block[12], 7, 1804603682);
    d = ff(d, a, b, c, block[13], 12, -40341101);
    c = ff(c, d, a, b, block[14], 17, -1502002290);
    b = ff(b, c, d, a, block[15], 22, 1236535329);
    a = gg(a, b, c, d, block[1], 5, -165796510);
    d = gg(d, a, b, c, block[6], 9, -1069501632);
    c = gg(c, d, a, b, block[11], 14, 643717713);
    b = gg(b, c, d, a, block[0], 20, -373897302);
    a = gg(a, b, c, d, block[5], 5, -701558691);
    d = gg(d, a, b, c, block[10], 9, 38016083);
    c = gg(c, d, a, b, block[15], 14, -660478335);
    b = gg(b, c, d, a, block[4], 20, -405537848);
    a = gg(a, b, c, d, block[9], 5, 568446438);
    d = gg(d, a, b, c, block[14], 9, -1019803690);
    c = gg(c, d, a, b, block[3], 14, -187363961);
    b = gg(b, c, d, a, block[8], 20, 1163531501);
    a = gg(a, b, c, d, block[13], 5, -1444681467);
    d = gg(d, a, b, c, block[2], 9, -51403784);
    c = gg(c, d, a, b, block[7], 14, 1735328473);
    b = gg(b, c, d, a, block[12], 20, -1926607734);
    a = hh(a, b, c, d, block[5], 4, -378558);
    d = hh(d, a, b, c, block[8], 11, -2022574463);
    c = hh(c, d, a, b, block[11], 16, 1839030562);
    b = hh(b, c, d, a, block[14], 23, -35309556);
    a = hh(a, b, c, d, block[1], 4, -1530992060);
    d = hh(d, a, b, c, block[4], 11, 1272893353);
    c = hh(c, d, a, b, block[7], 16, -155497632);
    b = hh(b, c, d, a, block[10], 23, -1094730640);
    a = hh(a, b, c, d, block[13], 4, 681279174);
    d = hh(d, a, b, c, block[0], 11, -358537222);
    c = hh(c, d, a, b, block[3], 16, -722521979);
    b = hh(b, c, d, a, block[6], 23, 76029189);
    a = hh(a, b, c, d, block[9], 4, -640364487);
    d = hh(d, a, b, c, block[12], 11, -421815835);
    c = hh(c, d, a, b, block[15], 16, 530742520);
    b = hh(b, c, d, a, block[2], 23, -995338651);
    a = ii(a, b, c, d, block[0], 6, -198630844);
    d = ii(d, a, b, c, block[7], 10, 1126891415);
    c = ii(c, d, a, b, block[14], 15, -1416354905);
    b = ii(b, c, d, a, block[5], 21, -57434055);
    a = ii(a, b, c, d, block[12], 6, 1700485571);
    d = ii(d, a, b, c, block[3], 10, -1894986606);
    c = ii(c, d, a, b, block[10], 15, -1051523);
    b = ii(b, c, d, a, block[1], 21, -2054922799);
    a = ii(a, b, c, d, block[8], 6, 1873313359);
    d = ii(d, a, b, c, block[15], 10, -30611744);
    c = ii(c, d, a, b, block[6], 15, -1560198380);
    b = ii(b, c, d, a, block[13], 21, 1309151649);
    a = ii(a, b, c, d, block[4], 6, -145523070);
    d = ii(d, a, b, c, block[11], 10, -1120210379);
    c = ii(c, d, a, b, block[2], 15, 718787259);
    b = ii(b, c, d, a, block[9], 21, -343485551);
    state[0] = albAdd32(a, state[0]);
    state[1] = albAdd32(b, state[1]);
    state[2] = albAdd32(c, state[2]);
    state[3] = albAdd32(d, state[3]);
  }
  function md5blk(s) {
    const md5blks = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        s.charCodeAt(i) +
        (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) +
        (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  function md51(s) {
    const state = [1732584193, -271733879, -1732584194, 271733878];
    for (let i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(Math.floor(s.length / 64) * 64);
    const tail = new Array(16).fill(0);
    for (let i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }
    tail[s.length >> 2] |= 0x80 << ((s.length % 4) << 3);
    if (s.length > 55) {
      md5cycle(state, tail);
      tail.fill(0);
    }
    tail[14] = s.length * 8;
    md5cycle(state, tail);
    return state;
  }
  function rhex(n) {
    let s = "";
    for (let j = 0; j < 4; j++) {
      s += ((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16);
    }
    return s;
  }
  const state = md51(unescape(encodeURIComponent(input)));
  return rhex(state[0]) + rhex(state[1]) + rhex(state[2]) + rhex(state[3]);
}

function albAdd32(a, b) {
  return (a + b) & 0xffffffff;
}