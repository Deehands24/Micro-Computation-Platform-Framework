# MCP Framework

A flexible Micro Computation Platform (MCP) Framework for building custom formula and sync table engines that can integrate with various web services.

## Overview

This project implements a lightweight, extensible framework that enables:

1. Registering and executing custom formulas
2. Managing sync tables for data synchronization
3. Exposing functionality via HTTP and WebSocket APIs

## Features

- HTTP API for formula execution and sync table operations
- WebSocket API for real-time formula execution
- Easy formula registration system
- Type-safe implementation with TypeScript
- Extensible architecture for integration with various services

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Installation

1. Clone this repository
2. Install dependencies:

```bash
bun install
```

### Running the Server

Start the server with:

```bash
bun run server.ts
```

By default, the server runs on port 3000. You can customize this using the PORT environment variable.

### Testing the Server

A test client is included to verify the server functionality:

```bash
bun run client.ts
```

## API

### HTTP API

The HTTP API is accessible at `/mcp` and accepts POST requests with JSON payloads.

**Example Commands:**

1. List formulas:
```json
{
  "action": "listFormulas"
}
```

2. Execute a formula:
```json
{
  "action": "executeFormula",
  "data": {
    "formula": "Hello",
    "parameters": ["World"]
  }
}
```

3. List sync tables:
```json
{
  "action": "listSyncTables"
}
```

4. Execute a sync table:
```json
{
  "action": "syncTable",
  "data": {
    "syncTable": "Users",
    "parameters": [],
    "continuation": null
  }
}
```

### WebSocket API

For real-time interaction, connect to the WebSocket endpoint at `/ws`. The same command format as the HTTP API is used.

## Adding Formulas

Add a new formula by using the `registerFormula` function:

```typescript
registerFormula({
  name: "MyFormula",
  description: "Description of what the formula does",
  parameters: [
    { 
      name: "param1", 
      type: "string",
      description: "What this parameter does",
      required: true
    },
  ],
  execute: async function (params, context) {
    // Your formula logic here
    return result;
  },
});
```

## Integration Possibilities

This framework can be adapted to integrate with:
- Coda, Notion, Airtable, and other productivity tools
- CRM systems like Salesforce
- E-commerce platforms
- Custom business applications
- Any API-based service

## Future Development

- Support for various authentication methods
- Enhanced schema validation
- Better error handling
- Performance optimizations
- Pre-built integrations with popular APIs

## License

MIT 