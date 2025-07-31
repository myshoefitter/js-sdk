export function findProductId() {
  try {
    return extractSkuFromWindowObject() || extractSkuFromHiddenInputField() || extractSKUsFromScriptTag();
  } catch (error) {
    // DOM might not be ready yet
    return null;
  }
}

export function getCartButtonSelector() {
  try {
    const selectors = ['.product-form > .swatch', 'variant-selects', '.product-form__submit', '.product-form__cart-submit', '.product-form__buttons', '.product-form'];
    const button = selectors.find(selector => {
      try {
        return document.querySelector(selector);
      } catch (e) {
        return false;
      }
    });
    return button as string;
  } catch (error) {
    // DOM might not be ready yet
    return '';
  }
}

export function trackConversion() {
  // Will be used later to send the checkout event to posthog
}

// --- Helper functions ---

function extractSkuFromWindowObject(): number | undefined {
  return window?.ShopifyAnalytics?.meta?.product?.id;
}

function extractSkuFromHiddenInputField(): number | undefined {
  try {
    const input = document.querySelector('input[name="product-id"]') as HTMLInputElement;
    return input ? parseInt(input.value) : undefined;
  } catch (error) {
    return undefined;
  }
}

function extractSKUsFromScriptTag(): number | null {
  try {
    const scriptTag = document.querySelector('script[id="ProductJson-product-template"]');

    if (!scriptTag) {
      return null;
    }

    const jsonData = JSON.parse(scriptTag.textContent || '');

    if (jsonData) {
      const id = jsonData?.id ? parseInt(jsonData.id) : null;
      return id;
    }
  } catch (error) {
    // DOM might not be ready or JSON parsing failed
    return null;
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
