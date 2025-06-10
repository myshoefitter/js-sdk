import { dc, magento, shopify, woocommerce, oxid, shopware } from './shop-adapters/index';
// Import all integrations directly
import FibblCustomizer from './integrations/fibbl';
import { BannerParams, ButtonPosition, CustomEvent, EventTypes, Integration, IntegrationItem, IntegrationOptions, LinkOptions, myShoeFitter, ScriptConfig, ShopSystemConfig } from './types/types';
import { detectClient, generateAppLink, getHostname } from './utils/helpers';
import { getConfig, updateConfig, getBannerParams } from './utils/config';

/**
 * Represents a service with functionalities related to a product.
 */
class MyShoefitter {
  // The dialog window
  private dialog: HTMLDialogElement | undefined;
  // The params for the banner
  private params: BannerParams | undefined;
  // Banner Origin - will be read from config
  private bannerOrigin: string;
  // Shop systems width available adapters
  private readonly supportedShopSystems = ['woocommerce', 'shopify', 'magento', 'shopware', 'oxid', 'prestashop', 'bigcommerce', 'dc', 'custom'];
  // Registry of available integrations
  private readonly integrationRegistry: Record<string, new () => Integration> = {
    'fibbl': FibblCustomizer
  };
  // Track active integration instances
  private activeIntegrations: Integration[] = [];
  // Callback for events
  private callback?: (event: CustomEvent) => void;

  constructor() {
    // Initialize bannerOrigin from config
    this.bannerOrigin = getConfig<string>('config.bannerOrigin');
  }

  /**
   * Initialize the Script
   * @param config ScriptConfig
   */
  public init(config: ScriptConfig): void {
    // Get the current bannerOrigin
    const currentBannerOrigin = getConfig<string>('config.bannerOrigin');

    // Update the central config store
    updateConfig({
      config: {
        ...config,
        bannerOrigin: (config.bannerOrigin || currentBannerOrigin) as string
      },
      initialized: true
    });

    // Update bannerOrigin from config
    this.bannerOrigin = getConfig<string>('config.bannerOrigin');

    // On PWA V2, the hostname will be used to identify the shop
    const shopId = getHostname();
    updateConfig({
      config: {
        shopId,
        bannerOrigin: getConfig<string>('config.bannerOrigin')
      }
    });

    // Overwrite settings for groundies
    if (shopId?.includes('groundies.com')) {
      updateConfig({
        config: {
          shopSystem: 'oxid',
          productId: undefined,
          bannerOrigin: getConfig<string>('config.bannerOrigin')
        }
      });
    }

    const currentConfig = getConfig().config;

    // Show error if productId and shopSystem are missing - pwa will not work without these parameters
    if (!currentConfig.productId && !currentConfig.shopSystem) {
      console.warn('mySHOEFITTER: Please provide either productId or shopSystem!');
    }

    if (currentConfig.shopSystem && !this.supportedShopSystems.includes(currentConfig.shopSystem)) {
      console.warn('mySHOEFITTER: Shop System is not supported! productId is required.');
    }

    // Handle integrations
    if (currentConfig?.integrations?.length) {
      // Process each integration item
      (currentConfig.integrations as IntegrationItem[]).forEach((integrationItem: IntegrationItem) => {
        const integrationEntries = Object.entries(integrationItem);
        
        if (integrationEntries.length === 0) {
          console.warn('mySHOEFITTER: Empty integration object found.');
          return;
        }
        
        const [integrationName, integrationOptions] = integrationEntries[0];
        
        // Skip if the integration is explicitly set to inactive
        if (!integrationOptions.active) {
          console.log(`mySHOEFITTER: Integration "${integrationName}" is disabled.`);
          return;
        }
        
        // Check if the integration is registered
        const IntegrationClass = this.integrationRegistry[integrationName];
        if (IntegrationClass) {
          try {
            // Create a new instance
            const instance = new IntegrationClass();
            // Initialize with options
            instance.init(integrationOptions);
            // Store instance for lifecycle management
            this.activeIntegrations.push(instance);
            console.log(`mySHOEFITTER: Initialized integration: ${integrationName}`);
          } catch (error) {
            console.error(`mySHOEFITTER: Error initializing integration "${integrationName}":`, error);
          }
        } else {
          console.warn(`mySHOEFITTER: Integration "${integrationName}" is not supported.`);
        }
      });
    }

    // Check if the Shop System is supported and find the Product ID automatically
    if (currentConfig.shopSystem && this.supportedShopSystems.includes(currentConfig.shopSystem)) {
      const { sku } = this.getShopSystemConfig(currentConfig.shopSystem);

      if (!currentConfig.productId && sku) {
        updateConfig({
          config: {
            productId: String(sku),
            bannerOrigin: getConfig<string>('config.bannerOrigin')
          }
        });
        console.log(`mySHOEFITTER: Product ID found: ${sku}`);
      } else {
        console.warn('mySHOEFITTER: Product ID could not be found! Please set it manually using productId parameter.');
      }
    }

    // Get banner params from config utility
    this.params = getBannerParams() as BannerParams;

    this.addButton();
    // this.trackEvent('Button Load');

    this.emit({
      type: EventTypes.Init,
      data: currentConfig
    });

    if (currentConfig.logsEnabled) {
      console.log('mySHOEFITTER Config:', currentConfig);
    }
  }

  /**
   * Helper method to register a new integration
   * @param name Integration name
   * @param IntegrationClass Integration class constructor
   */
  public registerIntegration(name: string, IntegrationClass: new () => Integration): void {
    this.integrationRegistry[name] = IntegrationClass;
  }

  /**
   * Clean up all active integrations
   */
  private destroyIntegrations(): void {
    this.activeIntegrations.forEach(integration => {
      if (integration.destroy) {
        try {
          integration.destroy();
        } catch (error) {
          console.error('mySHOEFITTER: Error destroying integration:', error);
        }
      }
    });
    this.activeIntegrations = [];
  }

  /**
   * Listen to public events from the iframe
   * @param callback (event: string) => void
   */
  public events(callback: (event: CustomEvent) => void) {
    this.callback = callback;
  }
  
  /**
   * Public method to destroy and clean up the MyShoefitter instance
   * Call this when the script is no longer needed
   */
  public destroy(): void {
    // Clean up integrations
    this.destroyIntegrations();
    
    // Remove event listeners
    window.removeEventListener('message', (event) => this.handleMessage(event));
    
    // Close any open dialog
    if (this.dialog && this.dialog.open) {
      this.dialog.close();
    }
    
    console.log('mySHOEFITTER: Instance destroyed');
  }

  /**
   * Hides the loader spinner.
   */
  private hideLoader(): void {
    const loader = document.getElementById('myshoefitter-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  /**
   * Creates a new HTMLDialogElement and opens the Banner as an iFrame
   */
  public showBanner(): void {
    const isDesktop = detectClient() === 'desktop';
    if (!isDesktop) {
      const link = generateAppLink();
      window.open(link);
      return;
    }

    // Create the dialog element
    if (!this.dialog) {
      const isDesktop = detectClient() === 'desktop';
      this.dialog = document.createElement('dialog');
      this.dialog.id = 'myshoefitter-dialog';
      this.dialog.style.margin = '0';
      this.dialog.style.padding = '0';
      this.dialog.style.border = 'none';
      this.dialog.style.overflow = 'hidden';
      this.dialog.style.maxHeight = 'unset';
      this.dialog.style.maxWidth = 'unset';

      if (isDesktop) {
        this.dialog.style.width = '80%';
        this.dialog.style.height = '400px';
        this.dialog.style.borderRadius = '25px';
        this.dialog.style.maxWidth = '900px';
        this.dialog.style.minWidth = '375px';
        this.dialog.style.top = '50%';
        this.dialog.style.left = '50%';
        this.dialog.style.transform = 'translate(-50%, -50%)';
      } else {
        this.dialog.style.width = '100%';
        this.dialog.style.height = '100%';
      }

      // Create the iframe element
      const iframe = document.createElement('iframe');
      iframe.allow = 'camera; microphone; autoplay';
      iframe.src = generateAppLink();
      iframe.scrolling = 'no';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';

      // Create the loading element
      // Create the loader div
      const loader = document.createElement('div');
      loader.className = 'myshoefitter-loader';
      loader.id = 'myshoefitter-loader';
      loader.style.display = 'flex';
      loader.style.border = '8px solid #f3f3f3';
      loader.style.borderTop = '8px solid #ff7d4f';
      loader.style.borderRadius = '50%';
      loader.style.width = '50px';
      loader.style.height = '50px';
      loader.style.position = 'absolute';
      loader.style.top = 'calc(50% - 25px)';
      loader.style.left = 'calc(50% - 25px)';
      loader.style.zIndex = '10000';
      loader.style.animation = 'spin 1s linear infinite';
      loader.innerHTML = `<style> @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } </style>`;

      // Append the loader to the dialog
      this.dialog.appendChild(loader);

      // Append the iframe to the dialog
      this.dialog.appendChild(iframe);

      // Append the dialog to the body beginning of the body
      document.body.insertBefore(this.dialog, document.body.firstChild);
    }

    // Show the dialog
    this.dialog.showModal();
  }

  /**
   * Exposes generateAppLink to be used by shop developers
   * Example: myshoefitter.getLink()
   * @returns string
   */
  public getLink(options?: LinkOptions): string {
    return generateAppLink(options);
  }

  /**
   * Closes the Banner and removes it from the DOM
   */
  public closeBanner(): void {
    if (getConfig<boolean>('initialized') && this.dialog) {
      this.dialog.close();
      this.trackEvent('Banner Close');
      this.destroyMessageEventListener();
    } else {
      console.warn('mySHOEFITTER is not initialized');
    }
  }

  /**
   * Get the current product name/title from document title
   * @returns string | null
   */
  private getProductName(): string | null {
    if (document.title) {
      return document.title.trim();
    }
    return null;
  }

  /**
   * Check if a value matches a pattern (string or regex)
   * @param value The value to check
   * @param pattern The pattern to match against
   * @returns boolean
   */
  private matchesPattern(value: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      // Check if the pattern looks like a regex (starts and ends with /)
      if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
        // Extract regex pattern and flags
        const lastSlashIndex = pattern.lastIndexOf('/');
        const regexPattern = pattern.slice(1, lastSlashIndex);
        const flags = pattern.slice(lastSlashIndex + 1);
        try {
          const regex = new RegExp(regexPattern, flags);
          return regex.test(value);
        } catch (e) {
          // If regex is invalid, fall back to string contains
          return value.toLowerCase().includes(pattern.toLowerCase());
        }
      } else {
        // Simple string contains check (case-insensitive)
        return value.toLowerCase().includes(pattern.toLowerCase());
      }
    } else if (pattern instanceof RegExp) {
      return pattern.test(value);
    }
    return false;
  }

  /**
   * Check if the button should be shown based on filter configuration
   * @returns boolean
   */
  private shouldShowButton(): boolean {
    const currentConfig = getConfig().config as ScriptConfig;
    const productId = currentConfig.productId;
    const productName = this.getProductName();

    // If no productId, we can't show the button
    if (!productId) {
      return false;
    }

    // Check enabledProductIds filter
    if (currentConfig.enabledProductIds?.length) {
      if (!currentConfig.enabledProductIds.includes(String(productId))) {
        console.log(`mySHOEFITTER: Button hidden - Product ID ${productId} not in enabled list`);
        return false;
      }
    }

    // Check disabledProductIds filter
    if (currentConfig.disabledProductIds?.length) {
      if (currentConfig.disabledProductIds.includes(String(productId))) {
        console.log(`mySHOEFITTER: Button hidden - Product ID ${productId} is in disabled list`);
        return false;
      }
    }

    // Check product name filters only if we have a product name
    if (productName) {
      // Check enabledProductNames filter
      if (currentConfig.enabledProductNames?.length) {
        const matchesEnabled = currentConfig.enabledProductNames.some(pattern => 
          this.matchesPattern(productName, pattern)
        );
        if (!matchesEnabled) {
          console.log(`mySHOEFITTER: Button hidden - Product name "${productName}" doesn't match enabled patterns`);
          return false;
        }
      }

      // Check disabledProductNames filter
      if (currentConfig.disabledProductNames?.length) {
        const matchesDisabled = currentConfig.disabledProductNames.some(pattern => 
          this.matchesPattern(productName, pattern)
        );
        if (matchesDisabled) {
          console.log(`mySHOEFITTER: Button hidden - Product name "${productName}" matches disabled patterns`);
          return false;
        }
      }
    }

    // All filters passed, show the button
    return true;
  }

  /**
   * Find the button in html and add click listener
   */
  private addButton(): void {
    const currentConfig = getConfig().config as ScriptConfig;

    if (!currentConfig.productId) {
      return;
    }

    // Check if button should be shown based on filters
    if (!this.shouldShowButton()) {
      return;
    }

    // We need to access the button config which isn't in the provided Config interface
    // Assuming it's added to the config object during initialization
    const extendedConfig = getConfig() as any;
    const buttonConfig = extendedConfig.config?.button;

    let button = document.getElementById(buttonConfig?.attributes?.id || 'myshoefitter-button');

    const attachTo = buttonConfig?.attachTo;
    const position = buttonConfig?.position || 'after';
    const shopSystem = currentConfig.shopSystem;

    if (!button && attachTo) {
      button = this.injectButton(attachTo, position);
      console.log(`mySHOEFITTER: Button injected ${position}: ${attachTo}`);
    } else if (!button && shopSystem) {
      const { selector } = this.getShopSystemConfig(shopSystem);
      button = this.injectButton(selector, position);
      console.log(`mySHOEFITTER: Button injected ${position}: ${selector}`);
    }

    if (button) {
      button.addEventListener('click', (event: Event) => {
        event.preventDefault();
        this.showBanner();
        this.emit({
          type: EventTypes.Button,
          data: {
            action: 'click'
          }
        });
        this.initMessageEventListener();
      });
    } else {
      console.warn(`mySHOEFITTER: Please add 'button' property to the config object or paste button html code manually into your template.`);
    }
  }

  private initMessageEventListener() {
    window.addEventListener('message', (event) => this.handleMessage(event));
  }

  private destroyMessageEventListener() {
    window.removeEventListener('message', (event) => this.handleMessage(event));
  }

  /**
   * Emit custom events through the callback to the parent page
   * @param event CustomEvent
   */
  private emit(event: CustomEvent): void {
    if (this.callback) {
      this.callback(event);
    }
  }

  /**
   * Listens to custom events from the iframe content
   * @param event MessageEvent
   */
  private handleMessage(event: MessageEvent<CustomEvent>): void {
    const logsEnabled = getConfig<boolean>('config.logsEnabled');
    if (logsEnabled) {
      console.log('mySHOEFITTER: Event', event.data);
    }

    // Block all unwanted events
    if (!event?.origin?.includes(this.bannerOrigin) || !event?.data?.type || !event?.data?.data) {
      return;
    }
    // Emit all data to make it usable for the shop
    this.emit(event.data);
    // Listen for banner close event
    if (event?.data?.type === 'BANNER' && event?.data?.data?.action === 'close') {
      this.closeBanner();
      this.destroyMessageEventListener();
    } else if (event?.data?.type === 'BANNER' && (event?.data?.data?.action === 'resize' || event?.data?.data?.action === 'load')) {
      // Resize iframe to fit content
      const iframe = this.dialog?.children?.item(0) as HTMLIFrameElement;
      const isDesktop = detectClient() === 'desktop';
      if (this.dialog?.style && iframe && isDesktop && event.data.data.height && event.data.data.width) {
        this.dialog.style.height = event.data.data.height + "px";
        this.dialog.style.width = event.data.data.width + "px";
      }
      // Hide loading spinner
      if (event?.data?.data?.action === 'load') {
        this.hideLoader();
      }
    }
  }

  /**
   * Track script load event in Pirsch
   * Extracted from https://api.pirsch.io/pirsch-events.js
   */
  private async trackEvent(eventName: string) {
    return;

    // Don't send request on localhost
    // if ((/^localhost(.*)$|^127(\.[0-9]{1,3}){3}$/is.test(location.hostname) || location.protocol === "file:")) {
    //   console.info("Pirsch is ignored on localhost. Add the data-dev attribute to enable it.");
    // }

    const data = {
      identification_code: 'kGhjVS9A2aJtLg6PWZx0h6OV8N23WqEy',
      url: 'https://' + this.bannerOrigin,
      title: document.title,
      referrer: encodeURIComponent(location.href),
      screen_width: screen.width,
      screen_height: screen.height,
      user_agent: navigator.userAgent,
      event_name: eventName,
      event_duration: 0,
      event_meta: this.params
    };

    try {
      navigator.sendBeacon('https://usage.myshoefitter.com/p/e', JSON.stringify(data));
    } catch (error) {
      console.log('mySHOEFITTER Tracking Error:', error);
    }
  }

  private getShopSystemConfig(shopSystem: string): ShopSystemConfig {
    const config: ShopSystemConfig = {
      sku: null,
      selector: ''
    };

    switch (shopSystem) {
      case 'dc': {
        config.sku = dc.findProductId();
        break;
      }
      case 'magento': {
        config.selector = magento.getCartButtonSelector();
        config.sku = magento.findProductId();
        break;
      }
      case 'shopify': {
        config.selector = shopify.getCartButtonSelector();
        config.sku = shopify.findProductId();
        break;
      }
      case 'woocommerce': {
        config.selector = woocommerce.getCartButtonSelector();
        config.sku = woocommerce.findProductId();
        break;
      }
      case 'shopware': {
        config.selector = shopware.getCartButtonSelector();
        config.sku = shopware.findProductId();
        break;
      }
      case 'oxid': {
        config.sku = oxid.findProductId();
        break;
      }
    }

    return config;
  }

  /**
   * Determines the button text based on the browser's language.
   * @returns {string} The button text in the appropriate language.
   */
  private getButtonText(): string {
    const language = navigator.language;
    if (language.startsWith('de')) {
      return `1 Foto - immer die perfekte Größe <img src="https://cdn.myshoefitter.com/images/logo.png" style="height: 17px; margin: 0 0 0 10px;" />`;
    } else {
      return `1 Photo - always the perfect fit <img src="https://cdn.myshoefitter.com/images/logo.png" style="height: 17px; margin: 0 0 0 10px;" />`;
    }
  }

  /**
   * Automatically injects the myshoefitter button into the dom
   *
   * @param attachTo css selector of the element the button will be attached to
   * @param position place button before or after the element
   */
  private injectButton(attachTo: string, position: ButtonPosition = 'after') {
    if (!attachTo) {
      console.warn('mySHOEFITTER: Please provide a valid css selector to attach the button to.');
      return null;
    }

    // Select the existing button
    const addToCartButton: HTMLElement | null = document.querySelector(attachTo);

    if (addToCartButton) {
      // Create a new button element
      const mysfButton: HTMLButtonElement = document.createElement('button');

      // Set properties on the new button
      mysfButton.id = 'myshoefitter-button'; // Set the button id

      // Get button config
      const extendedConfig = getConfig() as any;
      const buttonConfig = extendedConfig.config?.button;

      mysfButton.innerHTML = buttonConfig?.text || this.getButtonText(); // Set the button text
      mysfButton.type = 'button'; // Set the button type

      // Add custom attributes
      if (buttonConfig?.attributes) {
        Object.entries(buttonConfig.attributes as Record<string, string>).forEach(([key, value]: [string, string]) => {
          mysfButton.setAttribute(key, value);
        });
      }

      let styles: Partial<CSSStyleDeclaration> = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        background: 'none',
        color: 'black',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: '600',
        border: '2px solid rgb(255, 125, 79)',
        borderRadius: '5px',
        outline: 'none',
        padding: '10px 20px',
        margin: '10px 0',
        cursor: 'pointer',
      };

      // Merge styles from config into the default styles
      if (buttonConfig?.styles) {
        styles = { ...styles, ...buttonConfig.styles }
      }

      for (const [key, value] of Object.entries(styles)) {
        mysfButton.style[key as any] = value as string;
      }

      // Insert the new button before or after the existing button in the DOM
      if (position === 'before') {
        addToCartButton.parentNode?.insertBefore(mysfButton, addToCartButton);
      } else if (position === 'after') {
        // For inserting after, use the existing button's nextSibling as the reference node
        // If nextSibling is null, the new button will simply be added as the last child
        addToCartButton.parentNode?.insertBefore(mysfButton, addToCartButton.nextSibling);
      }

      return mysfButton;
    }
    return null;
  }
}

// Expose class to parent page
const myshoefitterInstance = new MyShoefitter();
window.myshoefitter = myshoefitterInstance;

// Clean up when the page is unloaded
window.addEventListener('beforeunload', () => {
  myshoefitterInstance.destroy();
});

declare global {
  interface Window {
    myshoefitter: myShoeFitter;
  }
}