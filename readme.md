# mySHOEFITTER JS SDK

<a href="https://en.myshoefitter.com" target="_blank" className="banner-image">
  <img src="https://raw.githubusercontent.com/myshoefitter/js-sdk/main/.github/readme/promotion.jpg" alt="mySHOEFITTER Promotion Banner" />
</a>

### How to use
Load the script from our CDN just before the `<head>` of your website:
```html
<script src="https://cdn.myshoefitter.com/script.js"></script>
```

Init the script by calling the init function:
```html
<script type="application/javascript">
  myshoefitter.init({
    productId: 'custom-product-id'
  });
</script>
```

Add an button to open the banner:
```html
<button id="myshoefitter-button"></button>
```