import { spawn, ChildProcess } from 'child_process';
import { CustomerData } from './customerService.js';

export interface MCPAction {
  tool: string;
  input: any;
  result?: any;
  error?: string;
}

export class MCPClient {
  private mcpProcess: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private buffer = '';

  constructor(private mcpServerPath: string) {}

  async initialize(): Promise<void> {
    if (this.mcpProcess) {
      return; // Already initialized
    }

    return new Promise((resolve, reject) => {
      this.mcpProcess = spawn('node', [this.mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      });

      if (!this.mcpProcess.stdout || !this.mcpProcess.stdin) {
        reject(new Error('Failed to create MCP process stdio'));
        return;
      }

      this.mcpProcess.stdout.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      this.mcpProcess.stderr?.on('data', (data: Buffer) => {
        const message = data.toString();
        if (message.includes('running on stdio')) {
          resolve();
        }
      });

      this.mcpProcess.on('error', (error) => {
        console.error('[MCP Client] Process error:', error);
        reject(error);
      });

      this.mcpProcess.on('exit', (code) => {
        console.error('[MCP Client] Process exited with code:', code);
        this.mcpProcess = null;
      });

      // Timeout initialization
      setTimeout(() => {
        if (this.mcpProcess) {
          resolve(); // Resolve anyway after timeout
        }
      }, 2000);
    });
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const response = JSON.parse(line);
        
        if (response.id !== undefined && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id)!;
          this.pendingRequests.delete(response.id);
          
          if (response.error) {
            reject(new Error(response.error.message || 'MCP request failed'));
          } else {
            resolve(response.result);
          }
        }
      } catch (error) {
        console.error('[MCP Client] Failed to parse response:', line);
      }
    }
  }

  private async sendRequest(method: string, params: any): Promise<any> {
    if (!this.mcpProcess || !this.mcpProcess.stdin) {
      await this.initialize();
    }

    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      const requestStr = JSON.stringify(request) + '\n';
      this.mcpProcess!.stdin!.write(requestStr);

      // Timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MCP request timeout'));
        }
      }, 10000);
    });
  }

  async listTools(): Promise<any> {
    return this.sendRequest('tools/list', {});
  }

  async callTool(name: string, args: any): Promise<any> {
    return this.sendRequest('tools/call', {
      name,
      arguments: args,
    });
  }

  async createCustomer(customerData: CustomerData): Promise<MCPAction> {
    const action: MCPAction = {
      tool: 'createCustomer',
      input: customerData,
    };

    try {
      const result = await this.callTool('createCustomer', customerData);
      
      // Parse the text content from MCP response
      if (result && result.content && result.content[0]) {
        const textContent = result.content[0].text;
        action.result = JSON.parse(textContent);
      } else {
        action.result = result;
      }
    } catch (error) {
      action.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return action;
  }

  async shutdown(): Promise<void> {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    this.pendingRequests.clear();
  }
}
