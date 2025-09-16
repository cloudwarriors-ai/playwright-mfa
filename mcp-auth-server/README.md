# MCP Auth Server

A proper Model Context Protocol (MCP) server for authentication with remote Chrome sessions.

## Features

- **Proper MCP Protocol**: Implements JSON-RPC 2.0 with MCP specification
- **Remote Chrome Connection**: Connects to Chrome via CDP (Chrome DevTools Protocol)
- **Credential Management**: Retrieves credentials from environment variables or .env file
- **Text Filling**: Fills text into any CSS selector in the remote Chrome session
- **Session Management**: Supports multiple named sessions

## Installation

```bash
cd mcp-auth-server
npm install
```

## Usage

### As MCP Server (for OpenCode)

The server is designed to work with OpenCode via the MCP protocol:

```json
{
  "mcp": {
    "auth-mcp": {
      "type": "local",
      "command": ["node", "mcp-auth-server/index.js"],
      "enabled": true
    }
  }
}
```

### Standalone Testing

```bash
# Start the server directly
npm start

# Run the test suite
node test.js
```

## Tools Available

### 1. `connect_chrome`
Connect to a remote Chrome session via CDP.

**Parameters:**
- `cdpUrl` (optional): Chrome DevTools Protocol URL (default: "http://localhost:9222")
- `sessionId` (optional): Session ID for tracking (default: "default")

### 2. `get_credentials`
Retrieve credentials from environment variable or .env file.

**Parameters:**
- `tokenName` (required): Name of environment variable containing JSON credentials

**Expected credential format:**
```json
{"username": "user@example.com", "password": "password123"}
```

### 3. `fill_text`
Fill text into any element via CSS selector.

**Parameters:**
- `selector` (required): CSS selector for the target element
- `text` (required): Text to fill
- `sessionId` (optional): Session to use (default: "default")

### 4. `fill_credentials`
Fill username and password from token into specified selectors.

**Parameters:**
- `tokenName` (required): Environment variable name
- `usernameSelector` (required): CSS selector for username field
- `passwordSelector` (required): CSS selector for password field
- `sessionId` (optional): Session to use (default: "default")

### 5. `get_page_info`
Get current page URL and title from the remote session.

**Parameters:**
- `sessionId` (optional): Session to use (default: "default")

## Example Workflow

1. **Start Chrome with remote debugging:**
   ```bash
   chromium --remote-debugging-port=9222
   ```

2. **Connect to Chrome via MCP:**
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "connect_chrome",
       "arguments": {
         "cdpUrl": "http://localhost:9222",
         "sessionId": "login-session"
       }
     }
   }
   ```

3. **Fill credentials:**
   ```json
   {
     "jsonrpc": "2.0",
     "id": 2,
     "method": "tools/call",
     "params": {
       "name": "fill_credentials",
       "arguments": {
         "tokenName": "GMAIL_TOKEN",
         "usernameSelector": "input[type='email']",
         "passwordSelector": "input[type='password']",
         "sessionId": "login-session"
       }
     }
   }
   ```

## Integration with Playwright MCP

This auth server is designed to work alongside the Playwright MCP server:

1. **Playwright MCP** handles navigation, clicking, waiting, screenshots
2. **Auth MCP** handles credential filling into text fields
3. Both connect to the same remote Chrome session via CDP

## Testing

The included test suite verifies:
- MCP protocol compliance
- Chrome connection functionality  
- Tool execution
- Error handling

Run tests with:
```bash
node test.js
```

## Environment Setup

Create a `.env` file or set environment variables:

```env
GMAIL_TOKEN={"username":"user@gmail.com","password":"password123"}
FACEBOOK_TOKEN={"username":"user@facebook.com","password":"password456"}
```