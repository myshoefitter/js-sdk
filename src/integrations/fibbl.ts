export function fibbl() {
  console.log('mySHOEFITTER: Fibbl integration executed!');

  // Store a reference to the original children of #fibbl-model
  let originalModelChildren: Element[] = [];

  // Select all containers that hold the buttons
  const containers = document.querySelectorAll('.fibbl__controls-switch') as NodeListOf<HTMLDivElement>;
  if (containers.length === 0) {
    console.error('No button containers found.');
    return;
  }

  // Create our size guide content element that will be injected
  const createSizeGuideElement = (isMobile: boolean) => {
    const element = document.createElement('div');
    element.className = 'myshoefitter-container';
    element.setAttribute('slot', Date.now().toString()); // Unique slot ID
    element.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: linear-gradient(31.48deg, #cfcbc8 19.62%, #dfe0e4 100%);
      ${isMobile ? 'z-index: 2;' : 'z-index: 1;'}
    `;

    const mysfAppUrl = 'https://v2.myshoefitter.com/?utm_source=fibbl&utm_medium=web&utm_campaign=qr_code';
    element.innerHTML = `
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
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${mysfAppUrl}" alt="QR Code" width="100%" height="100%" style="padding: 10px;" />
    </div>
    </div>

      <button id="myshoefitter-button" style="position: absolute; top: 50%;  left: 50%; transform: translate(-50%, -50%); padding: 1em 3em; background: #000; font-size: 1.2em; font-weight: 600; color: #fff; border: none; transition: var(--transition-time) opacity;">Find Size</button>

    `;

    // Add event listeners for hover effects
    element.addEventListener('mouseenter', () => {
      const overlay = element.querySelector('#overlay') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
      }
    });

    element.addEventListener('mouseleave', () => {
      const overlay = element.querySelector('#overlay') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
      }
    });

    return element;
  };

  // Loop through each container
  containers.forEach((container: HTMLDivElement) => {
    // Find the first existing button to clone
    const existingButton = container.querySelector('button.fibbl__controls-switch--option');
    if (!existingButton) {
      console.error('No existing button found to clone in this container.');
      return;
    }

    // Only add the new button if it doesn't already exist
    if (!container.querySelector('[data-element="find-size"]')) {
      container.style.setProperty('grid-template-columns', 'repeat(4, auto)');

      // Clone the existing button deeply
      const newButton = existingButton.cloneNode(true) as HTMLButtonElement;

      // Modify the new button's dataset attributes
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
      newButton.addEventListener('click', function () {
        // Remove active class from all buttons
        container.querySelectorAll('button.fibbl__controls-switch--option').forEach(btn => {
          btn.classList.remove('fibbl-active');
        });

        // Add active class to this button
        this.classList.add('fibbl-active');

        // Find x-fibbl-layer-content and remove it
        const layerContent = document.querySelector('x-fibbl-layer-content');
        if (layerContent) {
          layerContent.remove();
        }

        // Find #fibbl-model
        const fibblModel = document.querySelector('#fibbl-model');
        const fibblMobileContainer = document.querySelector('#fibbl-container-mobile');

        console.log('Fibbl mobile container:', fibblMobileContainer);

        console.log('Fibbl model:', fibblModel);

        if (fibblModel) {
          // Store original children for later restoration
          originalModelChildren = Array.from(fibblModel.children).map(child => child.cloneNode(true) as Element);

          // Remove all children
          while (fibblModel.firstChild) {
            fibblModel.removeChild(fibblModel.firstChild);
          }

          // Create and append our size guide
          const sizeGuide = createSizeGuideElement(false);
          fibblModel.appendChild(sizeGuide);
        }

        if(fibblMobileContainer) {
          const firstChild = fibblMobileContainer.firstElementChild;
          if (firstChild) {
            originalModelChildren = Array.from(firstChild.children).map(child => child.cloneNode(true) as Element);

            // remove x-fibbl-layer-content
            const layerContent = firstChild.querySelector('x-fibbl-layer-content');
            if (layerContent) {
              layerContent.remove();
            }
            
            // Create and append our size guide
            const sizeGuide = createSizeGuideElement(true);

            firstChild.insertBefore(sizeGuide, firstChild.firstChild);
          }
        }

        toggleElements(false);
      });

      // Append the new button at the end of the current container
      container.appendChild(newButton);

      // Listen for clicks on other buttons to restore the original layout
      const otherButtons = container.querySelectorAll('button.fibbl__controls-switch--option:not([data-element="find-size"])');
      otherButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Find #fibbl-model and our size guide
          const fibblModel = document.querySelector('#fibbl-model');
          const sizeGuide = document.querySelector('.myshoefitter-container');

          if (fibblModel && sizeGuide) {
            // Remove our size guide
            sizeGuide.remove();

            // Restore original children
            fibblModel.innerHTML = ''; // Clear first
            originalModelChildren.forEach(child => {
              fibblModel.appendChild(child);
            });

            console.log('Restored original fibbl-model children');
          }

          toggleElements(true);
        });
      });
    }
  });
}

function toggleElements(show: boolean) {
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