export function findProductId() {
  return extractSkuFromWindowObject() || extractSkuFromHiddenInputField() || extractSKUsFromScriptTag();
}

export function getCartButtonSelector() {
  const selectors = ['.product_form > .swatch', 'variant-selects', '.product-form__submit', '.product-form__cart-submit', '.product-form__buttons', '.product-form'];
  const button = selectors.find(selector => document.querySelector(selector));
  return button as string;
}

export function trackConversion() {
  // Will be used later to send the checkout event to posthog
}

// --- Helper functions ---

function extractSkuFromWindowObject(): number | undefined {
  return window?.ShopifyAnalytics?.meta?.product?.id;
}

function extractSkuFromHiddenInputField(): number | undefined {
  const input = document.querySelector('input[name="product-id"]') as HTMLInputElement;
  return input ? parseInt(input.value) : undefined;
}

function extractSKUsFromScriptTag(): number | null {
  const scriptTag = document.querySelector('script[id="ProductJson-product-template"]');

  if (!scriptTag) {
    return null;
  }

  try {
    const jsonData = JSON.parse(scriptTag.textContent || '');

    if (jsonData) {
      const id = jsonData?.id ? parseInt(jsonData.id) : null;
      return id;
    }
  } catch (error) {
    // console.error("Fehler beim Verarbeiten des JSON Objekts:", error);
  }

  return null;
}

declare global {
  interface Window {
    ShopifyAnalytics: {
      meta: {
        product: {
          id: number;
        }
      }
    };
  }
}
