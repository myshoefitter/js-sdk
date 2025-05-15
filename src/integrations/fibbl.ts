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
          button.addEventListener('click', () => {
            console.log('Original fibbl button clicked, restoring state');
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
        this.performCustomizations(fibblQrCode);
      } else {
        // Wait for QR code to appear
        const observer = new MutationObserver(() => {
          const fibblQrCode = document.querySelector('fibbl-qr-code');
          if (fibblQrCode?.shadowRoot) {
            observer.disconnect();
            this.performCustomizations(fibblQrCode);
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
 * Update QR code only if needed
 */
  private updateQrCodeIfNeeded(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot) return;

    const qrCodeWrapper = fibblQrCode.shadowRoot.querySelector('#qr-code-wrapper') as HTMLElement | null;
    if (!qrCodeWrapper) return;

    const existingOverlay = qrCodeWrapper.querySelector('.custom-qr-code-overlay');
    if (existingOverlay) return; // Already customized

    const originalQrCode = qrCodeWrapper.querySelector('x-fibbl-qr-code');
    if (!originalQrCode) return;

    if (!fibblQrCode.shadowRoot) return;

    // Store customization state
    this.isCustomized = true;

    // Customize message element - IMPROVED STORAGE
    const message = fibblQrCode.shadowRoot.querySelector('.message') as HTMLElement | null;
    if (message && message.textContent) {
      // Store the complete original HTML rather than just text
      if (!this.customizations.has('message')) {
        this.customizations.set('message', {
          original: message.innerHTML, // Store innerHTML instead of textContent
          modified: true
        });
      }

      // Replace specific text only
      message.textContent = message.textContent.replace('try it on', 'find your size');
    }

    // Customize see-button element - IMPROVED STORAGE
    const seeButton = fibblQrCode.shadowRoot.querySelector('#see-button') as HTMLElement | null;
    if (seeButton && seeButton.textContent) {
      // Store the complete original button state if not already stored
      if (!this.customizations.has('see-button')) {
        this.customizations.set('see-button', {
          original: seeButton.innerHTML, // Store innerHTML instead of just text
          modified: true
        });
      }

      // Replace text and set up click handler
      seeButton.textContent = 'Find my size';

      // Clone to remove existing listeners
      const newSeeButton = seeButton.cloneNode(true) as HTMLElement;
      if (seeButton.parentNode) {
        seeButton.parentNode.replaceChild(newSeeButton, seeButton);
      }

      // Add click handler
      newSeeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isMobileDevice()) {
          window.open(this.customQrCodeUrl, '_blank');
        }
      });
    }

    // Customize QR code
    if (qrCodeWrapper) {
      // Store info for restoration
      this.customizations.set('qr-code-wrapper', {
        original: 'original',
        modified: true
      });

      const originalQrCode = qrCodeWrapper.querySelector('x-fibbl-qr-code');
      const existingOverlay = qrCodeWrapper.querySelector('.custom-qr-code-overlay');

      if (originalQrCode && !existingOverlay) {
        // Create and position overlay
        const overlayContainer = document.createElement('div');
        overlayContainer.className = 'custom-qr-code-overlay';
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.top = '0';
        overlayContainer.style.left = '0';
        // overlayContainer.style.width = '100%';
        // overlayContainer.style.height = '100%';
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
      }
    }

    // Set up continuous monitoring
    this.monitorForChanges(fibblQrCode);
  }

  /**
   * Perform customizations with better management
   */
  private performCustomizations(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot) return;

    // Set state first
    this.isCustomized = true;

    // Store original state first, before making changes
    this.storeOriginalState(fibblQrCode);

    // Apply customizations separately
    this.applyCustomizations(fibblQrCode);

    // Set up monitoring afterward
    this.monitorForChanges(fibblQrCode);
  }

  /**
 * Store original state separately
 */
  private storeOriginalState(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot) return;

    // Message element
    const message = fibblQrCode.shadowRoot.querySelector('.message') as HTMLElement | null;
    if (message && !this.customizations.has('message')) {
      this.customizations.set('message', {
        original: message.innerHTML,
        modified: false
      });
    }

    // See button
    const seeButton = fibblQrCode.shadowRoot.querySelector('#see-button') as HTMLElement | null;
    if (seeButton && !this.customizations.has('see-button')) {
      this.customizations.set('see-button', {
        original: seeButton.innerHTML,
        modified: false
      });
    }

    // QR code wrapper
    if (!this.customizations.has('qr-code-wrapper')) {
      this.customizations.set('qr-code-wrapper', {
        original: 'original',
        modified: false
      });
    }
  }

  /**
   * Monitor for changes with anti-recursion protection
   */
  private monitorForChanges(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot || !this.isCustomized) return;

    // Clear any previous observer for this element
    this.disconnectShadowObservers();

    // Create a new observer with unique ID
    const observerId = ++this.observerIds;
    const observer = new MutationObserver((mutations) => {
      // Prevent recursion and debounce updates
      if (this.isUpdating) return;

      // Cancel any pending update
      if (this.updateDebounceTimeout !== null) {
        window.clearTimeout(this.updateDebounceTimeout);
      }

      // Debounce to prevent excessive updates
      this.updateDebounceTimeout = window.setTimeout(() => {
        // Only update if we're still in customized state
        if (this.isCustomized) {
          this.isUpdating = true;
          this.applyCustomizations(fibblQrCode);

          // Reset the flag after a short delay to allow DOM to settle
          setTimeout(() => {
            this.isUpdating = false;
            this.updateDebounceTimeout = null;
          }, 50);
        }
      }, 100);
    });

    // Start observing with limited scope
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
    }, 60 * 1000); // 1 minute max observation time
  }

  /**
   * Disconnect shadow DOM observers to prevent recursion
   */
  private disconnectShadowObservers(): void {
    this.activeObservers.forEach(observer => observer.disconnect());
    this.activeObservers.clear();
  }

  /**
  * Apply customizations with anti-recursion protection
  */
  private applyCustomizations(fibblQrCode: Element): void {
    if (!fibblQrCode.shadowRoot) return;

    try {
      // Simplified application - only make changes that are needed
      const message = fibblQrCode.shadowRoot.querySelector('.message') as HTMLElement | null;
      if (message && message.textContent && message.textContent.includes('try it on')) {
        message.textContent = message.textContent.replace('try it on', 'find your size');
      }

      const seeButton = fibblQrCode.shadowRoot.querySelector('#see-button') as HTMLElement | null;
      if (seeButton && seeButton.textContent && seeButton.textContent !== 'Find my size') {
        seeButton.textContent = 'Find my size';
      }

      // QR code customization (only if needed)
      this.updateQrCodeIfNeeded(fibblQrCode);
    } catch (e) {
      console.error('Error applying customizations:', e);
    }
  }

  /**
   * Restore original content with better cleanup
   */
  private restoreOriginalContent(): void {
    // Disconnect observers first to avoid recursive updates
    this.disconnectShadowObservers();

    // Set customization state to false
    this.isCustomized = false;

    // Clear any pending updates
    if (this.updateDebounceTimeout !== null) {
      window.clearTimeout(this.updateDebounceTimeout);
      this.updateDebounceTimeout = null;
    }

    const fibblQrCode = document.querySelector('fibbl-qr-code');
    if (!fibblQrCode?.shadowRoot) return;

    try {
      // IMPROVED: Restore message with complete replacement
      if (this.customizations.has('message')) {
        const message = fibblQrCode.shadowRoot.querySelector('.message') as HTMLElement | null;
        if (message) {
          // Use innerHTML instead of textContent for complete restoration
          const originalHtml = this.customizations.get('message')?.original || '';

          // Create a new element to replace the existing one
          const newMessage = document.createElement('div');
          newMessage.className = 'message';
          newMessage.innerHTML = originalHtml;

          // Copy all attributes except class
          Array.from(message.attributes).forEach(attr => {
            if (attr.name !== 'class') {
              newMessage.setAttribute(attr.name, attr.value);
            }
          });

          // Replace the original
          if (message.parentNode) {
            message.parentNode.replaceChild(newMessage, message);
          }
        }
      }

      // IMPROVED: Restore see-button with complete replacement
      if (this.customizations.has('see-button')) {
        const seeButton = fibblQrCode.shadowRoot.querySelector('#see-button') as HTMLElement | null;
        if (seeButton) {
          // Create a completely new button element
          const newButton = document.createElement('button');
          newButton.id = 'see-button';

          // Restore original HTML content
          newButton.innerHTML = this.customizations.get('see-button')?.original || '';

          // Copy all attributes except id
          Array.from(seeButton.attributes).forEach(attr => {
            if (attr.name !== 'id') {
              newButton.setAttribute(attr.name, attr.value);
            }
          });

          // Replace the modified button
          if (seeButton.parentNode) {
            seeButton.parentNode.replaceChild(newButton, seeButton);
          }
        }
      }

      // Remove custom QR overlay
      if (this.customizations.has('qr-code-wrapper')) {
        const qrCodeWrapper = fibblQrCode.shadowRoot.querySelector('#qr-code-wrapper') as HTMLElement | null;
        if (qrCodeWrapper) {
          const customOverlay = qrCodeWrapper.querySelector('.custom-qr-code-overlay');
          if (customOverlay) {
            customOverlay.remove();
          }
        }
      }

      console.log('Original content restored');
    } catch (e) {
      console.error('Error restoring content:', e);
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