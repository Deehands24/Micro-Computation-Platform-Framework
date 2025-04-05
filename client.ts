import { fetch } from "bun";

async function testMCP() {
  console.log("Testing Coda MCP Server...");
  
  // Test listing formulas
  console.log("\n1. Testing listFormulas...");
  const formulasResponse = await fetch("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "listFormulas"
    })
  });
  
  const formulasResult = await formulasResponse.json();
  console.log(JSON.stringify(formulasResult, null, 2));
  
  // Test executing the Hello formula
  console.log("\n2. Testing executeFormula with 'Hello'...");
  const helloResponse = await fetch("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "executeFormula",
      data: {
        formula: "Hello",
        parameters: ["Coda MCP"]
      }
    })
  });
  
  const helloResult = await helloResponse.json();
  console.log(JSON.stringify(helloResult, null, 2));
  
  // Test executing the CurrentTime formula
  console.log("\n3. Testing executeFormula with 'CurrentTime'...");
  const timeResponse = await fetch("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "executeFormula",
      data: {
        formula: "CurrentTime",
        parameters: ["America/New_York"]
      }
    })
  });
  
  const timeResult = await timeResponse.json();
  console.log(JSON.stringify(timeResult, null, 2));
  
  // Test WebSocket connection
  console.log("\n4. Testing WebSocket connection...");
  const ws = new WebSocket("ws://localhost:3000/ws");
  
  ws.onopen = () => {
    console.log("WebSocket connection opened");
    
    // Send a command via WebSocket
    ws.send(JSON.stringify({
      action: "executeFormula",
      data: {
        formula: "Hello",
        parameters: ["WebSocket User"]
      }
    }));
  };
  
  ws.onmessage = (event) => {
    console.log("WebSocket response:", event.data);
    // Close the connection after receiving the response
    ws.close();
  };
  
  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  ws.onclose = () => {
    console.log("WebSocket connection closed");
  };
  
  // Keep the process alive for WebSocket test
  setTimeout(() => {
    console.log("\nTest completed!");
    process.exit(0);
  }, 3000);
}

testMCP().catch(error => {
  console.error("Error testing MCP:", error);
}); 