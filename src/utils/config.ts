/**
 * Central store for mySHOEFITTER application state
 * Allows sharing configuration and state between different parts of the application
 */

import { ScriptConfig } from "../types/types";

// Types
export interface Config {
  // Configuration
  config: ScriptConfig;
  // Runtime state
  initialized: boolean;
}

// Default state
const defaultConfig: Config = {
  config: {
    bannerOrigin: 'v2.myshoefitter.com',
  },
  initialized: false
};

// The actual store state
let state: Config = { ...defaultConfig };

/**
 * Get the current state or a part of it
 * @param path Optional path to a specific part of the state
 * @returns The requested state
 */
export function getConfig<T = Config>(path?: string): T {
  if (!path) {
    return state as unknown as T;
  }
  
  const parts = path.split('.');
  let result: any = state;
  
  for (const part of parts) {
    if (result && typeof result === 'object' && part in result) {
      result = result[part];
    } else {
      return undefined as unknown as T;
    }
  }
  
  return result as T;
}

/**
 * Update the state with new values
 * @param newConfig Partial state to merge with current state
 */
export function updateConfig(newConfig: Partial<Config>): void {
  state = {
    ...state,
    ...newConfig,
    config: {
      ...state.config,
      ...(newConfig.config || {})
    }
  };
}

/**
 * Reset the state to default values
 */
export function resetConfig(): void {
  state = { ...defaultConfig };
}

/**
 * Get the banner parameters based on current state
 * @returns Banner parameters object
 */
export function getBannerParams(): Record<string, string | number | undefined> {
  const { shopId, productId } = state.config;
  
  const params: Record<string, string | number | undefined> = {
    shop: shopId,
    product: productId,
    utm_source: window?.location?.hostname
  };

  console.log('mySHOEFITTER: getBannerParams()', params);
  
  return params;
}