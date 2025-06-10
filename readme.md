# mySHOEFITTER JavaScript SDK

The mySHOEFITTER JavaScript SDK enables seamless integration of AI-powered shoe sizing functionality into your e-commerce platform. Help customers find their perfect fit with just one photo of their foot.

## Features

- 🎯 **AI-Powered Sizing**: Accurate shoe size recommendations using computer vision
- 🛍️ **Multi-Platform Support**: Works with Shopify, WooCommerce, Magento, and more
- 📱 **Cross-Device**: Optimized for both desktop and mobile experiences
- 🎨 **Customizable**: Flexible button styling and logo configuration
- 🔧 **Easy Integration**: Simple JavaScript setup with automatic product detection
- 🌍 **Multi-Language**: Built-in German and English support
- 🔌 **Third-Party Integrations**: Support for Fibbl and other platforms

## Quick Start

### 1. Include the Script

Add the mySHOEFITTER script to your website:

```html
<script src="https://cdn.myshoefitter.com/v1/script.js"></script>
```

### 2. Initialize

```javascript
myshoefitter.init({
  shopSystem: 'shopify' // or 'woocommerce', 'magento', etc.
});
```

That's it! The SDK will automatically detect your products and add size finder buttons.

## Configuration Options

### Basic Configuration

```javascript
myshoefitter.init({
  shopSystem: 'shopify',           // Shop platform type
  productId: '12345',              // Override auto-detected product ID
  logsEnabled: true                // Enable console logging
});
```

### Product Filtering

Control which products show the size finder button:

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  
  // Show button only for specific product IDs
  enabledProductIds: ['12345', '67890'],
  
  // Hide button for specific product IDs
  disabledProductIds: ['11111', '22222'],
  
  // Show button only for products matching these patterns
  enabledProductNames: [
    'dance shoes',     // Contains "dance shoes"
    '/sneaker/i',      // Regex: contains "sneaker" (case-insensitive)
    'size guide'       // Contains "size guide"
  ],
  
  // Hide button for products matching these patterns
  disabledProductNames: [
    'sample',          // Contains "sample"
    '/test|demo/i'     // Regex: contains "test" or "demo"
  ]
});
```

### Button Customization

Fully customize the appearance and behavior of the size finder button:

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  button: {
    // Where to attach the button (CSS selector)
    attachTo: '.product-form__buttons',
    
    // Position relative to the target element
    position: 'after', // 'before' or 'after'
    
    // Custom button text
    text: 'FIND YOUR PERFECT FIT',
    
    // Custom CSS styles
    styles: {
      backgroundColor: '#ff6b35',
      color: 'white',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '15px 30px',
      border: 'none',
      cursor: 'pointer'
    },
    
    // Custom HTML attributes
    attributes: {
      'data-track': 'size-finder',
      'aria-label': 'Find your shoe size'
    },
    
    // Logo configuration
    logo: {
      url: 'https://yourstore.com/logo.png',
      position: 'left',    // 'left' or 'right'
      width: '24px',       // CSS width
      height: '24px',      // CSS height
      space: '0.5em'       // Spacing (px, em, %, rem, etc.)
    }
  }
});
```

### Logo Configuration

The SDK supports flexible logo configuration within the button:

#### Default Logo (Automatic)

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  button: {
    text: 'Find Your Size'
    // Default mySHOEFITTER logo will appear on the right
  }
});
```

#### Custom Logo

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  button: {
    text: 'FIND YOUR PERFECT FIT',
    logo: {
      url: 'https://yourstore.com/logo.png',
      position: 'left',           // Position relative to text
      width: '28px',              // Logo width
      height: '28px',             // Logo height
      space: '12px'               // Spacing between logo and text
    }
  }
});
```

#### Responsive Logo Spacing

Use CSS units for responsive spacing:

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  button: {
    logo: {
      position: 'left',
      space: '0.75em'    // Scales with font size
    }
  }
});

// Other responsive units:
// space: '1rem'      // Relative to root font size
// space: '2%'        // Relative to container width
// space: '1ch'       // Character width
```

#### Disable Logo

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  button: {
    text: 'Find Your Size',
    logo: false  // No logo will be shown
  }
});
```

### Advanced Configuration

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  bannerOrigin: 'custom.myshoefitter.com',  // Custom domain
  
  // Integration with third-party services
  integrations: [
    {
      fibbl: {
        active: true,
        mobileBreakpoint: 768
      }
    }
  ]
});
```

## Supported Shop Systems

The SDK automatically detects product information for these platforms:

- **Shopify** - `shopSystem: 'shopify'`
- **WooCommerce** - `shopSystem: 'woocommerce'`
- **Magento** - `shopSystem: 'magento'`
- **Shopware** - `shopSystem: 'shopware'`
- **OXID eShop** - `shopSystem: 'oxid'`
- **Custom/Other** - `shopSystem: 'custom'`

### Manual Product ID Setup

If automatic detection doesn't work or for custom platforms:

```javascript
myshoefitter.init({
  shopSystem: 'custom',
  productId: 'your-product-id',
  button: {
    attachTo: '.add-to-cart-button'
  }
});
```

## Platform-Specific Examples

### Shopify

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  button: {
    text: 'Find My Perfect Size',
    position: 'before',
    logo: {
      url: 'https://yourstore.myshopify.com/files/logo.png',
      position: 'left',
      space: '10px'
    }
  }
});
```

### WooCommerce

```javascript
myshoefitter.init({
  shopSystem: 'woocommerce',
  button: {
    attachTo: '.single_add_to_cart_button',
    styles: {
      marginTop: '10px',
      width: '100%'
    }
  }
});
```

### Custom Implementation

```javascript
myshoefitter.init({
  shopSystem: 'custom',
  productId: document.querySelector('[data-product-id]').dataset.productId,
  button: {
    attachTo: '.product-actions',
    text: 'Check My Size',
    logo: {
      url: '/assets/size-guide-icon.svg',
      position: 'right',
      width: '20px',
      height: '20px',
      space: '8px'
    }
  }
});
```

## Event Handling

Listen to events from the mySHOEFITTER widget:

```javascript
myshoefitter.events((event) => {
  switch (event.type) {
    case 'INIT':
      console.log('mySHOEFITTER initialized:', event.data);
      break;
      
    case 'BUTTON':
      console.log('Size finder button clicked:', event.data);
      // Track in your analytics
      gtag('event', 'size_finder_click', {
        product_id: event.data.productId
      });
      break;
      
    case 'RESULT':
      console.log('Size recommendation received:', event.data);
      // Auto-select the recommended size
      selectProductVariant(event.data.recommendedSize);
      break;
      
    case 'BANNER':
      if (event.data.action === 'close') {
        console.log('Size finder modal closed');
      }
      break;
  }
});
```

## API Reference

### Methods

#### `myshoefitter.init(config)`

Initialize the SDK with the given configuration.

**Parameters:**
- `config` (Object) - Configuration options

#### `myshoefitter.showBanner()`

Manually open the size finder interface.

#### `myshoefitter.closeBanner()`

Close the size finder interface.

#### `myshoefitter.getLink(options?)`

Generate a direct link to the size finder.

**Parameters:**
- `options.clientType` (String) - `'mobile'` or `'desktop'`

**Returns:** String - The size finder URL

```javascript
const sizeFinderUrl = myshoefitter.getLink({ clientType: 'mobile' });
```

#### `myshoefitter.events(callback)`

Register an event listener.

**Parameters:**
- `callback` (Function) - Event handler function

#### `myshoefitter.destroy()`

Clean up the SDK instance and remove event listeners.

### Configuration Schema

```typescript
interface ScriptConfig {
  shopSystem?: string;
  productId?: string | number;
  enabledProductIds?: (string | number)[];
  disabledProductIds?: (string | number)[];
  enabledProductNames?: (string | RegExp)[];
  disabledProductNames?: (string | RegExp)[];
  logsEnabled?: boolean;
  bannerOrigin?: string;
  integrations?: IntegrationItem[];
  button?: {
    attachTo?: string;
    position?: 'before' | 'after';
    text?: string;
    styles?: Partial<CSSStyleDeclaration>;
    attributes?: Record<string, string>;
    logo?: LogoConfig | false;
  };
}

interface LogoConfig {
  url?: string;
  position?: 'left' | 'right';
  width?: string | number;
  height?: string | number;
  space?: string | number;
}
```

## Troubleshooting

### Button Not Appearing

1. **Check product detection:**
   ```javascript
   myshoefitter.init({
     shopSystem: 'shopify',
     logsEnabled: true  // Enable logging to see detection results
   });
   ```

2. **Manual product ID:**
   ```javascript
   myshoefitter.init({
     shopSystem: 'shopify',
     productId: 'manual-product-id'
   });
   ```

3. **Check button selector:**
   ```javascript
   myshoefitter.init({
     shopSystem: 'shopify',
     button: {
       attachTo: '.your-specific-selector'  // Use your site's selector
     }
   });
   ```

### Logo Not Showing

Ensure the logo configuration is inside the `button` object:

```javascript
// ✅ Correct
myshoefitter.init({
  shopSystem: 'shopify',
  button: {
    logo: {
      url: 'https://example.com/logo.png'
    }
  }
});

// ❌ Incorrect
myshoefitter.init({
  shopSystem: 'shopify',
  logo: {  // This won't work
    url: 'https://example.com/logo.png'
  }
});
```

### Product Filtering Issues

Check your filtering patterns:

```javascript
myshoefitter.init({
  shopSystem: 'shopify',
  logsEnabled: true,  // See filter results in console
  enabledProductNames: [
    'shoe',           // Simple text match
    '/sneaker/i'      // Regex with flags
  ]
});
```

## Support

For technical support or questions:

- 📧 Email: support@myshoefitter.com
- 📖 Documentation: https://docs.myshoefitter.com
- 🐛 Issues: https://github.com/myshoefitter/sdk/issues

## License

© 2025 mySHOEFITTER. All rights reserved.