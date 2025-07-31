export function findProductId() {
  try {
    return extractSkuFromHiddenInputField() || extractSKUsFromScriptTag();
  } catch (error) {
    return null;
  }
}

export function getCartButtonSelector() {
  try {
    // Check if the selector exists before returning it
    return document.querySelector('form.cart') ? 'form.cart' : '';
  } catch (error) {
    return '';
  }
}

export function trackConversion() {
  // Will be used later to send the checkout event to posthog
}

// --- Helper functions ---

function extractSkuFromHiddenInputField(): string | undefined {
  try {
    const input = document.querySelector('.sku') as HTMLInputElement;
    return input?.innerText;
  } catch (error) {
    return undefined;
  }
}

function extractSKUsFromScriptTag(): number | null {
  try {
    const scriptTag = document.querySelector('script[type="application/ld+json"]');

    if (!scriptTag) {
      return null;
    }

    const jsonData = JSON.parse(scriptTag.textContent || '');

    if (jsonData) {
      const id = jsonData?.['@graph']?.find((obj: any) => obj?.sku)?.sku;
      return id;
    }
  } catch (error) {
    // DOM might not be ready or JSON parsing failed
    return null;
  }

  return null;
}
