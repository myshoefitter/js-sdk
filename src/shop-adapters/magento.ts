export function findProductId() {
  return extractSkuFromMetaTag() || extractSKUsFromScriptTag();
}

export function getCartButtonSelector() {
  return 'button[type="submit"][form="product_addtocart_form"]';
}

function extractSkuFromMetaTag(): string | null {
  const skuMeta = document?.querySelector('meta[itemprop="sku"]');
  return skuMeta ? skuMeta?.getAttribute('content') : null;
}

function extractSKUsFromScriptTag(): string | null {
  const scriptTag = document.querySelector('script[type="application/ld+json"]');

  if (!scriptTag) {
    return null;
  }

  try {
    const jsonData = JSON.parse(scriptTag.textContent || '');

    if (jsonData && Array.isArray(jsonData.itemListElement)) {
      const skus = jsonData.itemListElement.map((item: any) => item.item.sku.trim());
      return skus.shift().split(' ').shift();
    }
  } catch (error) {
    // console.error("Fehler beim Verarbeiten des JSON Objekts:", error);
  }

  return null;
}
