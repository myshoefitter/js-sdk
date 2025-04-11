# mySHOEFITTER JS SDK

<a href="https://en.myshoefitter.com" target="_blank" className="banner-image">
  <img src="https://raw.githubusercontent.com/myshoefitter/js-sdk/main/.github/readme/promotion.jpg" alt="mySHOEFITTER Promotion Banner" />
</a>

### How to use

### Simple Integration
Add the script just before the `</body>` of your website. Make sure you adjust the `shopSystem` property.
After a successfull implementation, the mySHOEFITTER Button should appear underneath the add to cart button.
```html
<!-- Load the Script -->
<script src="https://js.myshoefitter.com/v1/script.js"></script>

<!-- Initialize the Script -->
<script type="application/javascript">
  myshoefitter.init({
    shopSystem: 'oxid', // shopify, woocommerce, dc, magento
    // Optional
    button: {
      attachTo: '.product-form__submit',
      position: 'before'
    }
  });
</script>
```

### Extended Integration
If you need special customizations, or your shopsystem is not supported yet, please use the following implementation:
```html
<!-- Load the Script -->
<script src="https://js.myshoefitter.com/v1/script.js"></script>

<!-- Initialize the Script -->
<script type="application/javascript">
  myshoefitter.init({
    productId: 'custom-product-id', // <- replace with the sku of your product
    enabledProductIds: [], // optional: array of product ids where mySHOEFITTER should be enabled
    disabledProductIds: [], // optional: array of product ids where mySHOEFITTER should be disabled
    // optional: add styles to make the button match perfectly with your ci
    button: {
      text: 'Find Shoe Size',
      styles: {
        border: '2px solid black',
        boederRadius: '10px'
      },
      // Set custom attributes
      attributes: {
        'class': 'custom-shoefitter-class'
      }
    };
  });
</script>
```

Add the button to open mySHOEFITTER where it fits your website the best:
```html
<button id="myshoefitter-button">Find the right size</button>
```

### Filters

The MyShoefitter script provides flexible filtering capabilities that allow you to control exactly which products display the size recommendation button. You can filter products by their ID, their name, or a combination of both methods.
These filtering options give you precise control over where the size recommendation feature appears in your store, ensuring it's only shown on relevant products such as footwear while being hidden on inappropriate items like accessories or clothing.
The script supports four filtering parameters that can be used independently or in combination:

`enabledProductIds`: Show the button ONLY on specific product IDs
`disabledProductIds`: Hide the button on specific product IDs
`enabledProductNames`: Show the button ONLY on products with specific names/titles
`disabledProductNames`: Hide the button on products with specific names/titles

When multiple filters are used together, a product must pass ALL active filter conditions for the button to be displayed.

**Examples**

```js
// Only show button on products with "Running Shoes" in the title
myshoefitter.init({
  shopSystem: 'shopify',
  enabledProductNames: ['Running Shoes']
});

// Hide button on products containing "Sandals" or "Flip Flops" in the title
myshoefitter.init({
  shopSystem: 'woocommerce',
  disabledProductNames: ['Sandals', 'Flip Flops']
});

// Use regex pattern to match specific formats
myshoefitter.init({
  shopSystem: 'magento',
  disabledProductNames: ['/Kids\s+Shoes/i', '/Size\s+\d+/']
});
```

### Events

Events are our way of letting you know when something interesting happens in our web app. When an interesting event occurs, we create a new event object. For example, when a user clicks through the web app or a shoe size was determined.

```html
<!-- Load the mySHOEFITTER Script -->
<script src="https://js.myshoefitter.com/v1/script.js"></script>
 
<script type="application/javascript">
 
  // Subscribe to Events
  myshoefitter.events(event => {
    console.log('mySHOEFITTER Event', event);
    if (event.type === 'RESULT') {
      // Work with the result - e.g. preselect size in shop
      console.log('mySHOEFITTER Shoe Size', event.data.result);
    }

    if (event.type === 'BUTTON' && event.data && event.data.action === 'click') {
      // Send click event to google tag manager
      if (typeof gtag === 'function') {
        gtag('event', 'click', {
          event_category: 'mySHOEFITTER', // Group or category for the event
          event_label: 'mySHOEFITTER Button', // Label to identify the event
          value: 1 // Optional numeric value associated with the event
        });
        console.log('mySHOEFITTER button click event sent to Google Analytics.');
      } else {
        console.error('gtag function is not defined.');
      }
      // Log the event to the console (for debugging purposes)
      console.log('Shopify button click event sent to Google Analytics.');
    }
  });
 
  // Initiate mySHOEFITTER like usual
  myshoefitter.init({
    shopId: 'your-shop-id', // <- Replace
    productId: 'your-product-id' // <- Replace
  });
</script>
```

**🚀 Get your Shop ID at [https://en.myshoefitter.com/kontakt](https://en.myshoefitter.com/kontakt)**  
**📖 Read the Documentation at [https://docs.myshoefitter.com](https://docs.myshoefitter.com)**