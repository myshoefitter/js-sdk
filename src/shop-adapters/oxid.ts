export function findProductId(): string | null {
  // Possible variables where the article number may be stored
  const possibleVars = ['ecommercedetail', 'gtmviewitem', '_paq'];

  // Try to get the article number from known variables
  for (const varName of possibleVars) {
      const variable = (window as any)[varName];
      if (variable) {
          const articleNumber = searchObjectForArticleNumber(variable);
          if (articleNumber) {
              return articleNumber;
          }
      }
  }

  // Try to get article number from dataLayer
  if ((window as any).dataLayer && Array.isArray((window as any).dataLayer)) {
      for (const data of (window as any).dataLayer) {
          const articleNumber = searchObjectForArticleNumber(data);
          if (articleNumber) {
              return articleNumber;
          }
      }
  }

  // Search through script tags
  const scripts = document.getElementsByTagName('script');
  for (const script of Array.from(scripts)) {
      const content = script.textContent;
      if (content) {
          const articleNumber = extractArticleNumberFromString(content);
          if (articleNumber) {
              return articleNumber;
          }
      }
  }

  // As a last resort, search the entire HTML
  const htmlContent = document.documentElement.outerHTML;
  const articleNumber = extractArticleNumberFromString(htmlContent);
  if (articleNumber) {
      return articleNumber;
  }

  // If not found, return null
  return null;
}

// Helper function to search for article number in an object
function searchObjectForArticleNumber(obj: any): string | null {
  if (typeof obj !== 'object' || obj === null) return null;

  for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const value = obj[key];
      if (typeof value === 'string') {
          const articleNumber = matchArticleNumber(value);
          if (articleNumber) {
              return articleNumber;
          }
      } else if (typeof value === 'object') {
          const articleNumber = searchObjectForArticleNumber(value);
          if (articleNumber) {
              return articleNumber;
          }
      }
  }
  return null;
}

// Helper function to extract article number from string content
function extractArticleNumberFromString(content: string): string | null {
  const regex = /GND-\d{6}-\d{2}-[A-Z]/g;
  const matches = content.match(regex);
  if (matches && matches.length > 0) {
      return matches[0];
  }
  return null;
}

// Helper function to match article number pattern in a string
function matchArticleNumber(value: string): string | null {
  const regex = /GND-\d{6}-\d{2}-[A-Z]/;
  const match = value.match(regex);
  if (match) {
      return match[0];
  }
  return null;
}


