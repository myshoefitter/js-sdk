# mySHOEFITTER JS SDK

<a href="https://en.myshoefitter.com" target="_blank" className="banner-image">
  <img src="https://raw.githubusercontent.com/myshoefitter/js-sdk/main/.github/readme/promotion.jpg" alt="mySHOEFITTER Promotion Banner" />
</a>

### How to use
Load the script from our CDN just before the `</body>` of your website and nit the script by calling the init function:
```html
<!-- Load the Script -->
<script src="https://js.myshoefitter.com/v1/script.js"></script>
<!-- Initialize the Script -->
<script type="application/javascript">
  myshoefitter.init({
    shopId: 'your-shop-id',
    productId: 'custom-product-id'
  });
</script>
```

Add an button to open the banner:
```html
<button id="myshoefitter-button">Find the right size</button>
```