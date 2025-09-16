# Microsoft Teams Authentication Guide

This guide provides instructions for authenticating to Microsoft Teams Admin Portal using the auth-mcp tools, handling the Multi-Factor Authentication (MFA) challenge.

## Prerequisites
- Environment file (.env) with TEAMS_TOKEN configured
- Chrome browser running with remote debugging enabled (CDP)

### Credential Setup
Create a `.env` file with your Microsoft Teams credentials in the following format:

```
TEAMS_TOKEN={"username":"your-admin@yourdomain.com","password":"your-secure-password"}
```

Make sure to keep this file secure and never commit it to version control. This is the credential that will be used during the authentication process.

#### Verifying Credentials
Before attempting authentication, it's a good practice to verify that your credentials are properly loaded from the .env file:

```javascript
// Verify .env file exists
glob({
  pattern: ".env"
})

// Test loading credentials from .env file
auth-mcp_get_credentials({
  tokenName: "TEAMS_TOKEN"
})
```

You should see a confirmation message that includes your username but hides the password for security reasons. Make sure the username displayed matches what you expect. If you don't see this confirmation, your .env file might be incorrectly formatted or the TEAMS_TOKEN might not be correctly defined.

## Authentication Steps

### 1. Connect to Chrome session
```javascript
auth-mcp_connect_chrome({
  cdpUrl: "http://localhost:9222",
  sessionId: "default"
})
```

### 2. Navigate to Teams Admin Portal
```javascript
playwright_browser_navigate({
  url: "https://admin.teams.microsoft.com"
})
```

### 3. Handle initial sign-in

Wait for the sign-in page to load and select the account if presented with multiple options:
```javascript
// If presented with account options
playwright_browser_click({
  element: "button with account name",
  ref: "element_reference"
})
```

### 4. Enter password

There are two methods to enter the password. Method A uses automatic credential filling, while Method B uses manual password entry (preferred if Method A fails):

#### Method A: Automatic Credential Filling (May Not Work Consistently)
```javascript
auth-mcp_fill_text({
  selector: "input[type='password']",
  text: "@@password-from-credentials@@"
})

playwright_browser_click({
  element: "Sign in button",
  ref: "element_reference"
})
```

#### Method B: Manual Password Entry (More Reliable)
```javascript
// First, get credentials from the environment and verify they loaded correctly
auth-mcp_get_credentials({
  tokenName: "TEAMS_TOKEN"
})

// Manually type the password from your .env file (in this example "C0mpr0m!z4d" or whatever your password is)
// Important: Use the actual password from your .env file, DO NOT use "@@password-from-credentials@@" as it may not work correctly
playwright_browser_type({
  element: "Enter the password for your-admin@yourdomain.com",
  ref: "element_reference", 
  text: "C0mpr0m!z4d"  // Replace with your actual password from the .env file
})

playwright_browser_click({
  element: "Sign in button",
  ref: "element_reference"
})
```

### 5. Handle MFA Challenge

When the MFA challenge appears, extract and display the verification number:
```javascript
// Take a snapshot to get the current state
playwright_browser_snapshot()

// Extract and display the MFA verification number
playwright_browser_evaluate({
  function: `() => {
    // Find the element containing "Enter the number if prompted" text
    const elements = Array.from(document.querySelectorAll('div, span, p'));
    const mfaElement = elements.find(el => 
      el.textContent && el.textContent.includes('Enter the number if prompted')
    );
    
    // Extract the MFA number
    let mfaNumber = "Not found";
    if (mfaElement) {
      const match = mfaElement.textContent.match(/\\d+/);
      if (match) mfaNumber = match[0];
    }
    
    // Create a prominent display box for the MFA number
    console.log("==================================================");
    console.log("==================================================");
    console.log(\`MFA VERIFICATION NUMBER: \${mfaNumber}\`);
    console.log("Please approve this request in your Authenticator app");
    console.log("==================================================");
    console.log("==================================================");
    
    return mfaNumber;
  }`
})
```

The MFA code is usually displayed in the format: "...Enter the number if prompted. XX" where XX is the verification code.

**Important:** The script will prominently display the verification number in the console output. The user must look for this number in their Authenticator app and approve the request that matches this number.

### 6. Wait for MFA approval

After displaying the MFA verification number, wait for the user to approve the request in their Authenticator app:
```javascript
// Wait for navigation after MFA approval
// Provide sufficient time for the user to find and approve the request
playwright_browser_wait_for({
  time: 60  // 60 seconds should be enough for most users to approve
})

// Verify successful login by taking a snapshot
playwright_browser_snapshot()
```

### 7. Confirm successful login

Verify that you've successfully logged in to the Teams Admin Portal:
```javascript
// Take a screenshot of the Teams Admin Portal
playwright_browser_take_screenshot({
  fullPage: true,
  filename: "teams_admin_portal.png"
})
```

## Troubleshooting

1. **MFA Challenge Timeout**: If the MFA challenge times out, you'll need to restart the authentication process.

2. **Session Management**: Microsoft may remember your device. On subsequent logins, you might not be prompted for MFA.

3. **Error Handling**: If you encounter errors like "We couldn't sign you in" or "Your account has been locked", you may need to address account-specific issues.

4. **CDP Connection Issues**: If the CDP connection fails, ensure Chrome is running with remote debugging enabled on port 9222.

5. **Password Entry Issues**: If automatic credential filling fails, use the manual password entry method (Method B) which has proven more reliable during testing. Make sure to use the actual password string from your .env file rather than relying on the token replacement mechanism.

6. **Stay Signed In Prompt**: After successful MFA authentication, you may be asked if you want to "Stay signed in". Click "Yes" to proceed to the Teams Admin Portal.