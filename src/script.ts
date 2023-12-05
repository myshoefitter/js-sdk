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
  private readonly bannerOrigin = 'https://dialog.myshoefitter.com';

  /**
   * Initialize the Script
   * @param config ScriptConfig
   */
  public init(config: ScriptConfig): void {
    this.config = config;

    if (config?.productId) {

      this.params = Object.assign(config,
        {
          sessionId: this.generateSessionId(),
          clientType: this.detectClient(),
          ref: location.href // Don't remove or encrypt! Needed for Analytics!
        });

      this.addButtonClickListener();
      this.trackEvent('Button Load');

      console.log('mySHOEFITTER Config:', config);
      console.log('mySHOEFITTER Session ID:', this.params.sessionId);
    } else {
      console.warn('mySHOEFITTER: productId is missing!');
    }
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
      iframe.onload = () => {
        this.hideLoader();
      };
    }

    // Listen to close and resize events from iframe content
    window.addEventListener('message', (event) => this.messageParser(event), false);

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

      // Remove event listeners
      window.removeEventListener('message', (event) => this.handleMessage(event), false);
      window.removeEventListener('resize', () => this.setDialogSize(), false);
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
  private addButtonClickListener(): void {
    const button = document.getElementById('myshoefitter-button');
    if (button) {
      button.addEventListener('click', (event: Event) => {
        event.preventDefault();
        this.showBanner();
        this.trackEvent('Banner Open');
      });
    }
  }

  /**
   * Listens to custom events from the iframe content
   * @param event MessageEvent
   */
  private handleMessage(event: MessageEvent): void {
    if (event.origin !== this.bannerOrigin) {
      return;
    }
    switch (event.data) {
      case 'CLOSE_BANNER':
        this.closeBanner();
        break;
    }
  }

  /**
   * Parses custom events from the iframe content
   * @param event MessageEvent
   */
  private messageParser(event: MessageEvent) {
    if (event.origin !== this.bannerOrigin) {
      return;
    }

    if (event.data.type && event.data.type === 'iframeScrollHeight') {
      const iframe = this.dialog?.children[0] as HTMLIFrameElement;
      iframe.height = event.data.height;
      if (this.dialog) {
        this.dialog.style.height = iframe.height + "px";
        this.dialog.style.width = iframe.width + "px";
      }
    } else {
      this.handleMessage(event);
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
}

interface ScriptConfig {
  shopId: string;
  productId: string;
  logsEnabled?: boolean;
  buttonSelector?: string;
}

interface BannerParams extends ScriptConfig {
  sessionId: string;
}

interface MyShoefitterClass {
  init: (config: ScriptConfig) => void;
}

interface WindowExtended extends Window {
  myshoefitter: MyShoefitterClass;
}

// Expose class to parent page
(window as unknown as WindowExtended).myshoefitter = new MyShoefitter();
