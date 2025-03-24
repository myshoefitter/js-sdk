export function waitForElm(selector: string) {
  return new Promise(resolve => {
    if (document.querySelector(selector)?.clientWidth) {
        return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(_ => {
        if (document.querySelector(selector)?.clientWidth) {
            observer.disconnect();
            resolve(document.querySelector(selector));
        }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
  });
}