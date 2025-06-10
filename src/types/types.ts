export interface myShoeFitter {
  getLink(options?: LinkOptions): string; // Returns SVG string
  init(config: ScriptConfig): void;
  showBanner(): void;
  closeBanner(): void;
  events(callback: (event: CustomEvent) => void): void;
}

export interface ScriptConfig {
  shopId?: string; // @deprecated
  productId?: string | number; // Override the automatically found product id
  enabledProductIds?: (string | number)[]; // Product Ids where button should show
  disabledProductIds?: (string | number)[]; // Product Ids where button should be hidden
  enabledProductNames?: (string | RegExp)[];
  disabledProductNames?: (string | RegExp)[];
  logsEnabled?: boolean;
  shopSystem?: string;
  bannerOrigin?: string; // Override the default banner url
  integrations?: IntegrationItem[];
  button?: {
    attachTo: string;
    position?: ButtonPosition;
    text?: string;
    styles?: Partial<CSSStyleDeclaration>;
    attributes?: Record<string, string>;
    logo?: LogoConfig | false; // Logo configuration or false to disable
  }
}

export interface LogoConfig {
  url?: string; // Logo image URL
  position?: 'left' | 'right'; // Position relative to text
  width?: string | number; // Logo width (px or css unit)
  height?: string | number; // Logo height (px or css unit)
  space?: string | number; // Spacing between logo and text (px, em, %, etc.)
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

export interface LinkOptions {
  clientType?: 'mobile' | 'desktop';
}

/**
 * Interface for integration options
 * Configuration options for each integration 
 */
export interface IntegrationOptions {
  active: boolean;
  [key: string]: any; // Allow for additional configuration options
}

/**
 * Interface for a single integration item in the array
 * Each item is an object with a single key (integration name) 
 * and its corresponding options
 */
export interface IntegrationItem {
  [integrationName: string]: IntegrationOptions;
}

/**
 * Interface that all integrations must implement
 * Defines the required methods for integration lifecycle
 */
export interface Integration {
  /**
   * Initialize the integration with the provided options
   * @param options Configuration options for the integration
   */
  init(options: IntegrationOptions): void;
  
  /**
   * Optional method to clean up resources when integration is no longer needed
   */
  destroy?(): void;
}