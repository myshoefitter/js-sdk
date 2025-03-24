// import { waitForElm } from '../utils/helpers';

export function fibbl() {
  // Select all containers that hold the buttons (there may be multiple)
  const containers = document.querySelectorAll('.fibbl__controls-switch');
  if (containers.length === 0) {
    console.error('No button containers found.');
    return;
  }

  // Loop through each container
  containers.forEach((container) => {
    // Find the first existing button to clone
    const existingButton = container.querySelector('button.fibbl__controls-switch--option');
    if (!existingButton) {
      console.error('No existing button found to clone in this container.');
      return;
    }

    // Clone the existing button deeply (including its child elements)
    const newButton = existingButton.cloneNode(true) as HTMLButtonElement;

    // Set a unique id if needed
    newButton.id = 'myshoefitter-button';

    // Modify the new button's dataset, text, or any other attributes as needed
    newButton.dataset.element = 'find-size';

    // Update the innerHTML with a new SVG icon and text "Find size"
    newButton.innerHTML = `
      <svg width="15px" height="15px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" class="c-icon icon--box">
        <path d="M16 7V2.6C16 2.26863 15.7314 2 15.4 2H8.6C8.26863 2 8 2.26863 8 2.6V21.4C8 21.7314 8.26863 22 8.6 22H15.4C15.7314 22 16 21.7314 16 21.4V17M16 7H13M16 7V12M16 12H13M16 12V17M16 17H13" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      Find size
    `;

    // Append the new button at the end of the current container
    container.appendChild(newButton);
  });
}
