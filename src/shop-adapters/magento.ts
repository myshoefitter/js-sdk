export function findProductId() {
  return extractSkuFromMetaTag() || extractSKUsFromScriptTag();
}

export function injectButton(position: ButtonPosition = 'after', selector: string = 'button[type="submit"][form="product_addtocart_form"]') {
  // Select the existing button
  const addToCartButton: HTMLElement | null = document.querySelector(selector);

  if (addToCartButton) {
    // Create a new button element
    const mysfButton: HTMLButtonElement = document.createElement('button');

    // Set properties on the new button
    mysfButton.id = 'myshoefitter-button'; // Set the button id
    mysfButton.textContent = 'Größe finden'; // Set the button text
    mysfButton.type = 'button'; // Set the button type
    // Add any other attributes or event listeners to the new button as needed

    // Insert the new button before or after the existing button in the DOM
    if (position === 'before') {
      addToCartButton.parentNode?.insertBefore(mysfButton, addToCartButton);
    } else if (position === 'after') {
      // For inserting after, use the existing button's nextSibling as the reference node
      // If nextSibling is null, the new button will simply be added as the last child
      addToCartButton.parentNode?.insertBefore(mysfButton, addToCartButton.nextSibling);
    }
  }
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

type ButtonPosition = 'before' | 'after';