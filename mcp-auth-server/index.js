#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

class AuthMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'auth-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.activeSessions = new Map();
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'connect_chrome',
            description: 'Connect to remote Chrome session via CDP endpoint',
            inputSchema: {
              type: 'object',
              properties: {
                cdpUrl: {
                  type: 'string',
                  description: 'Chrome DevTools Protocol URL (e.g., http://localhost:9222)',
                  default: 'http://localhost:9222'
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID for tracking this connection',
                  default: 'default'
                }
              }
            }
          },
          {
            name: 'get_credentials',
            description: 'Get credentials from environment token',
            inputSchema: {
              type: 'object',
              properties: {
                tokenName: {
                  type: 'string',
                  description: 'Name of the environment variable containing credentials JSON',
                }
              },
              required: ['tokenName']
            }
          },
          {
            name: 'fill_text',
            description: 'Fill text into a selector in the remote Chrome session',
            inputSchema: {
              type: 'object',
              properties: {
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element to fill'
                },
                text: {
                  type: 'string',
                  description: 'Text to fill into the element'
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID to use',
                  default: 'default'
                }
              },
              required: ['selector', 'text']
            }
          },
          {
            name: 'fill_credentials',
            description: 'Fill username and password from token into specified selectors',
            inputSchema: {
              type: 'object',
              properties: {
                tokenName: {
                  type: 'string',
                  description: 'Name of the environment variable containing credentials JSON'
                },
                usernameSelector: {
                  type: 'string',
                  description: 'CSS selector for username field'
                },
                passwordSelector: {
                  type: 'string',
                  description: 'CSS selector for password field'
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID to use',
                  default: 'default'
                }
              },
              required: ['tokenName', 'usernameSelector', 'passwordSelector']
            }
          },
          {
            name: 'get_page_info',
            description: 'Get current page information from remote Chrome session',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session ID to use',
                  default: 'default'
                }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'connect_chrome':
            return await this.handleConnectChrome(request.params.arguments);
          case 'get_credentials':
            return await this.handleGetCredentials(request.params.arguments);
          case 'fill_text':
            return await this.handleFillText(request.params.arguments);
          case 'fill_credentials':
            return await this.handleFillCredentials(request.params.arguments);
          case 'get_page_info':
            return await this.handleGetPageInfo(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async handleConnectChrome(args) {
    const { cdpUrl = 'http://localhost:9222', sessionId = 'default' } = args;

    try {
      console.error(`Connecting to Chrome at: ${cdpUrl}`);
      const browser = await chromium.connectOverCDP(cdpUrl);
      
      const contexts = browser.contexts();
      if (contexts.length === 0) {
        throw new Error('No browser contexts found');
      }
      
      const context = contexts[0];
      const pages = context.pages();
      if (pages.length === 0) {
        throw new Error('No pages found');
      }
      
      const page = pages[0];
      
      this.activeSessions.set(sessionId, { browser, context, page });
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully connected to Chrome session '${sessionId}' at ${cdpUrl}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to connect to Chrome: ${error.message}`);
    }
  }

  async handleGetCredentials(args) {
    const { tokenName } = args;

    try {
      // First try environment variable
      let token = process.env[tokenName];
      
      // If not found, try loading from .env file
      if (!token) {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envFile = fs.readFileSync(envPath, 'utf8');
          const envLines = envFile.split('\n');
          for (const line of envLines) {
            const [key, value] = line.split('=');
            if (key && key.trim() === tokenName && value) {
              token = value.trim();
              break;
            }
          }
        }
      }

      if (!token) {
        throw new Error(`Token ${tokenName} not found in environment or .env file`);
      }
      
      const credentials = JSON.parse(token);
      
      if (!credentials.username || !credentials.password) {
        throw new Error('Token must contain username and password fields');
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Retrieved credentials for token '${tokenName}' (username: ${credentials.username})`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get credentials: ${error.message}`);
    }
  }

  async handleFillText(args) {
    const { selector, text, sessionId = 'default' } = args;

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active session found for '${sessionId}'. Use connect_chrome first.`);
    }

    try {
      await session.page.fill(selector, text);
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully filled text into selector '${selector}' in session '${sessionId}'`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to fill text: ${error.message}`);
    }
  }

  async handleFillCredentials(args) {
    const { tokenName, usernameSelector, passwordSelector, sessionId = 'default' } = args;

    // Get credentials first
    const credentials = await this.getCredentialsFromToken(tokenName);
    
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active session found for '${sessionId}'. Use connect_chrome first.`);
    }

    try {
      await session.page.fill(usernameSelector, credentials.username);
      await session.page.fill(passwordSelector, credentials.password);
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully filled credentials from token '${tokenName}' into username selector '${usernameSelector}' and password selector '${passwordSelector}' in session '${sessionId}'`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to fill credentials: ${error.message}`);
    }
  }

  async handleGetPageInfo(args) {
    const { sessionId = 'default' } = args;

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`No active session found for '${sessionId}'. Use connect_chrome first.`);
    }

    try {
      const url = session.page.url();
      const title = await session.page.title();
      
      return {
        content: [
          {
            type: 'text',
            text: `Session '${sessionId}' - URL: ${url}, Title: ${title}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get page info: ${error.message}`);
    }
  }

  // Helper method to get credentials from token
  async getCredentialsFromToken(tokenName) {
    // First try environment variable
    let token = process.env[tokenName];
    
    // If not found, try loading from .env file
    if (!token) {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envLines = envFile.split('\n');
        for (const line of envLines) {
          const [key, value] = line.split('=');
          if (key && key.trim() === tokenName && value) {
            token = value.trim();
            break;
          }
        }
      }
    }

    if (!token) {
      throw new Error(`Token ${tokenName} not found in environment or .env file`);
    }
    
    const credentials = JSON.parse(token);
    
    if (!credentials.username || !credentials.password) {
      throw new Error('Token must contain username and password fields');
    }
    
    return credentials;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Auth MCP Server running on stdio');
  }
}

const server = new AuthMcpServer();
server.run().catch(console.error);