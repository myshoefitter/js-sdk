  // Function to retrieve the item ID from either window.DY.recommendationContext.data or window.dataLayer
  export function findProductId() {
    let id = null;

    // First attempt: Try to get the ID from window.DY.recommendationContext.data
    try {
      if (window?.DY && window?.DY?.recommendationContext && Array.isArray(window?.DY?.recommendationContext?.data) && window?.DY?.recommendationContext?.data?.length > 0) {
        id = window?.DY?.recommendationContext?.data?.shift();
      }
    } catch (e) {
      console.log("mySHOEFITTER: Error accessing the ID from DY.recommendationContext:", e);
    }

    // If the ID was not found in the first attempt, try the second source: window.dataLayer
    if (id === null) {
      try {
        if (Array.isArray(window?.dataLayer) && window?.dataLayer?.length > 0) {
          const lastEcommerceObject = window?.dataLayer?.slice()?.reverse()?.find(obj => obj?.ecommerce && Array.isArray(obj?.ecommerce?.items) && obj.ecommerce?.items?.length > 0);
          id = lastEcommerceObject ? lastEcommerceObject?.ecommerce?.items?.shift()?.item_id : null;
        }
      } catch (e) {
        console.log("mySHOEFITTER: Error accessing the item_id from dataLayer:", e);
      }
    }

    if (id === null) {
      console.warn("mySHOEFITTER: Product ID could not be found. Please set it manually using productId parameter.");
    }

    return id; // Return the found ID or null if not found
  }

  // Add typescript definitions to extend the window object by DY
  declare global {
    interface Window {
      DY: {
        recommendationContext: {
          data: any[]
        }
      };
      dataLayer: any;
    }
  }
  