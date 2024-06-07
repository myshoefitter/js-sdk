import { dc, magento, shopify } from './shop-adapters/index';

/**
 * Represents a service with functionalities related to a product.
 */
class MyShoefitter {
  // The config to initialize the script
  private config: ScriptConfig | null = null;
  // The dialog window
  private dialog: HTMLDialogElement | null = null;
  // The params for the banner
  private params: BannerParams | null = null;
  // Banner Origin
  private bannerOrigin = 'https://dialog.myshoefitter.com';
  // Shop systems width available adapters
  private readonly supportedShopSystems = ['woocommerce', 'shopify', 'magento', 'shopware', 'oxid', 'prestashop', 'bigcommerce', 'dc', 'custom'];
  // Callback for events
  private callback?: (event: CustomEvent) => void;

  /**
   * Initialize the Script
   * @param config ScriptConfig
   */
  public init(config: ScriptConfig): void {
    this.config = config;

    // Override the default banner url
    if (typeof config?.bannerUrl === 'string') {
      this.bannerOrigin = config.bannerUrl;
    }

    // Show warning if shop id is missing - shop id is important for tracking
    if (!config?.shopId) {
      config.shopId = this.getHostname(); // On PWA V2, the hostname will be used to identify the shop
    }

    // Show error if productId and shopSystem are missing - pwa will not work without these parameters
    if (!config?.productId && !config?.shopSystem) {
      console.error('mySHOEFITTER: Please provide either productId or shopSystem!');
    }

    if (config?.shopSystem && !this.supportedShopSystems.includes(config.shopSystem)) {
      console.error('mySHOEFITTER: Shop System is not supported! productId is required.');
    }

    // Check if the Shop System is supported and find the Product ID automatically
    if (config?.shopSystem && this.supportedShopSystems.includes(config.shopSystem)) {
      const { sku } = this.getShopSystemConfig(config.shopSystem);

      if (!config?.productId && sku) {
        config.productId = sku;
        console.log(`mySHOEFITTER: Product ID found: ${config.productId}`);
      } else {
        console.error('mySHOEFITTER: Product ID could not be found! Please set it manually using productId parameter.');
      }
    }

    this.params = Object.assign(config,
      {
        sessionId: this.generateSessionId(),
        clientType: this.detectClient(),
        utm_source: window?.location.hostname // Don't remove or encrypt! Needed for Analytics!
      });

    this.addButton();
    this.trackEvent('Button Load');

    this.emit({
      type: EventTypes.Init,
      data: config
    });

    console.log('mySHOEFITTER Config:', config);
    console.log('mySHOEFITTER Session ID:', this.params.sessionId);
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
    // Create the dialog element
    if (!this.dialog) {
      this.dialog = document.createElement('dialog');
      this.dialog.id = 'myshoefitter-dialog';
      this.dialog.style.padding = '0';
      this.dialog.style.border = 'none';
      this.dialog.style.borderRadius = '25px';
      this.dialog.style.overflow = 'hidden';
      this.dialog.style.maxWidth = '1200px';
      this.dialog.style.minWidth = '375px';
      this.dialog.style.top = '50%';
      this.dialog.style.left = '50%';
      this.dialog.style.transform = 'translate(-50%, -50%)';
      this.setDialogSize();

      // Create the iframe element
      const iframe = document.createElement('iframe');
      iframe.src = this.generateBannerLink();
      iframe.scrolling = 'no';
      iframe.style.maxWidth = '1200px';
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
      loader.innerHTML = `
        <style>
        .myshoefitter-loader {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        </style>
      `;

      // Append the loader to the dialog
      this.dialog.appendChild(loader);

      // Append the iframe to the dialog
      this.dialog.appendChild(iframe);

      // Append the dialog to the body
      document.body.appendChild(this.dialog);
    }

    // Show the dialog
    this.dialog.showModal();
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
    if (!this.config?.productId || !this.params) {
      console.warn('mySHOEFITTER: No productId found!')
      return '';
    }
    return this.bannerOrigin + '/?' + new URLSearchParams(this.params as unknown as Record<string, string>).toString();
  }

  /**
   * Find the button in html and add click listener
   */
  private addButton(): void {
    let button = document.getElementById('myshoefitter-button');

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
        this.trackEvent('Banner Open');
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
    // Block all unwanted events
    if (!event?.origin?.includes('myshoefitter.com') || !event?.data?.type || !event?.data?.data) {
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
      if (this.dialog?.style && iframe) {
        iframe.height = event?.data?.data?.height;
        this.dialog.style.height = iframe.height + "px";
        this.dialog.style.width = iframe.width + "px";
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

    // Don't send request on localhost
    if ((/^localhost(.*)$|^127(\.[0-9]{1,3}){3}$/is.test(location.hostname) || location.protocol === "file:")) {
      console.info("Pirsch is ignored on localhost. Add the data-dev attribute to enable it.");
    }

    const data = {
      identification_code: 'kGhjVS9A2aJtLg6PWZx0h6OV8N23WqEy',
      url: this.bannerOrigin,
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
    }

    return config;
  }

  private getHostname() {
    try {
      const url = new URL(this.getCurrentUrl());
      const hostname = url.hostname;
      return hostname;
    } catch (error) {
      return null;
    }
  }

  private getCurrentUrl() {
    return window.location.href;
  }

  /**
   * Generate a unique session ID
   * @returns Session ID
   * @see https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
   */
  private generateSessionId() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (parseInt(c, 10) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c, 10) / 4).toString(16)
    );
  }

  private setDialogSize(): void {

    if (!this.dialog) {
      return;
    }

    const screenWidth = window.innerWidth;

    if (screenWidth <= 768) {
      // Mobile devices
      this.dialog.style.width = '95%';
      this.dialog.style.height = '85vh';
    } else if (screenWidth > 768 && screenWidth <= 1024) {
      // Tablets
      this.dialog.style.width = '90%';
      this.dialog.style.height = '70vh';
    } else {
      // Desktop
      this.dialog.style.width = '80%';
      this.dialog.style.maxWidth = '1200px';
      this.dialog.style.height = '370px';
    }
  }

  /**
   * Automatically injects the myshoefitter button into the dom
   *
   * @param attachTo css selector of the element the button will be attached to
   * @param position place button before or after the element
   */
  private injectButton(attachTo: string, position: ButtonPosition = 'after') {
    // Select the existing button
    const addToCartButton: HTMLElement | null = document.querySelector(attachTo);
  
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

    return addToCartButton;
  }
}

interface ScriptConfig {
  shopId: string | null; // @deprecated
  productId?: string | number;
  logsEnabled?: boolean;
  shopSystem?: string;
  bannerUrl?: boolean; // Override the default banner url
  button?: {
    attachTo: string;
    position?: ButtonPosition;
  }
}

interface BannerParams extends ScriptConfig {
  sessionId: string;
}

interface CustomEvent {
  type: EventTypes;
  data: any;
}

enum EventTypes {
  Init = 'INIT',
  Result = 'RESULT',
  PageView = 'PAGE_VIEW',
  Banner = 'BANNER'
}

// Expose class to parent page
window.myshoefitter = new MyShoefitter();

declare global {
  interface Window {
    myshoefitter: MyShoefitter;
  }
}

type ButtonPosition = 'before' | 'after';

interface ShopSystemConfig {
  sku: string | number | null;
  selector: string;
}
