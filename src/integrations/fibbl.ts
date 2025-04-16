import { FibblElement } from "../types/types";

export function fibbl(): void {
  console.log('mySHOEFITTER: Fibbl integration executed!');

  // Store a reference to the original children of #fibbl-model
  let originalModelChildren: FibblElement[] = [];

  // Initialize the integration
  initFibblIntegration();

  /**
   * Main initialization function for the Fibbl integration
   */
  function initFibblIntegration(): void {
    const buttonContainers = document.querySelectorAll('.fibbl__controls-switch') as NodeListOf<HTMLDivElement>;
    
    if (buttonContainers.length === 0) {
      console.error('mySHOEFITTER: No Fibbl button containers found.');
      return;
    }

    buttonContainers.forEach(addSizeFinderButtonToContainer);
  }

  /**
   * Adds the "Find Size" button to a Fibbl container
   */
  function addSizeFinderButtonToContainer(container: HTMLDivElement): void {
    // Find the first existing button to clone
    const existingButton = container.querySelector('button.fibbl__controls-switch--option');
    
    if (!existingButton) {
      console.error('mySHOEFITTER: No existing button found to clone in container.');
      return;
    }

    // Only add the new button if it doesn't already exist
    if (container.querySelector('[data-element="find-size"]')) {
      return;
    }

    // Modify the container to accommodate another button
    container.style.setProperty('grid-template-columns', 'repeat(4, auto)');

    // Create the new button
    const sizeFinderButton = createSizeFinderButton(existingButton as HTMLButtonElement);
    
    // Add click handlers to original buttons to restore view
    addRestoreHandlersToOriginalButtons(container);
    
    // Append the new button to the container
    container.appendChild(sizeFinderButton);
  }

  /**
   * Creates the "Find Size" button by cloning an existing button
   */
  function createSizeFinderButton(existingButton: HTMLButtonElement): HTMLButtonElement {
    // Clone the existing button deeply
    const newButton = existingButton.cloneNode(true) as HTMLButtonElement;

    // Modify the new button's attributes
    newButton.dataset.element = 'find-size';
    newButton.classList.remove('fibbl-active');

    // Update the innerHTML with a new SVG icon and text "Find size"
    newButton.innerHTML = `
      <svg width="15px" height="15px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" class="c-icon icon--box">
        <path d="M16 7V2.6C16 2.26863 15.7314 2 15.4 2H8.6C8.26863 2 8 2.26863 8 2.6V21.4C8 21.7314 8.26863 22 15.4 22H15.4C15.7314 22 16 21.7314 16 21.4V17M16 7H13M16 7V12M16 12H13M16 12V17M16 17H13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      Find size
    `;

    // Add click handler to the new button
    newButton.addEventListener('click', handleSizeFinderButtonClick);
    
    return newButton;
  }

  /**
   * Handle the click event on the "Find Size" button
   */
  function handleSizeFinderButtonClick(this: HTMLButtonElement): void {
    const container = this.closest('.fibbl__controls-switch');
    
    if (!container) return;

    // Update active state
    updateButtonActiveState(container as HTMLDivElement, this);

    // Remove existing Fibbl layer content
    const layerContent = document.querySelector('x-fibbl-layer-content');
    if (layerContent) {
      layerContent.remove();
    }

    // Find and modify the Fibbl model
    const fibblModel = document.querySelector('#fibbl-model');
    
    if (fibblModel) {
      // Store original children for later restoration
      originalModelChildren = Array.from(fibblModel.children).map(
        child => child.cloneNode(true) as FibblElement
      );

      // Clear the model
      fibblModel.innerHTML = '';
      
      // Add our size guide element
      fibblModel.appendChild(createSizeGuideElement());
    }

    // Hide other UI elements
    toggleElementsVisibility(false);
  }

  /**
   * Add click handlers to original Fibbl buttons to restore the view
   */
  function addRestoreHandlersToOriginalButtons(container: HTMLDivElement): void {
    const originalButtons = container.querySelectorAll(
      'button.fibbl__controls-switch--option:not([data-element="find-size"])'
    );
    
    originalButtons.forEach(button => {
      button.addEventListener('click', handleOriginalButtonClick);
    });
  }

  /**
   * Handle click events on the original Fibbl buttons
   */
  function handleOriginalButtonClick(): void {
    // Find and restore the Fibbl model
    const fibblModel = document.querySelector('#fibbl-model');
    const sizeGuide = document.querySelector('.myshoefitter-container');

    if (fibblModel && sizeGuide) {
      // Remove our size guide
      sizeGuide.remove();

      // Restore original children
      fibblModel.innerHTML = '';
      originalModelChildren.forEach(child => {
        fibblModel.appendChild(child);
      });

      console.log('mySHOEFITTER: Restored original fibbl-model content');
    }

    // Show other UI elements again
    toggleElementsVisibility(true);
  }

  /**
   * Update which button is active in a container
   */
  function updateButtonActiveState(container: HTMLDivElement, activeButton: HTMLButtonElement): void {
    // Remove active class from all buttons
    container.querySelectorAll('button.fibbl__controls-switch--option').forEach(btn => {
      btn.classList.remove('fibbl-active');
    });

    // Add active class to the clicked button
    activeButton.classList.add('fibbl-active');
  }

  /**
   * Create the size guide element with QR code
   */
  function createSizeGuideElement(): HTMLDivElement {
    const element = document.createElement('div');
    element.className = 'myshoefitter-container';
    element.setAttribute('slot', Date.now().toString()); // Unique slot ID
    element.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(31.48deg, #cfcbc8 19.62%, #dfe0e4 100%);
      z-index: 1;
    `;

    // Get the camera link URL from mySHOEFITTER
    const mysfAppUrl = window.myshoefitter.getCameraLink();
    const encodedUrl = encodeURIComponent(mysfAppUrl);

    // Construct the HTML content
    element.innerHTML = createSizeGuideHTML(encodedUrl);

    // Add hover event listeners for the overlay
    addOverlayInteraction(element);

    return element;
  }

  /**
   * Generate the HTML content for the size guide
   */
  function createSizeGuideHTML(encodedUrl: string): string {
    return `
      <div id="overlay" style="
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        width: 100%; 
        height: 100%; 
        background: rgba(0,0,0,.6); 
        padding: 20px; 
        box-sizing: border-box; 
        font-family: system-ui, -apple-system;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.5s ease, visibility 0.5s ease;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
      ">
        <h3 style="color: #ffffff; font-weight: 600; font-size: 1.9em; margin-bottom: clamp(10px, calc(725px / 40), 20px);">Scan the QR Code</h3>
        <div style="color: #ffffff; font-size: 1.4em; text-align: center; margin-bottom: clamp(10px, calc(725px / 40), 20px); max-width: 25em;">Point your mobile device camera at the QR code below to try it on</div>
        <div style="width: 300px; height: 300px; background: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); ">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}" alt="QR Code" width="100%" height="100%" style="padding: 10px;" />
        </div>
      </div>

      <button id="myshoefitter-button" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 1em 3em; background: #000; font-size: 1.2em; font-weight: 600; color: #fff; border: none; transition: var(--transition-time) opacity;">Find Size</button>
    `;
  }

  /**
   * Add hover/touch interactions to show/hide the overlay
   */
  function addOverlayInteraction(element: HTMLElement): void {
    // Add event listeners for hover/touch to show overlay
    ['mouseenter', 'touchstart'].forEach(event => 
      element.addEventListener(event, () => toggleOverlay(element, true))
    );

    // Add event listeners for hover/touch to hide overlay
    ['mouseleave', 'touchend'].forEach(event => 
      element.addEventListener(event, () => toggleOverlay(element, false))
    );
  }

  /**
   * Toggle the overlay visibility
   */
  function toggleOverlay(element: HTMLElement, visible: boolean): void {
    const overlay = element.querySelector('#overlay') as HTMLElement;
    if (overlay) {
      overlay.style.opacity = visible ? '1' : '0';
      overlay.style.visibility = visible ? 'visible' : 'hidden';
    }
  }

  /**
   * Toggle visibility of other UI elements
   */
  function toggleElementsVisibility(show: boolean): void {
    const elementSelectors = ['.product-detail__gallery-thumbnails'];
    
    elementSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
      
      elements.forEach(element => {
        if (show) {
          element.style.removeProperty('display');
        } else {
          element.style.setProperty('display', 'none');
        }
      });
    });
  }
}
