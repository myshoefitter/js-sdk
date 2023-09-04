/**
 * Represents a service with functionalities related to a product.
 */
class MyShoefitter {
  private config: ScriptConfig | null = null;
  private dialog: HTMLDialogElement | null = null;

  /**
   * Initialize the Script
   * @param config ScriptConfig
   */
  public init(config: ScriptConfig): void {
    this.config = config;

    if (this.config?.productId) {
      this.addButtonClickListener();
      // this.trackScriptLoad();
      console.log(`mySHOEFITTER Config: ${this.config}`);
    } else {
      console.warn('mySHOEFITTER: productId is missing!');
    }
  }

  /**
   * Reloads or refreshes based on the current product ID.
   * Will not perform any action if the product ID is not set.
   */
  public reload(): void {
    if (this.config) {
      // Your reloading logic here...
      // @Ahmad wir brauchen diese funktion wahrscheinlich nicht mehr.
      console.log('Reloaded mySHOEFITTER Config');
    } else {
      console.warn(
        'mySHOEFITTER is not initialized. Calling reload() has no effect.',
      );
    }
  }

  public showBanner(): void {
    // Create the dialog element
    const dialog = document.createElement('dialog');
    dialog.style.width = '80%';
    dialog.style.height = '300px';
    dialog.style.padding = '0';
    dialog.style.border = 'none';
    dialog.style.borderRadius = '20px';

    // Create the iframe element
    const iframe = document.createElement('iframe');
    iframe.src = this.generateBannerLink();
    iframe.scrolling = 'no';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';

    // Append the iframe to the dialog
    dialog.appendChild(iframe);

    // Append the dialog to the body
    document.body.appendChild(dialog);

    // Listen to close event from iframe content
    window.addEventListener('message', this.handleMessage, false);

    // Show the dialog
    return dialog.showModal();
  }

  public closeBanner(): void {
    if (this.config) {
      return this.dialog?.close();
    } else {
      console.warn('mySHOEFITTER is not initialized');
    }
  }

  /**
   * Generates the link incl. all params that opens in the iframe
   * @returns https://banner.myshoefitter.com/?....
   */
  private generateBannerLink(): string {
    if (!this.config?.productId) {
      console.warn('mySHOEFITTER: No productId found!')
      return '';
    }
    const params: Record<string, string> = {
      productId: this.config.productId,
      ref: window.location.href
    };    
    return 'https://banner.myshoefitter.com/?' + new URLSearchParams(params).toString();
  }

  /**
   * Find the button in html and add click listener
   */
  private addButtonClickListener(): void {
    const button = document.getElementById('myshoefitter-button');
    if (button) {
      button.addEventListener('click', () => this.showBanner());
    }
  }

  /**
   * Listens to custom events from the iframe content
   * @param event MessageEvent
   */
  private handleMessage(event: MessageEvent): void {
    if (event.origin !== 'https://banner.myshoefitter.com') {
      return;
    }
    switch (event.data) {
      case 'CLOSE_BANNER':
        this.closeBanner();
        break;
    }
  }
}

interface ScriptConfig {
  productId: string;
  logsEnabled?: boolean;
  buttonSelector?: string;
}

// Expose Class
const myshoefitter = new MyShoefitter();
