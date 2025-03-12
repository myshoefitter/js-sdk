export function getCartButtonSelector() {
  const selectors = ['.product--configurator'];
  const button = selectors.find(selector => document.querySelector(selector));
  return button as string;
}

/**
 * Finds the product ID/SKU from a Shopware product page using various methods
 * @returns The product ID/SKU as a string, or null if not found
 */
export function findProductId(): string | null {
  try {
    // Try each method in sequence, returning the first successful result
    return (
      extractFromMetaTag() ||
      extractFromDataLayer() ||
      extractFromGoogleTagManager() ||
      extractFromHiddenInput() ||
      extractFromArticleNumber() ||
      null
    );
  } catch (error) {
    console.error("Error finding product ID:", error);
    return null;
  }
}

/**
 * Extracts product ID from meta tag with itemprop="sku"
 */
function extractFromMetaTag(): string | null {
  try {
    const metaTag = document.querySelector('span[itemprop="sku"]');
    if (metaTag && metaTag.textContent) {
      const productId = metaTag.textContent.trim();
      if (isValidProductId(productId)) {
        return productId;
      }
    }
    return null;
  } catch (error) {
    console.error("Error extracting from meta tag:", error);
    return null;
  }
}

/**
 * Extracts product ID from dataLayer
 */
function extractFromDataLayer(): string | null {
  try {
    if (typeof window.dataLayer === 'undefined') {
      return null;
    }

    // Check if dataLayer is an array before iterating
    if (Array.isArray(window.dataLayer)) {
      for (const item of window.dataLayer) {
        // Check for ecommerce data structure
        if (item.ecommerce && item.ecommerce.detail && item.ecommerce.detail.products) {
          const products = item.ecommerce.detail.products;
          if (products.length > 0 && products[0].id) {
            const productId = products[0].id.toString();
            if (isValidProductId(productId)) {
              return productId;
            }
          }
        }
        
        // Check for google_tag_params structure
        if (item.google_tag_params && item.google_tag_params.ecomm_prodid) {
          const productId = item.google_tag_params.ecomm_prodid.toString();
          if (isValidProductId(productId)) {
            return productId;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting from dataLayer:", error);
    return null;
  }
}

/**
 * Extracts product ID from Google Tag Manager data
 */
function extractFromGoogleTagManager(): string | null {
  try {
    // Look for script tags that might contain GTM data
    const scripts = document.querySelectorAll('script');
    for (let i = 0; i < scripts.length; i++) {
      const scriptContent = scripts[i].textContent || '';
      
      // Look for ecomm_prodid in the script content
      const match = scriptContent.match(/ecomm_prodid["']?\s*:\s*["']([^"']+)["']/);
      if (match && match[1]) {
        const productId = match[1];
        if (isValidProductId(productId)) {
          return productId;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting from Google Tag Manager:", error);
    return null;
  }
}

/**
 * Extracts product ID from hidden input field
 */
function extractFromHiddenInput(): string | null {
  try {
    // Look for the add to cart form input
    const hiddenInput = document.querySelector('input[name="sAdd"]') as HTMLInputElement;
    if (hiddenInput && hiddenInput.value) {
      const productId = hiddenInput.value.trim();
      if (isValidProductId(productId)) {
        return productId;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting from hidden input:", error);
    return null;
  }
}

/**
 * Extracts product ID from the article number displayed in the UI
 */
function extractFromArticleNumber(): string | null {
  try {
    // Look for the article number in the UI
    const articleNumberElement = document.querySelector('.entry--sku .entry--content');
    if (articleNumberElement && articleNumberElement.textContent) {
      const productId = articleNumberElement.textContent.trim();
      if (isValidProductId(productId)) {
        return productId;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting from article number:", error);
    return null;
  }
}

/**
 * Validates if a product ID is in a valid format
 */
function isValidProductId(productId: string): boolean {
  // Basic validation - can be enhanced based on specific requirements
  return productId !== undefined && 
         productId !== null && 
         productId.trim() !== '' &&
         productId.length > 2;
}

// Add TypeScript interface for window.dataLayer
declare global {
  interface Window {
    dataLayer: any;
  }
}