# mySHOEFITTER JS SDK

<a href="https://en.myshoefitter.com" target="_blank" className="banner-image">
  <img src="/images/banner.png" />
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