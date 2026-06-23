const ALB_KNOWN_PLACEHOLDERS = ["title", "affiliate_link", "url", "asin"];

function albPlaceholderValue(key, product, affiliateLink) {
  switch (key) {
    case "title":
      return product.title ?? "";
    case "affiliate_link":
      return affiliateLink ?? "";
    case "url":
      return product.url ?? "";
    case "asin":
      return product.asin ?? "";
    default:
      return "";
  }
}

function albFormatProductLine(template, product, affiliateLink) {
  let line = template;
  for (const key of ALB_KNOWN_PLACEHOLDERS) {
    const value = albPlaceholderValue(key, product, affiliateLink);
    line = line.split(`{${key}}`).join(value);
  }
  return line;
}

function albFormatOutput(template, separator, successes) {
  return successes
    .map(({ product, affiliateLink }) =>
      albFormatProductLine(template, product, affiliateLink)
    )
    .join(separator);
}

function albParseSeparator(raw) {
  if (raw == null) {
    return "\n";
  }
  return String(raw).replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}