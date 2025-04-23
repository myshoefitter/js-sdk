import { BannerParams, LinkOptions } from "../types/types";
import { getBannerParams, getConfig } from "./config";

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

/**
 * Detects client type (mobile, tablet, or desktop)
 * @returns The client type as a string
 */
export function detectClient(): string {
  const userAgent = window.parent.navigator.userAgent;
  const isMobile = /Mobi/i.test(userAgent) && !/Tablet|iPad/i.test(userAgent);
  const isTablet = /Tablet|iPad/i.test(userAgent) || (window.innerWidth <= 1024 && /Mobi/i.test(userAgent));
  const isDesktop = !isMobile && !isTablet;

  if (isMobile) return 'mobile';
  else if (isTablet) return 'tablet';
  else if (isDesktop) return 'desktop';
  else return 'desktop';
}

/**
 * Gets the current hostname from the page URL
 * @returns The hostname or undefined if an error occurs
 */
export function getHostname(): string | undefined {
  try {
    const url = new URL(window.location.href);
    return url?.hostname;
  } catch (error) {
    return undefined;
  }
}

/**
 * Generates the link to the mySHOEFITTER application
 * @param params The parameters to include in the URL
 * @param bannerOrigin The origin of the banner (default: 'v2.myshoefitter.com')
 * @returns The complete URL to the mySHOEFITTER application
 */
export function generateAppLink(options?: LinkOptions): string {
  const state = getConfig();
  const params = getBannerParams();
  const bannerOrigin = state.config.bannerOrigin;
  
  if (!params.product) {
    console.warn('mySHOEFITTER: No productId found! Using "test" productId.');
    params.product = 'test';
  }

  const protocol = bannerOrigin.includes('localhost') ? 'http' : 'https';
  let bannerHost = protocol + '://' + bannerOrigin;

  const clientType = options?.clientType || detectClient();
  // Open banner on desktop if client is desktop.
  // Open pwa on mobile and tablet
  if (clientType === 'desktop') {
    bannerHost = bannerHost + '/desktop';
  } else if (params.product) {
    // If product is set, open camera. Otherwise open home page.
    bannerHost = bannerHost + '/camera';
  }

  const url = bannerHost + '?' + new URLSearchParams(params as Record<string, string>).toString();
  console.log('mySHOEFITTER: Banner URL', url);

  return url;
}