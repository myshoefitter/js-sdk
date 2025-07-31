export function findProductId() {
  return extractSkuFromHiddenInputField() || extractSKUsFromScriptTag();
}

export function getCartButtonSelector() {
  return 'form.cart';
}

export function trackConversion() {
  // Will be used later to send the checkout event to posthog
}

// --- Helper functions ---

function extractSkuFromHiddenInputField(): string | undefined {
  const input = document.querySelector('.sku') as HTMLInputElement;
  return input?.innerText;
}

function extractSKUsFromScriptTag(): number | null {
  const scriptTag = document.querySelector('script[type="application/ld+json"]');

  if (!scriptTag) {
    return null;
  }

  try {
    const jsonData = JSON.parse(scriptTag.textContent || '');

    console.log('JSON DATA', jsonData);

    if (jsonData) {
      const id = jsonData?.['@graph']?.find((obj: any) => obj?.sku)?.sku;
      return id;
    }
  } catch (error) {
    // console.error("Fehler beim Verarbeiten des JSON Objekts:", error);
  }

  return null;
}
