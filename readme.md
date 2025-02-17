# mySHOEFITTER JS SDK

<a href="https://en.myshoefitter.com" target="_blank" className="banner-image">
  <img src="https://raw.githubusercontent.com/myshoefitter/js-sdk/main/.github/readme/promotion.jpg" alt="mySHOEFITTER Promotion Banner" />
</a>

### How to use

#### Simple Integration
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

#### Extended Integration
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
      // Set custom attributes for e.g. google analytics tag manager
      // ⚠️ Important: mySHOEFITTER must be initialized before your tracking code
      attributes: {
        'data-gtm-event': 'myshoefitter-button-click',
        'data-gtm-category': 'engagement',
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
#### Events

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