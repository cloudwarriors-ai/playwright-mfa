# Microsoft Teams MFA Authentication

This guide explains how to handle Microsoft Teams authentication with Multi-Factor Authentication (MFA) using the auth-mcp tools.

## Authentication Process

1. **Connect to Chrome session**
   ```javascript
   auth-mcp_connect_chrome({
     cdpUrl: "http://localhost:9222",
     sessionId: "default"
   })
   ```

2. **Navigate to Teams Admin Portal**
   ```javascript
   playwright_browser_navigate({
     url: "https://admin.teams.microsoft.com"
   })
   ```

3. **Select account (if account picker appears)**
   ```javascript
   playwright_browser_click({
     element: "button with account name",
     ref: "element_reference"
   })
   ```

4. **Enter password**
   ```javascript
   playwright_browser_type({
     element: "password field",
     ref: "element_reference", 
     text: "password_from_token"
   })

   playwright_browser_click({
     element: "Sign in button",
     ref: "element_reference"
   })
   ```

5. **Handle MFA Challenge**
   - Take a snapshot to analyze the page
   - Extract the verification code
   - Display the code to the user

   ```javascript
   // The MFA code appears in this format: "Enter the number if prompted. XX"
   // Extract the number and show it to the user
   const mfaCode = "85"; // Example from our test
   console.log(`Please approve the request in Microsoft Authenticator with code: ${mfaCode}`);
   ```

6. **Wait for MFA approval**
   ```javascript
   playwright_browser_wait_for({
     time: 30
   })
   ```

7. **Handle "Stay signed in?" prompt**
   ```javascript
   playwright_browser_click({
     element: "button \"Yes\"",
     ref: "element_reference"
   })
   ```

8. **Verify successful login**
   ```javascript
   playwright_browser_take_screenshot({
     fullPage: true,
     filename: "teams_admin_portal.png"
   })
   ```

## Key Points

1. **MFA Code Extraction**: The crucial step is extracting the verification code from the page to show to the user.

2. **Waiting for Approval**: After showing the code, you need to wait for the user to approve the request in the Microsoft Authenticator app.

3. **Credential Management**: Use an .env file to store credentials in the format:
   ```
   TEAMS_TOKEN={"username":"your-username@example.com","password":"your-password"}
   ```

4. **Security**: Never commit actual credentials to version control.

## Example Success Flow

Our test successfully authenticated to the Microsoft Teams Admin Portal by:
1. Connecting to the Chrome CDP
2. Navigating to Teams Admin Portal
3. Selecting the account from the picker
4. Entering the password
5. Extracting and displaying the MFA code (85)
6. Waiting for approval
7. Handling the "Stay signed in?" prompt
8. Confirming successful login to the dashboard