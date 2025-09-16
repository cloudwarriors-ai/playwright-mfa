
#launch a remote chrome session

'''windows

chrome --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --user-data-dir=C:\Users\doug\remote-debug



# Playwright Authentication Manager

A streamlined, token-based credential management system designed to work seamlessly with the Playwright MCP tool for complete authentication workflows.

## Features

- **Token-based credentials**: Store credentials securely in environment variables
- **Auto-detection**: Automatically finds login form fields (username, password)
- **MCP Integration**: Works directly with existing Playwright MCP browser sessions
- **Streamlined workflow**: Fill credentials with auth tool, handle interactions with Playwright MCP
- **Simple interface**: Just two commands - fill and show

## Installation

```bash
npm install
npm run install-playwright
```

## Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Add your tokens to the `.env` file:
```bash
# .env
SUPERSAAS_TOKEN={"username":"your-email@example.com","password":"your-password"}
TEAMS_TOKEN={"username":"admin@yourorg.com","password":"your-admin-password"}
```

## Usage

### Streamlined Workflow

```bash
# 1. Navigate to login page (using Playwright MCP tool)
# Use the Playwright MCP tool to navigate to login page

# 2. Fill credentials (using auth tool)
node auth-tool-streamlined.js fill TEAMS_TOKEN
node auth-tool-streamlined.js fill SUPERSAAS_TOKEN

# 3. Complete login (using Playwright MCP tool) 
# Use Playwright MCP tool to click submit, handle MFA, etc.

# Show credentials for verification
node auth-tool-streamlined.js show TEAMS_TOKEN
```

### Programmatic Usage

```javascript
const AuthManager = require('./auth-manager');

async function example() {
  const auth = new AuthManager();

  // Option 1: Connect to MCP server first (all operations will use this browser)
  await auth.connectToMcpServer('http://localhost:9222');

  // Login with auto-detection (will use MCP session)
  await auth.login({
    url: 'https://example.com/login',
    tokenName: 'SITE_TOKEN',
    sessionId: 'my-session',
    useMcp: true  // Use MCP session if available (default)
  });

  // Option 2: Create a standalone session (not using MCP)
  await auth.login({
    url: 'https://example.com/login',
    tokenName: 'SITE_TOKEN',
    sessionId: 'standalone-session',
    useMcp: false  // Force creation of a new session
  });

  // Navigate after login
  await auth.navigate('https://example.com/dashboard', 'my-session');
  
  // Take screenshot
  await auth.screenshot('dashboard.png', 'my-session');

  // Close session
  await auth.closeSession('my-session');
}
```

### Advanced Login Options

```javascript
await auth.login({
  url: 'https://example.com/login',
  tokenName: 'SITE_TOKEN',
  sessionId: 'my-session',
  usernameSelector: 'input[name="email"]',  // Override auto-detection
  passwordSelector: 'input[name="password"]',
  submitSelector: 'button[type="submit"]',
  waitForSelector: '.dashboard',  // Wait for this element after login
  timeout: 15000,  // Custom timeout
  useMcp: true     // Whether to use MCP session if available (default: true)
});
```

## Token Format

Tokens in the `.env` file should be JSON objects:

```bash
TOKEN_NAME={"username":"user@example.com","password":"secret123"}
```

## Available Commands

### Auth Tool Commands
- `fill <tokenName>` - Fill credentials from environment token into current page
- `show <tokenName>` - Display credentials for verification (password hidden)
- `debug` - Run diagnostics to troubleshoot MCP connection issues

### Use Playwright MCP Tool For
- Navigation (`playwright_browser_navigate`)
- Clicking elements (`playwright_browser_click`)
- Taking screenshots (`playwright_browser_take_screenshot`)
- Waiting for elements (`playwright_browser_wait_for`)
- All other browser interactions

## Integration with OpenCode

The auth manager is configured as an MCP tool in `opencode.json`:

```json
"auth-manager": {
  "type": "local", 
  "command": ["node", "auth-tool-streamlined.js"],
  "enabled": true,
  "description": "Credentials-only tool for filling login forms using environment tokens. Use with Playwright MCP for complete authentication workflows."
}
```

This provides a clean separation of concerns:
- **Auth tool**: Handles credential filling only
- **Playwright MCP**: Handles all browser interactions
- **Security**: Credentials stored in environment variables, never hardcoded

## Security Notes

- Never commit the `.env` file to version control
- Use strong, unique passwords for each service
- Consider using application-specific passwords where available
- Regularly rotate credentials
- Keep the `.env` file permissions restricted (readable only by owner)

## Examples

See `usage-example.js` for complete examples of:
- SuperSaaS calendar login
- Microsoft Teams admin login
- Multiple concurrent sessions
- Error handling and cleanup

## Example: Microsoft Teams Login

Here's how to authenticate to Microsoft Teams admin center:

```bash
# 1. Use Playwright MCP to navigate to login page
# Navigate to: https://admin.teams.microsoft.com/dashboard

# 2. Fill credentials using auth tool
node auth-tool-streamlined.js fill TEAMS_TOKEN

# 3. Use Playwright MCP to complete login
# Click sign in button, handle MFA, click "Yes" to stay signed in

# Result: Successfully authenticated to Teams admin center
```

### Handling Microsoft Teams MFA Authentication

Microsoft Teams uses Multi-Factor Authentication (MFA), which requires special handling. See the [MFA-AUTHENTICATION.md](./MFA-AUTHENTICATION.md) file for detailed instructions on:

1. Extracting the MFA verification code from the page
2. Waiting for user approval in the Microsoft Authenticator app
3. Complete flow for handling Teams MFA authentication

Example MFA verification code extraction:
```javascript
// The MFA code appears in this format on the page:
// "Open your Authenticator app and approve the request. Enter the number if prompted. 85"

// Extract the number with a regex pattern
const mfaText = await page.textContent('body');
const match = mfaText.match(/Enter the number if prompted\.?\s*(\d+)/i);
const mfaCode = match ? match[1] : null;

console.log(`Please approve the request in Microsoft Authenticator with code: ${mfaCode}`);
```

## Example: SuperSaaS Login

```bash  
# 1. Navigate to SuperSaaS (Playwright MCP)
# Navigate to: https://www.supersaas.com/schedule/login/wspvs/Kelso_Calendar

# 2. Fill credentials (Auth tool)
node auth-tool-streamlined.js fill SUPERSAAS_TOKEN

# 3. Submit and handle any CAPTCHA (Playwright MCP)
# Click submit, solve CAPTCHA if needed
```

## MCP Server Integration

The AuthManager can connect directly to a running MCP (Multi-Client Protocol) server, allowing you to manage browser sessions across tools.

### Connecting to MCP Server

```javascript
const AuthManager = require('./auth-manager');

async function mcpExample() {
  const auth = new AuthManager();
  
  // Connect to MCP server (default is http://localhost:9222)
  await auth.connectToMcpServer('http://localhost:9222');
  
  // Now all operations will use the MCP browser by default
  await auth.navigate('https://example.com');
  await auth.screenshot('example.png');
  
  // Check if MCP is connected
  if (auth.isMcpConnected()) {
    console.log('Using MCP session');
  }
  
  // Close the MCP session when done
  await auth.closeSession('mcp-session');
}
```

### MCP Session Management

- `connectToMcpServer(mcpServerUrl)`: Connect to a running MCP server
- `isMcpConnected()`: Check if connected to MCP server
- `getMcpSession()`: Get the MCP session if connected

### Running MCP Server

To start Chrome with remote debugging enabled:

```bash
google-chrome --remote-debugging-port=9222
```

## Troubleshooting

If you're experiencing issues with the auth-manager MCP, use the built-in debugging tools:

### Debug Command

Run the debug command to diagnose common issues:

```bash
node auth-tool-streamlined.js debug
```

Or try the MCP-specific debug script:

```bash
node debug-mcp.js [mcp-url]
```

This will:
- Check if the .env file exists and is properly formatted
- Verify that tokens are present and valid
- Test the connection to the MCP browser
- Detect if the current page has login fields
- Generate detailed logs for troubleshooting

### Common Issues and Solutions

1. **MCP Browser Connection Failed**
   - Make sure Chrome is running with remote debugging enabled:
   ```bash
   google-chrome --remote-debugging-port=9222
   ```
   - Check that no other process is using port 9222
   - Ensure Playwright is properly installed: `npm run install-playwright`

2. **Invalid Credentials Format**
   - Verify your .env file has correctly formatted JSON tokens:
   ```
   TOKEN_NAME={"username":"user@example.com","password":"password123"}
   ```
   - Use the `show` command to verify token parsing: `node auth-tool-streamlined.js show TOKEN_NAME`

3. **Login Fields Not Detected**
   - Make sure you're on a login page before filling credentials
   - Consider providing explicit selectors if auto-detection fails:
   ```bash
   node auth-tool-streamlined.js fill TOKEN_NAME "#email-field" "#password-field"
   ```

### Detailed Debug Logs

Debug logs are written to `auth-tool.log` in the project directory. These contain detailed information about:
- Environment variable loading
- Credential parsing
- MCP browser connection attempts
- Form field detection
- Any errors encountered during execution

Use these logs to troubleshoot complex issues or when contacting support.