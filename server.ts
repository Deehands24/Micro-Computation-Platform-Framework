// Type declarations for Bun
declare global {
  interface BunSocket extends WebSocket {
    onopen: (event: Event) => void;
    onmessage: (event: MessageEvent) => void;
    onclose: (event: CloseEvent) => void;
    onerror: (event: Event) => void;
  }

  interface BunWebSocketUpgrade {
    socket: BunSocket;
    response: Response;
  }

  var Bun: {
    upgradeWebSocket(request: Request): BunWebSocketUpgrade;
  };
}

import { serve } from "bun";

// Define a TypeScript interface for your MCP commands.
interface MCPCommand {
  action: string;
  data?: any;
}

// Simple type definitions to manage our Coda-like Pack structure
export type Formula = {
  name: string;
  description: string;
  parameters: Array<{ 
    name: string;
    description: string;
    type: string;
    required?: boolean;
  }>;
  execute: (params: any[], context: any) => Promise<any>;
};

export type SyncTable = {
  name: string;
  description: string;
  identityName: string;
  schema: any;
  formula: {
    execute: (params: any[], context: any) => Promise<any>;
  };
};

// Create a Coda Pack context for our MCP server
interface CodaPackContext {
  formulas: Map<string, Formula>;
  syncTables: Map<string, SyncTable>;
}

// Initialize our Coda Pack context
const codaContext: CodaPackContext = {
  formulas: new Map(),
  syncTables: new Map(),
};

// Helper to register a formula with our context
function registerFormula(formula: Formula) {
  codaContext.formulas.set(formula.name, formula);
  return formula;
}

// Helper to register a sync table with our context
function registerSyncTable(syncTable: SyncTable) {
  codaContext.syncTables.set(syncTable.name, syncTable);
  return syncTable;
}

// Example formula registration
registerFormula({
  name: "Hello",
  description: "Returns a greeting message.",
  parameters: [
    { 
      name: "name", 
      type: "string",
      description: "The name to greet.",
      required: true
    },
  ],
  execute: async function (params, context) {
    const name = params[0] || "World";
    return `Hello, ${name}!`;
  },
});

// Example sync table registration
registerFormula({
  name: "CurrentTime",
  description: "Returns the current time.",
  parameters: [
    { 
      name: "timezone", 
      type: "string",
      description: "The timezone to use (e.g., 'UTC', 'America/New_York').",
      required: false
    },
  ],
  execute: async function (params, context) {
    const timezone = params[0] || "UTC";
    return new Date().toLocaleString("en-US", { timeZone: timezone });
  },
});

// Import and register advanced examples
try {
  const examples = require("./examples");
  
  // Register advanced formulas
  if (examples.weatherFormula) {
    registerFormula(examples.weatherFormula);
    console.log("Registered weather formula");
  }
  
  if (examples.currencyFormula) {
    registerFormula(examples.currencyFormula);
    console.log("Registered currency formula");
  }
  
  // Register sync tables
  if (examples.usersTable) {
    registerSyncTable(examples.usersTable);
    console.log("Registered users table");
  }
  
  if (examples.productsTable) {
    registerSyncTable(examples.productsTable);
    console.log("Registered products table");
  }
} catch (error) {
  console.log("Examples not loaded:", error.message);
}

// A function to process MCP commands
async function processMCPCommand(command: MCPCommand): Promise<object> {
  switch (command.action) {
    case "listFormulas":
      // Return a list of all available formulas
      return { 
        formulas: Array.from(codaContext.formulas.entries()).map(([name, formula]) => ({
          name,
          description: formula.description,
          parameters: formula.parameters
        }))
      };
    
    case "listSyncTables":
      // Return a list of all available sync tables
      return { 
        syncTables: Array.from(codaContext.syncTables.entries()).map(([name, table]) => ({
          name,
          description: table.description,
          identityName: table.identityName
        }))
      };
    
    case "executeFormula":
      // Execute a formula with the given parameters
      if (!command.data?.formula) {
        throw new Error("Formula name not provided");
      }
      
      const formula = codaContext.formulas.get(command.data.formula);
      if (!formula) {
        throw new Error(`Formula "${command.data.formula}" not found`);
      }
      
      // Create a simple execution context
      const context = {
        timezone: command.data?.timezone || "UTC",
        continuation: null,
        fetch: async (url: string, options?: RequestInit) => {
          return await fetch(url, options);
        }
      };
      
      // Execute the formula with the provided parameters
      const result = await formula.execute(
        command.data?.parameters || [], 
        context
      );
      
      return { result };
    
    case "syncTable":
      // Handle sync table operations
      if (!command.data?.syncTable) {
        throw new Error("Sync table name not provided");
      }
      
      const syncTable = codaContext.syncTables.get(command.data.syncTable);
      if (!syncTable) {
        throw new Error(`Sync table "${command.data.syncTable}" not found`);
      }
      
      // Create a simple execution context for sync tables
      const syncContext = {
        timezone: command.data?.timezone || "UTC",
        continuation: command.data?.continuation || null,
        fetch: async (url: string, options?: RequestInit) => {
          return await fetch(url, options);
        }
      };
      
      // Execute the sync for the table
      const syncResult = await syncTable.formula.execute(
        command.data?.parameters || [],
        syncContext
      );
      
      return { 
        result: syncResult,
        continuation: syncContext.continuation
      };
      
    default:
      throw new Error(`Unsupported MCP command: ${command.action}`);
  }
}

// The main request handler for your Bun server.
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  try {
    // Handle HTTP POST requests to the /mcp endpoint.
    if (url.pathname === "/mcp" && request.method === "POST") {
      // Ensure the client sends JSON data.
      if (request.headers.get("Content-Type") !== "application/json") {
        return new Response(
          JSON.stringify({ error: "Expected JSON content type" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Parse the incoming MCP command.
      const payload: MCPCommand = await request.json();
      console.log("Received MCP command:", payload);

      // Process the command using our dedicated handler.
      const result = await processMCPCommand(payload);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle WebSocket connections on the /ws endpoint.
    else if (
      url.pathname === "/ws" &&
      request.headers.get("upgrade")?.toLowerCase() === "websocket"
    ) {
      // Upgrade the HTTP connection to a WebSocket.
      const { socket, response } = Bun.upgradeWebSocket(request);

      // Set up WebSocket event handlers.
      socket.onopen = () => {
        console.log("WebSocket connection established");
        socket.send("Welcome to the advanced MCP WebSocket endpoint");
      };

      socket.onmessage = async (event) => {
        console.log("WebSocket received:", event.data);

        try {
          // Parse incoming WebSocket message (assumed to be JSON).
          const command: MCPCommand = JSON.parse(event.data);
          const result = await processMCPCommand(command);
          socket.send(JSON.stringify(result));
        } catch (err: any) {
          socket.send(JSON.stringify({ error: err.message }));
        }
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };

      return response;
    }

    // Return 404 for any unmapped routes.
    else {
      return new Response(
        JSON.stringify({ error: "Endpoint not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    // Log and return a formatted error response.
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Read the port from an environment variable or default to 3000.
const port = Number(process.env.PORT) || 3000;

console.log(`MCP Framework server is running on port ${port}`);

// Start the Bun server with our request handler.
serve({ fetch: handleRequest, port });
