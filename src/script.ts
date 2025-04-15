import { dc, magento, shopify, woocommerce, oxid, shopware } from './shop-adapters/index';
import { fibbl } from './integrations/index';
import { BannerParams, ButtonPosition, CustomEvent, EventTypes, myShoeFitter, ScriptConfig, ShopSystemConfig } from './types/types';

/**
 * Represents a service with functionalities related to a product.
 */
class MyShoefitter {
  // The config to initialize the script
  private config: ScriptConfig | undefined;
  // The dialog window
  private dialog: HTMLDialogElement | undefined;
  // The params for the banner
  private params: BannerParams | undefined;
  // Banner Origin
  private bannerOrigin = 'v2.myshoefitter.com'; // Do not include protocol or path!!!
  // Shop systems width available adapters
  private readonly supportedShopSystems = ['woocommerce', 'shopify', 'magento', 'shopware', 'oxid', 'prestashop', 'bigcommerce', 'dc', 'custom'];
  // Integrations that can be used to extend the script
  private readonly supportedIntegrations = [{
    'fibbl': fibbl
  }];
  // Callback for events
  private callback?: (event: CustomEvent) => void;

  /**
   * Initialize the Script
   * @param config ScriptConfig
   */
  public init(config: ScriptConfig): void {
    this.config = config;

    // Override the default banner url
    if (typeof config?.bannerOrigin === 'string') {
      this.bannerOrigin = config.bannerOrigin;
    }

    // On PWA V2, the hostname will be used to identify the shop
    config.shopId = this.getHostname();

    // Overwrite settings for groundies
    if (config.shopId?.includes('groundies.com')) {
      config.shopSystem = 'oxid';
      config.productId = undefined;
    }    

    // Show error if productId and shopSystem are missing - pwa will not work without these parameters
    if (!config?.productId && !config?.shopSystem) {
      console.error('mySHOEFITTER: Please provide either productId or shopSystem!');
    }

    if (config?.shopSystem && !this.supportedShopSystems.includes(config.shopSystem)) {
      console.error('mySHOEFITTER: Shop System is not supported! productId is required.');
    }

    if (config?.integrations) {
      // Loop through each integration specified in the configuration
      config.integrations.forEach((integrationName: string) => {
        // Find the integration object that has the key matching integrationName
        const integrationObj = this.supportedIntegrations.find(integration => integration.hasOwnProperty(integrationName));
        
        if (integrationObj) {
          // Use a type assertion to let TypeScript know that the integration object is indexable
          const integrationHandler = (integrationObj as Record<string, any>)[integrationName];
          
          if (typeof integrationHandler === 'function') {
            integrationHandler();
            console.log(`mySHOEFITTER: Initialized integration: ${integrationName}`);
          } else {
            console.warn(`mySHOEFITTER: Integration "${integrationName}" does not have an init function.`);
          }
        } else {
          console.warn(`mySHOEFITTER: Integration "${integrationName}" is not supported.`);
        }
      });
    }      

    // Check if the Shop System is supported and find the Product ID automatically
    if (config?.shopSystem && this.supportedShopSystems.includes(config.shopSystem)) {
      const { sku } = this.getShopSystemConfig(config.shopSystem);

      if (!config?.productId && sku) {
        config.productId = String(sku);
        console.log(`mySHOEFITTER: Product ID found: ${config.productId}`);
      } else {
        console.error('mySHOEFITTER: Product ID could not be found! Please set it manually using productId parameter.');
      }
    }

    this.params = {
      shop: config?.shopId,
      product: config?.productId,
      utm_source: window?.location?.hostname // Don't remove or encrypt! Needed for Analytics!
    };

    this.addButton();
    // this.trackEvent('Button Load');

    this.emit({
      type: EventTypes.Init,
      data: config
    });

    console.log('mySHOEFITTER Config:', config);
  }

  /**
   * Listen to public events from the iframe
   * @param callback (event: string) => void
   */
  public events(callback: (event: CustomEvent) => void) {
    this.callback = callback;
  }

  /**
   * Detects client type
   */
  private detectClient(): string {
    const userAgent = window.parent.navigator.userAgent;
    const isMobile = /Mobi/i.test(userAgent) && !/Tablet|iPad/i.test(userAgent);
    const isTablet = /Tablet|iPad/i.test(userAgent) || (window.innerWidth <= 1024 && /Mobi/i.test(userAgent));
    const isDesktop = !isMobile && !isTablet;

    if (isMobile) return 'mobile';
    else if (isTablet) return 'tablet';
    else if (isDesktop) return 'desktop';
    else return 'desktop'
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

    const isDesktop = this.detectClient() === 'desktop';
    if(!isDesktop) {
      const link = this.generateBannerLink();
      window.open(link);
      return;
    }

    // Create the dialog element
    if (!this.dialog) {
      const isDesktop = this.detectClient() === 'desktop';
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
      iframe.src = this.generateBannerLink();
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


  public getQrCode(): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      </svg>
    `;
  }

  /**
   * Generates the direct link to the camera page
   * @returns string The direct link to the camera page
   */
  public getCameraLink(): string {
    if (!this.config?.productId) {
      console.warn('mySHOEFITTER: No productId found!')
      return '';
    }

    const protocol = this.bannerOrigin.includes('localhost') ? 'http' : 'https';
    const bannerHost = protocol + '://' + this.bannerOrigin + '/camera';
    
    const params = {
      shop: this.config?.shopId || this.getHostname(),
      product: this.config?.productId,
      utm_source: window?.location?.hostname
    };

    
    // Filter out undefined values
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    );

    console.log('PARAMS', params)
    console.log('FILTERED PARAMS', filteredParams)

    console.log(bannerHost + '?' + new URLSearchParams(filteredParams as Record<string, string>).toString())

    return bannerHost + '?' + new URLSearchParams(filteredParams as Record<string, string>).toString();
  }

  /**
   * Closes the Banner and removes it from the DOM
   */
  public closeBanner(): void {
    if (this.config && this.dialog) {
      this.dialog.close();
      this.trackEvent('Banner Close');
    } else {
      console.warn('mySHOEFITTER is not initialized');
    }
  }

  /**
   * Generates the link incl. all params that opens in the iframe
   * @returns https://dialog.myshoefitter.com/?....
   */
  private generateBannerLink(): string {
    if (!this.config?.productId) {
      console.warn('mySHOEFITTER: No productId found!')
      return '';
    }

    const protocol = this.bannerOrigin.includes('localhost') ? 'http' : 'https';
    let bannerHost = protocol + '://' + this.bannerOrigin;

    const clientType = this.detectClient();
    // Open banner on desktop if client is desktop.
    // Open pwa on mobile and tablet
    if (clientType === 'desktop') {
      bannerHost = bannerHost + '/desktop';
    } else if (this.params?.product) {
      // If product is set, open camera. Oherwise open home page.
      bannerHost = bannerHost + '/camera';
    }

    const url = bannerHost + '?' + new URLSearchParams(this.params as unknown as Record<string, string>).toString();
    console.log('mySHOEFITTER: Banner URL', url);

    return url;
  }

  /**
   * Find the button in html and add click listener
   */
  private addButton(): void {

    if (!this.config?.productId) {
      return;
    }

    // Only show button on enabled products
    if (this.config?.enabledProductIds?.length && !this.config?.enabledProductIds?.includes(String(this.config.productId))) {
      console.log('mySHOEFITTER: Button hidden on Product', this.config?.productId);
      return;
    }

    let button = document.getElementById(this.config?.button?.attributes?.id || 'myshoefitter-button');

    const attachTo = this.config?.button?.attachTo;
    const position = this.config?.button?.position || 'after';
    const shopSystem = this.config?.shopSystem;

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
      console.error(`mySHOEFITTER: Please add 'button' property to the config object or paste button html code manually into your template.`);
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
    console.log('mySHOEFITTER: Event', event.data);
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
      const isDesktop = this.detectClient() === 'desktop';
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

  private getHostname() {
    try {
      const url = new URL(window.location.href);
      const hostname = url?.hostname;
      return hostname;
    } catch (error) {
      return undefined;
    }
  }

  private getCurrentUrl() {
    return window.location.href;
  }

  /**
   * Automatically injects the myshoefitter button into the dom
   *
   * @param attachTo css selector of the element the button will be attached to
   * @param position place button before or after the element
   */
  private injectButton(attachTo: string, position: ButtonPosition = 'after') {

    if (!attachTo) {
      console.error('mySHOEFITTER: Please provide a valid css selector to attach the button to.');
      return null;
    }

    // Select the existing button
    const addToCartButton: HTMLElement | null = document.querySelector(attachTo);
  
    if (addToCartButton) {
      // Create a new button element
      const mysfButton: HTMLButtonElement = document.createElement('button');
  
      // Set properties on the new button
      mysfButton.id = 'myshoefitter-button'; // Set the button id
      mysfButton.innerHTML = this.config?.button?.text || this.getButtonText(); // Set the button text
      mysfButton.type = 'button'; // Set the button type

      // Add custom attributes
      if (this.config?.button?.attributes) {
        Object.entries(this.config.button.attributes).forEach(([key, value]) => {
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
      if (this.config?.button?.styles) {
        styles = { ...styles, ...this.config.button.styles }
      }

      for (const [key, value] of Object.entries(styles)) {
        mysfButton.style[key as any] = value as string;
      }

      // Add any other attributes or event listeners to the new button as needed
  
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
window.myshoefitter = new MyShoefitter();

declare global {
  interface Window {
    myshoefitter: myShoeFitter;
  }
}
