# Using Auth-MCP Tool with LLM

This document shows examples of how an LLM can use the auth-mcp tool to interact with a browser session.

## Connection Example

```bash
# LLM would call this command to connect to MCP server
node auth-tool-mcp.js connect http://localhost:9222

# Expected JSON response:
{
  "success": true,
  "message": "Connected to MCP server at http://localhost:9222",
  "currentUrl": "https://example.com",
  "pageTitle": "Example Domain"
}
```

## Navigation Example

```bash
# LLM would call this to navigate to a URL
node auth-tool-mcp.js navigate https://google.com

# Expected JSON response:
{
  "success": true,
  "message": "Navigated to https://google.com",
  "currentUrl": "https://www.google.com/",
  "pageTitle": "Google"
}
```

## Form Filling Example

```bash
# LLM would call this to fill a search box
node auth-tool-mcp.js fill "input[name='q']" "Playwright automation"

# Expected JSON response:
{
  "success": true,
  "message": "Filled element: input[name='q']"
}
```

## Clicking Example

```bash
# LLM would call this to click a button
node auth-tool-mcp.js click "input[value='Google Search']"

# Expected JSON response:
{
  "success": true,
  "message": "Clicked element: input[value='Google Search']"
}
```

## Taking a Screenshot

```bash
# LLM would call this to take a screenshot
node auth-tool-mcp.js screenshot search-results.png

# Expected JSON response:
{
  "success": true,
  "message": "Screenshot saved to search-results.png"
}
```

## Complete Automation Flow

A complete automation flow might look like this:

1. Connect to MCP server:
   ```bash
   node auth-tool-mcp.js connect
   ```

2. Navigate to login page:
   ```bash
   node auth-tool-mcp.js navigate https://example.com/login
   ```

3. Fill username:
   ```bash
   node auth-tool-mcp.js fill "input[name='username']" "user@example.com"
   ```

4. Fill password:
   ```bash
   node auth-tool-mcp.js fill "input[type='password']" "password123"
   ```

5. Click login button:
   ```bash
   node auth-tool-mcp.js click "button[type='submit']"
   ```

6. Wait for dashboard to load:
   ```bash
   node auth-tool-mcp.js wait ".dashboard-container" 15000
   ```

7. Take screenshot of dashboard:
   ```bash
   node auth-tool-mcp.js screenshot dashboard.png
   ```

8. Close session when done:
   ```bash
   node auth-tool-mcp.js close
   ```