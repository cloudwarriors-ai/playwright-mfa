#!/usr/bin/env node

// Test script to verify MCP auth server functionality
import { spawn } from 'child_process';
import { chromium } from 'playwright';

class McpTester {
  constructor() {
    this.mcpProcess = null;
    this.browser = null;
    this.testMessages = [];
  }

  async startChromeWithRemoteDebugging() {
    console.log('Starting Chrome with remote debugging...');
    this.browser = await chromium.launch({
      headless: false,
      args: ['--remote-debugging-port=9222'],
    });
    
    const page = await this.browser.newPage();
    await page.goto('https://example.com');
    console.log('✓ Chrome started on port 9222');
    return { browser: this.browser, page };
  }

  async startMcpServer() {
    console.log('Starting MCP server...');
    this.mcpProcess = spawn('node', ['index.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'inherit']
    });

    // Set up message handling
    this.mcpProcess.stdout.on('data', (data) => {
      const response = data.toString().trim();
      if (response) {
        try {
          this.testMessages.push(JSON.parse(response));
        } catch (e) {
          console.log('Raw output:', response);
        }
      }
    });

    console.log('✓ MCP server started');
  }

  async sendMcpMessage(message) {
    return new Promise((resolve, reject) => {
      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data.toString().trim());
          if (response.id === message.id) {
            this.mcpProcess.stdout.removeListener('data', messageHandler);
            resolve(response);
          }
        } catch (e) {
          // Ignore non-JSON responses
        }
      };

      this.mcpProcess.stdout.on('data', messageHandler);
      this.mcpProcess.stdin.write(JSON.stringify(message) + '\n');

      // Timeout after 10 seconds
      setTimeout(() => {
        this.mcpProcess.stdout.removeListener('data', messageHandler);
        reject(new Error('MCP message timeout'));
      }, 10000);
    });
  }

  async testInitialize() {
    console.log('Testing MCP initialization...');
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    const response = await this.sendMcpMessage(initMessage);
    console.log('✓ Initialize response:', JSON.stringify(response, null, 2));
  }

  async testListTools() {
    console.log('Testing tools/list...');
    const listMessage = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };

    const response = await this.sendMcpMessage(listMessage);
    console.log('✓ Tools list response:', JSON.stringify(response, null, 2));
  }

  async testConnectChrome() {
    console.log('Testing connect_chrome tool...');
    const connectMessage = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'connect_chrome',
        arguments: {
          cdpUrl: 'http://localhost:9222',
          sessionId: 'test-session'
        }
      }
    };

    const response = await this.sendMcpMessage(connectMessage);
    console.log('✓ Connect Chrome response:', JSON.stringify(response, null, 2));
  }

  async testGetPageInfo() {
    console.log('Testing get_page_info tool...');
    const pageInfoMessage = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_page_info',
        arguments: {
          sessionId: 'test-session'
        }
      }
    };

    const response = await this.sendMcpMessage(pageInfoMessage);
    console.log('✓ Page info response:', JSON.stringify(response, null, 2));
  }

  async cleanup() {
    console.log('Cleaning up...');
    if (this.mcpProcess) {
      this.mcpProcess.kill();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('✓ Cleanup complete');
  }

  async runTests() {
    try {
      await this.startChromeWithRemoteDebugging();
      await this.startMcpServer();
      
      // Wait a moment for server to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.testInitialize();
      await this.testListTools();
      await this.testConnectChrome();
      await this.testGetPageInfo();

      console.log('\n✅ All tests completed successfully!');
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests
const tester = new McpTester();
tester.runTests();