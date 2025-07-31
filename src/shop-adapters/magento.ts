export function findProductId() {
  try {
    return extractSkuFromMetaTag() || extractSKUsFromScriptTag();
  } catch (error) {
    return null;
  }
}

export function getCartButtonSelector() {
  try {
    // Check if the selector exists before returning it
    return document.querySelector('button[type="submit"][form="product_addtocart_form"]') ? 'button[type="submit"][form="product_addtocart_form"]' : '';
  } catch (error) {
    return '';
  }
}

export function trackConversion() {
  document.addEventListener('checkout_onepage_controller_success_action', (event) => {
    console.log('Checkout success event caught:', event);
  });
}

// --- Helper functions ---

function extractSkuFromMetaTag(): string | null {
  try {
    const skuMeta = document?.querySelector('meta[itemprop="sku"]');
    return skuMeta ? skuMeta?.getAttribute('content') : null;
  } catch (error) {
    return null;
  }
}

function extractSKUsFromScriptTag(): string | null {
  try {
    const scriptTag = document.querySelector('script[type="application/ld+json"]');

    if (!scriptTag) {
      return null;
    }

    const jsonData = JSON.parse(scriptTag.textContent || '');

    if (jsonData && Array.isArray(jsonData.itemListElement)) {
      const skus = jsonData.itemListElement.map((item: any) => item.item.sku.trim());
      return skus.shift().split(' ').shift();
    }
  } catch (error) {
    // DOM might not be ready or JSON parsing failed
    return null;
  }

  return null;
}
