declare global {
  interface Window {
    myshoefitter: {
      getCameraLink: () => string;
    };
  }
}

export type FibblElement = Element & { cloneNode(deep?: boolean): FibblElement };

export interface myShoeFitter {
  getQrCode(): string; // Returns SVG string
  getCameraLink(): string; // Returns the camera link URL
  init(config: ScriptConfig): void;
}

export interface ScriptConfig {
  shopId?: string; // @deprecated
  productId?: string | number; // Override the automatically found product id
  enabledProductIds?: (string | number)[]; // Product Ids where button should show
  disabledProductIds?: (string | number)[]; // Product Ids where button should be hidden
  logsEnabled?: boolean;
  shopSystem?: string;
  bannerOrigin?: boolean; // Override the default banner url
  integrations?: string[];
  button?: {
    attachTo: string;
    position?: ButtonPosition;
    text?: string;
    styles?: Partial<CSSStyleDeclaration>;
    attributes?: Record<string, string>;
  }
}

export interface BannerParams {
  shop?: string;
  product?: string | number;
  utm_source?: string;
}

export interface CustomEvent {
  type: EventTypes;
  data: any;
}

export enum EventTypes {
  Init = 'INIT',
  Result = 'RESULT',
  PageView = 'PAGE_VIEW',
  Banner = 'BANNER',
  Button = 'BUTTON',
}

export type ButtonPosition = 'before' | 'after';

export interface ShopSystemConfig {
  sku: string | number | null;
  selector: string;
}
