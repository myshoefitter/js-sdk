import { Integration, IntegrationOptions } from '../types/types';
import { generateAppLink } from '../utils/helpers';

/**
 * Custom controller for Fibbl elements that implements the Integration interface
 */
export default class FibblCustomizer implements Integration {
  private observers: MutationObserver[] = [];
  private customizations: Map<string, { original: string, modified: boolean }> = new Map();
  private isCustomized = false;
  private customQrCodeUrl = '';
  private mobileBreakpoint = 768; // Breakpoint for mobile devices in pixels

  private isUpdating = false; // Flag to prevent recursion
  private updateDebounceTimeout: number | null = null;
  private observerIds: number = 0;
  private activeObservers: Map<number, MutationObserver> = new Map();

  /**
   * Initialize the integration with options
   * @param options Configuration options from script.ts
   */
  public init(options: IntegrationOptions): void {
    // Generate app link and pre-load QR code image
    this.customQrCodeUrl = generateAppLink({ clientType: 'mobile' });
    const preloadImage = new Image();
    preloadImage.src = this.customQrCodeUrl;

    // Apply any custom options
    if (options.mobileBreakpoint) {
      this.mobileBreakpoint = options.mobileBreakpoint;
    }

    // Initialize listeners
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupButtonListeners());
    } else {
      this.setupButtonListeners();
    }

    // Listen for window resize events
    window.addEventListener('resize', this.handleResize.bind(this));

    console.log('FibblCustomizer initialized successfully');
  }

  /**
   * Handle window resize events
   */
  private handleResize(): void {
    // Find our custom size button and update its behavior based on screen size
    const sizeButton = document.querySelector('button[data-size-button="true"]');
    if (sizeButton) {
      this.updateButtonBehavior(sizeButton as HTMLButtonElement);
    }
  }

  /**
   * Check if the device is mobile based on screen width
   */
  private isMobileDevice(): boolean {
    return window.innerWidth < this.mobileBreakpoint;
  }

  /**
   * Update button behavior based on screen size
   */
  private updateButtonBehavior(button: HTMLButtonElement): void {
    // Remove existing click listeners
    const newButton = button.cloneNode(true) as HTMLButtonElement;
    button.parentNode?.replaceChild(newButton, button);

    if (this.isMobileDevice()) {
      // On mobile: direct link behavior
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Mobile device detected, redirecting to:', this.customQrCodeUrl);
        window.open(this.customQrCodeUrl, '_blank');
      });
    } else {
      // On desktop: customization behavior
      newButton.addEventListener('click', () => {
        console.log('Desktop device detected, showing customized overlay');
        // First restore the original content to ensure we start with a clean state
        this.restoreOriginalContent();
        // Then customize the QR code content
        this.customizeQrCodeContent();
      });
    }
  }

  /**
   * Find and setup button listeners on the fibbl-layer
   */
  private setupButtonListeners(): void {
    const findFibblLayer = (): HTMLElement | null => {
      return document.querySelector('fibbl-layer');
    };

    const setupListeners = (fibblLayer: HTMLElement): void => {
      console.log('Setting up button listeners on fibbl-layer');

      // Find all buttons in the layer
      const buttons = Array.from(fibblLayer.querySelectorAll('button'));

      // Add our custom button
      this.addSizeButton(fibblLayer, buttons);

      // Add click listeners to all other buttons to restore original state
      buttons.forEach(button => {
        if (!button.hasAttribute('data-size-button')) {
          // Use a new click listener that first removes any previous customizations
          button.addEventListener('click', () => {
            console.log('Original fibbl button clicked, restoring state');
            // Important: restore original content BEFORE fibbl changes it
            this.restoreOriginalContent();
          });
        }
      });
    };

    // Check if layer already exists
    const fibblLayer = findFibblLayer();
    if (fibblLayer) {
      setupListeners(fibblLayer);
    } else {
      // Wait for it to appear
      const observer = new MutationObserver(() => {
        const fibblLayer = findFibblLayer();
        if (fibblLayer) {
          observer.disconnect();
          setupListeners(fibblLayer);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      this.observers.push(observer);
    }
  }

  /**
   * Add custom size button to the fibbl-layer
   */
  private addSizeButton(fibblLayer: HTMLElement, existingButtons: HTMLButtonElement[]): void {
    const referenceButton = existingButtons.find(btn =>
      !btn.classList.contains('fibbl-active')
    );

    if (!referenceButton) return;

    // Create the new button
    const sizeButton = document.createElement('button') as HTMLButtonElement;

    // Copy classes except "fibbl-active"
    if (referenceButton.className) {
      const classes = referenceButton.className
        .split(' ')
        .filter(c => c !== 'fibbl-active');
      sizeButton.className = classes.join(' ');
    }

    // Copy styles and attributes
    if (referenceButton.hasAttribute('style')) {
      sizeButton.setAttribute('style', referenceButton.getAttribute('style') || '');
    }

    Array.from(referenceButton.attributes).forEach(attr => {
      if (!['data-element', 'class', 'style'].includes(attr.name)) {
        sizeButton.setAttribute(attr.name, attr.value);
      }
    });

    // Mark as our custom button
    sizeButton.setAttribute('data-element', 'fibbl-qr-code');
    sizeButton.setAttribute('data-type', 'vto');
    sizeButton.setAttribute('data-size-button', 'true');
    sizeButton.innerHTML = ' Find size';

    // Add button to layer
    fibblLayer.appendChild(sizeButton);

    // Set up appropriate behavior based on current screen size
    this.updateButtonBehavior(sizeButton);
  }

  /**
   * Customize QR code content
   */
  private customizeQrCodeContent(): void {
    // If mobile device, redirect instead of customizing
    if (this.isMobileDevice()) {
      window.open(this.customQrCodeUrl, '_blank');
      return;
    }

    const waitForQrCode = (): void => {
      const fibblQrCode = document.querySelector('fibbl-qr-code');

      if (fibblQrCode?.shadowRoot) {
        // Wait a short moment to ensure the fibbl content is fully rendered
        setTimeout(() => {
          this.performCustomizations(fibblQrCode);
        }, 50);
      } else {
        // Wait for QR code to appear
        const observer = new MutationObserver(() => {
          const fibblQrCode = document.querySelector('fibbl-qr-code');
          if (fibblQrCode?.shadowRoot) {
            observer.disconnect();
            // Wait a short moment to ensure the fibbl content is fully rendered
            setTimeout(() => {
              this.performCustomizations(fibblQrCode);
            }, 50);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        this.observers.push(observer);
      }
    };

    waitForQrCode();
  }

  /**
   * Store original state with complete details
   */
  private storeOriginalState(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot) return;

    try {
      // Store message content if not already stored
      const message = fibblQrCode.shadowRoot.querySelector('.message') as HTMLElement | null;
      if (message && !this.customizations.has('message')) {
        console.log('Storing original message content');
        this.customizations.set('message', {
          original: message.innerHTML,
          modified: false
        });
      }

      // Store see button content if not already stored
      const seeButton = fibblQrCode.shadowRoot.querySelector('#see-button') as HTMLElement | null;
      if (seeButton && !this.customizations.has('see-button')) {
        console.log('Storing original see-button content');
        this.customizations.set('see-button', {
          original: seeButton.innerHTML,
          modified: false
        });
      }

      // Store QR code state if not already stored
      const qrCodeWrapper = fibblQrCode.shadowRoot.querySelector('#qr-code-wrapper') as HTMLElement | null;
      if (qrCodeWrapper && !this.customizations.has('qr-code-wrapper')) {
        console.log('Storing original QR code wrapper state');
        // We're storing a deeper clone of the wrapper for better restoration
        const clonedWrapper = qrCodeWrapper.cloneNode(true);
        this.customizations.set('qr-code-wrapper', {
          original: qrCodeWrapper.innerHTML,
          modified: false
        });
      }
    } catch (e) {
      console.error('Error storing original state:', e);
    }
  }

  /**
   * Perform customizations with better management
   */
  private performCustomizations(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot) return;

    // First ensure we've stored the original state
    this.storeOriginalState(fibblQrCode);

    // Set state flag
    this.isCustomized = true;

    try {
      // Customize message
      const message = fibblQrCode.shadowRoot.querySelector('.message') as HTMLElement | null;
      if (message && message.textContent) {
        console.log('Customizing message:', message.textContent);
        message.textContent = message.textContent.replace('try it on', 'find your size');

        // Mark as modified
        if (this.customizations.has('message')) {
          this.customizations.get('message')!.modified = true;
        }
      }

      // Customize see-button
      const seeButton = fibblQrCode.shadowRoot.querySelector('#see-button') as HTMLElement | null;
      if (seeButton) {
        console.log('Customizing see-button');
        // Clone to remove existing listeners
        const newSeeButton = seeButton.cloneNode(true) as HTMLElement;
        newSeeButton.textContent = 'Find my size';

        if (seeButton.parentNode) {
          seeButton.parentNode.replaceChild(newSeeButton, seeButton);
        }

        // Add click handler for the new button
        newSeeButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(this.customQrCodeUrl, '_blank');
        });

        // Mark as modified
        if (this.customizations.has('see-button')) {
          this.customizations.get('see-button')!.modified = true;
        }
      }

      // Customize QR code
      const qrCodeWrapper = fibblQrCode.shadowRoot.querySelector('#qr-code-wrapper') as HTMLElement | null;
      if (qrCodeWrapper) {
        console.log('Customizing QR code wrapper');
        const originalQrCode = qrCodeWrapper.querySelector('x-fibbl-qr-code');
        const existingOverlay = qrCodeWrapper.querySelector('.custom-qr-code-overlay');

        if (originalQrCode && !existingOverlay) {
          // Create and position overlay
          const overlayContainer = document.createElement('div');
          overlayContainer.className = 'custom-qr-code-overlay';
          overlayContainer.style.position = 'absolute';
          overlayContainer.style.top = '0';
          overlayContainer.style.left = '0';
          overlayContainer.style.zIndex = '10';
          overlayContainer.style.padding = '10px';
          overlayContainer.style.borderRadius = '10px';

          // Create image
          const newQrCode = document.createElement('img');
          newQrCode.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(this.customQrCodeUrl);
          newQrCode.alt = 'Size Finder QR Code';
          newQrCode.style.width = '100%';
          newQrCode.style.height = '100%';
          newQrCode.style.objectFit = 'contain';

          // Make the QR code clickable on all devices
          overlayContainer.style.cursor = 'pointer';
          overlayContainer.addEventListener('click', () => {
            window.open(this.customQrCodeUrl, '_blank');
          });

          overlayContainer.appendChild(newQrCode);

          // Ensure proper positioning
          const currentPosition = window.getComputedStyle(qrCodeWrapper).position;
          if (currentPosition === 'static') {
            qrCodeWrapper.style.position = 'relative';
          }

          qrCodeWrapper.appendChild(overlayContainer);

          // Mark as modified
          if (this.customizations.has('qr-code-wrapper')) {
            this.customizations.get('qr-code-wrapper')!.modified = true;
          }
        }
      }

      // Start observing for changes to maintain customizations
      this.monitorForChanges(fibblQrCode);
    } catch (e) {
      console.error('Error performing customizations:', e);
    }
  }

  /**
   * Monitor for changes with improved handling
   */
  private monitorForChanges(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot || !this.isCustomized) return;

    // First, disconnect any existing shadow observers
    this.disconnectShadowObservers();

    // Create a new observer with unique ID
    const observerId = ++this.observerIds;
    const observer = new MutationObserver((mutations) => {
      // Prevent recursion
      if (this.isUpdating) return;

      // Cancel any pending update
      if (this.updateDebounceTimeout !== null) {
        window.clearTimeout(this.updateDebounceTimeout);
      }

      // Debounce updates to prevent excessive DOM manipulations
      this.updateDebounceTimeout = window.setTimeout(() => {
        // Only update if we're still in customized state and the element is still in the DOM
        if (this.isCustomized && document.contains(fibblQrCode)) {
          this.isUpdating = true;

          // Maintain our customizations
          this.maintainCustomizations(fibblQrCode);

          // Reset the flag after a delay
          setTimeout(() => {
            this.isUpdating = false;
            this.updateDebounceTimeout = null;
          }, 50);
        } else {
          // Element is no longer in DOM or we're not in customized state
          this.disconnectShadowObservers();
        }
      }, 100);
    });

    // Start observing with more targeted scope
    observer.observe(fibblQrCode.shadowRoot, {
      childList: true,
      subtree: true,
      characterData: false, // Reduce sensitivity
      attributes: false     // Reduce sensitivity
    });

    // Store observer reference
    this.activeObservers.set(observerId, observer);

    // Safety cleanup after some time
    setTimeout(() => {
      if (this.activeObservers.has(observerId)) {
        observer.disconnect();
        this.activeObservers.delete(observerId);
      }
    }, 30 * 1000); // 30 seconds max observation time
  }

  /**
   * Maintain customizations during DOM changes
   */
  private maintainCustomizations(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot || !this.isCustomized) return;

    try {
      // Check for message changes
      const message = fibblQrCode.shadowRoot.querySelector('.message') as HTMLElement | null;
      if (message && message.textContent && message.textContent.includes('try it on')) {
        console.log('Maintaining message customization');
        message.textContent = message.textContent.replace('try it on', 'find your size');
      }

      // Check for see-button changes
      const seeButton = fibblQrCode.shadowRoot.querySelector('#see-button') as HTMLElement | null;
      if (seeButton && (!seeButton.textContent || seeButton.textContent !== 'Find my size')) {
        console.log('Maintaining see-button customization');
        seeButton.textContent = 'Find my size';

        // Re-add click handler if needed
        const hasClickHandler = seeButton.onclick !== null;
        if (!hasClickHandler) {
          seeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(this.customQrCodeUrl, '_blank');
          });
        }
      }

      // Check QR code overlay
      const qrCodeWrapper = fibblQrCode.shadowRoot.querySelector('#qr-code-wrapper') as HTMLElement | null;
      if (qrCodeWrapper) {
        const existingOverlay = qrCodeWrapper.querySelector('.custom-qr-code-overlay');
        if (!existingOverlay && this.customizations.has('qr-code-wrapper') &&
          this.customizations.get('qr-code-wrapper')!.modified) {
          console.log('Restoring QR code overlay');

          // Create and position overlay
          const overlayContainer = document.createElement('div');
          overlayContainer.className = 'custom-qr-code-overlay';
          overlayContainer.style.position = 'absolute';
          overlayContainer.style.top = '0';
          overlayContainer.style.left = '0';
          overlayContainer.style.width = '100%';
          overlayContainer.style.height = '100%';
          overlayContainer.style.zIndex = '10';
          overlayContainer.style.padding = '10px';
          overlayContainer.style.borderRadius = '10px';

          // Create image
          const newQrCode = document.createElement('img');
          newQrCode.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(this.customQrCodeUrl);
          newQrCode.alt = 'Size Finder QR Code';
          newQrCode.style.width = '100%';
          newQrCode.style.height = '100%';
          newQrCode.style.objectFit = 'contain';

          // Make the QR code clickable
          overlayContainer.style.cursor = 'pointer';
          overlayContainer.addEventListener('click', () => {
            window.open(this.customQrCodeUrl, '_blank');
          });

          overlayContainer.appendChild(newQrCode);

          // Ensure proper positioning
          const currentPosition = window.getComputedStyle(qrCodeWrapper).position;
          if (currentPosition === 'static') {
            qrCodeWrapper.style.position = 'relative';
          }

          qrCodeWrapper.appendChild(overlayContainer);
        }
      }
    } catch (e) {
      console.error('Error maintaining customizations:', e);
    }
  }

  /**
   * Disconnect shadow DOM observers to prevent recursion
   */
  private disconnectShadowObservers(): void {
    this.activeObservers.forEach(observer => observer.disconnect());
    this.activeObservers.clear();
  }

  /**
   * Restore original content with complete restoration
   */
  private restoreOriginalContent(): void {
    // Immediately disconnect all observers to prevent interference
    this.disconnectShadowObservers();

    // Reset state
    this.isCustomized = false;
    this.isUpdating = false;

    // Clear any pending updates
    if (this.updateDebounceTimeout !== null) {
      window.clearTimeout(this.updateDebounceTimeout);
      this.updateDebounceTimeout = null;
    }

    const fibblQrCode = document.querySelector('fibbl-qr-code');
    if (!fibblQrCode?.shadowRoot) {
      console.log('No fibbl-qr-code element found to restore');
      return;
    }

    console.log('Restoring original content');

    try {
      // Restore message if it was modified
      if (this.customizations.has('message') && this.customizations.get('message')!.modified) {
        const message = fibblQrCode.shadowRoot.querySelector('.message') as HTMLElement | null;
        if (message) {
          const originalHtml = this.customizations.get('message')!.original;
          message.innerHTML = originalHtml;
          console.log('Restored original message:', originalHtml);
          this.customizations.get('message')!.modified = false;
        }
      }

      // Restore see-button if it was modified
      if (this.customizations.has('see-button') && this.customizations.get('see-button')!.modified) {
        const seeButton = fibblQrCode.shadowRoot.querySelector('#see-button') as HTMLElement | null;
        if (seeButton) {
          // Create a new button to replace the modified one
          const newButton = document.createElement('button');
          newButton.id = 'see-button';

          // Copy attributes from the current button
          Array.from(seeButton.attributes).forEach(attr => {
            if (attr.name !== 'id') {
              newButton.setAttribute(attr.name, attr.value);
            }
          });

          // Restore original content
          newButton.innerHTML = this.customizations.get('see-button')!.original;

          // Replace the button
          if (seeButton.parentNode) {
            seeButton.parentNode.replaceChild(newButton, seeButton);
            console.log('Restored original see-button');
          }

          this.customizations.get('see-button')!.modified = false;
        }
      }

      // Remove QR code overlay if it exists
      if (this.customizations.has('qr-code-wrapper') && this.customizations.get('qr-code-wrapper')!.modified) {
        const qrCodeWrapper = fibblQrCode.shadowRoot.querySelector('#qr-code-wrapper') as HTMLElement | null;
        if (qrCodeWrapper) {
          const customOverlay = qrCodeWrapper.querySelector('.custom-qr-code-overlay');
          if (customOverlay) {
            customOverlay.remove();
            console.log('Removed custom QR code overlay');
          }

          this.customizations.get('qr-code-wrapper')!.modified = false;
        }
      }
    } catch (e) {
      console.error('Error while restoring original content:', e);
    }
  }

  /**
   * Clean up all resources
   */
  public destroy(): void {
    // Clear pending updates
    if (this.updateDebounceTimeout !== null) {
      window.clearTimeout(this.updateDebounceTimeout);
    }

    // Disconnect all observers
    this.disconnectShadowObservers();
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear customizations
    this.customizations.clear();

    // Reset state
    this.isCustomized = false;
    this.isUpdating = false;

    // Remove window resize listener
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}