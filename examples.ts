import { Formula, SyncTable } from "./server";

// This file contains examples of more advanced formulas and sync tables
// that can be registered with your Coda MCP server.

// Example of a formula that fetches weather data
export const weatherFormula: Formula = {
  name: "GetWeather",
  description: "Gets the current weather for a location",
  parameters: [
    {
      name: "location",
      type: "string",
      description: "The location to get weather for (e.g., 'New York', 'London')",
      required: true
    },
    {
      name: "units",
      type: "string",
      description: "The units to use (metric or imperial)",
      required: false
    }
  ],
  execute: async function ([location, units = "metric"], context) {
    // Note: In a real implementation, you would use an API key
    const apiKey = "YOUR_WEATHER_API_KEY";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${apiKey}`;
    
    try {
      // Use the context's fetch function to make the request
      const response = await context.fetch(url);
      
      // Mock response for demonstration purposes
      return {
        location: location,
        temperature: 22,
        conditions: "Sunny",
        humidity: 65,
        windSpeed: 10,
        units: units === "metric" ? "°C" : "°F"
      };
    } catch (error) {
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }
};

// Example of a formula that formats currency
export const currencyFormula: Formula = {
  name: "FormatCurrency",
  description: "Formats a number as currency",
  parameters: [
    {
      name: "amount",
      type: "number",
      description: "The amount to format",
      required: true
    },
    {
      name: "currencyCode",
      type: "string",
      description: "The ISO currency code (e.g., 'USD', 'EUR')",
      required: false
    },
    {
      name: "locale",
      type: "string",
      description: "The locale to use for formatting (e.g., 'en-US', 'fr-FR')",
      required: false
    }
  ],
  execute: async function ([amount, currencyCode = "USD", locale = "en-US"], context) {
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode
      });
      
      return formatter.format(amount);
    } catch (error) {
      throw new Error(`Failed to format currency: ${error.message}`);
    }
  }
};

// Example of a sync table that returns a list of users
export const usersTable: SyncTable = {
  name: "Users",
  description: "Fetches a list of users",
  identityName: "id",
  schema: {
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      email: { type: "string" },
      role: { type: "string" },
      createdAt: { type: "string", format: "date-time" }
    },
    required: ["id", "name", "email"]
  },
  formula: {
    execute: async function (params, context) {
      // In a real implementation, you would fetch this data from an API or database
      // This is mock data for demonstration purposes
      
      // Check if we have a continuation token (for pagination)
      const page = context.continuation ? parseInt(context.continuation) : 1;
      const pageSize = 10;
      
      // Generate mock users for the current page
      const users = Array(pageSize).fill(0).map((_, i) => {
        const userId = ((page - 1) * pageSize) + i + 1;
        return {
          id: `user-${userId}`,
          name: `User ${userId}`,
          email: `user${userId}@example.com`,
          role: i % 3 === 0 ? "admin" : "user",
          createdAt: new Date(Date.now() - (userId * 86400000)).toISOString()
        };
      });
      
      // If there are more pages, return a continuation token
      const hasMorePages = page < 5; // Limit to 5 pages for this example
      const continuation = hasMorePages ? (page + 1).toString() : null;
      
      // Set the continuation token on the context
      if (context.continuation !== undefined) {
        context.continuation = continuation;
      }
      
      return users;
    }
  }
};

// Example of a sync table that returns a list of products
export const productsTable: SyncTable = {
  name: "Products",
  description: "Fetches a list of products",
  identityName: "id",
  schema: {
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      price: { type: "number" },
      category: { type: "string" },
      inStock: { type: "boolean" }
    },
    required: ["id", "name", "price"]
  },
  formula: {
    execute: async function (params, context) {
      // In a real implementation, you would fetch this data from an API or database
      // This is mock data for demonstration purposes
      
      // Check if we have a continuation token (for pagination)
      const page = context.continuation ? parseInt(context.continuation) : 1;
      const pageSize = 10;
      
      // Generate mock products for the current page
      const products = Array(pageSize).fill(0).map((_, i) => {
        const productId = ((page - 1) * pageSize) + i + 1;
        const categories = ["Electronics", "Clothing", "Home", "Books", "Toys"];
        return {
          id: `product-${productId}`,
          name: `Product ${productId}`,
          price: Math.round((20 + Math.random() * 100) * 100) / 100,
          category: categories[productId % categories.length],
          inStock: Math.random() > 0.2
        };
      });
      
      // If there are more pages, return a continuation token
      const hasMorePages = page < 3; // Limit to 3 pages for this example
      const continuation = hasMorePages ? (page + 1).toString() : null;
      
      // Set the continuation token on the context
      if (context.continuation !== undefined) {
        context.continuation = continuation;
      }
      
      return products;
    }
  }
}; 