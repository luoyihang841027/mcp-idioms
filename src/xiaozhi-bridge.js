import WebSocket from 'ws';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 小智MCP桥接服务
class XiaozhiMCPBridge extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.mcpProcess = null;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.xiaozhi?.reconnect?.maxRetries || 5;
    this.reconnectBackoff = config.xiaozhi?.reconnect?.backoffMs || 1000;
    this.isConnected = false;
    this.messageQueue = [];
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  // 启动MCP服务进程
  async startMCPServer() {
    const serverConfig = this.config.mcpServers['idiom-chain-mcp'];
    if (!serverConfig) {
      throw new Error('未找到成语接龙MCP服务器配置');
    }

    console.log('🚀 启动成语接龙MCP服务器...');
    
    this.mcpProcess = spawn(serverConfig.command, serverConfig.args, {
      cwd: serverConfig.cwd || process.cwd(),
      env: { ...process.env, ...serverConfig.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.mcpProcess.stdout.on('data', (data) => {
      try {
        const messages = data.toString().split('\n').filter(line => line.trim());
        messages.forEach(message => {
          if (message.trim()) {
            const jsonMessage = JSON.parse(message);
            this.handleMCPMessage(jsonMessage);
          }
        });
      } catch (error) {
        console.error('解析MCP消息失败:', error.message);
      }
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.error('MCP服务器错误:', data.toString());
    });

    this.mcpProcess.on('close', (code) => {
      console.log(`MCP服务器进程退出，代码: ${code}`);
      this.mcpProcess = null;
    });

    // 等待MCP服务器启动
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 初始化MCP连接
    await this.initializeMCP();
    
    console.log('✅ 成语接龙MCP服务器启动成功');
  }

  // 初始化MCP连接
  async initializeMCP() {
    const initMessage = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'xiaozhi-bridge',
          version: '1.0.0'
        }
      }
    };

    await this.sendToMCP(initMessage);
    
    // 发送initialized通知
    const initializedMessage = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    };
    
    await this.sendToMCP(initializedMessage);
  }

  // 连接到小智服务器
  async connectToXiaozhi() {
    const endpoint = this.config.xiaozhi.endpoint;
    if (!endpoint || endpoint.includes('YOUR_XIAOZHI_TOKEN_HERE')) {
      throw new Error('请在xiaozhi-config.json中配置有效的小智接入点地址');
    }

    console.log('🔗 连接到小智服务器...');
    
    this.ws = new WebSocket(endpoint);
    
    this.ws.on('open', () => {
      console.log('✅ 已连接到小智服务器');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // 发送hello消息
      this.sendHelloMessage();
      
      // 处理消息队列
      this.processMessageQueue();
    });
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleXiaozhiMessage(message);
      } catch (error) {
        console.error('解析小智消息失败:', error.message);
      }
    });
    
    this.ws.on('close', () => {
      console.log('❌ 与小智服务器连接断开');
      this.isConnected = false;
      this.emit('disconnected');
      
      if (this.config.xiaozhi.reconnect?.enabled) {
        this.scheduleReconnect();
      }
    });
    
    this.ws.on('error', (error) => {
      console.error('小智WebSocket错误:', error.message);
      this.emit('error', error);
    });
  }

  // 发送hello消息到小智
  sendHelloMessage() {
    const helloMessage = {
      type: 'hello',
      version: 1,
      features: this.config.xiaozhi.features || { mcp: true },
      transport: 'websocket',
      clientInfo: {
        name: 'idiom-chain-mcp-bridge',
        version: '1.0.0',
        description: '成语接龙MCP桥接服务'
      }
    };
    
    this.sendToXiaozhi(helloMessage);
  }

  // 处理小智消息
  handleXiaozhiMessage(message) {
    console.log('📨 收到小智消息:', JSON.stringify(message, null, 2));
    
    if (message.type === 'hello') {
      console.log('🤝 小智服务器握手成功');
      return;
    }
    
    if (message.type === 'mcp') {
      // 转发MCP消息到本地MCP服务器
      this.forwardToMCP(message.payload);
    }
  }

  // 处理MCP消息
  handleMCPMessage(message) {
    console.log('📨 收到MCP消息:', JSON.stringify(message, null, 2));
    
    // 转发MCP响应到小智
    const xiaozhiMessage = {
      type: 'mcp',
      payload: message
    };
    
    this.sendToXiaozhi(xiaozhiMessage);
  }

  // 转发消息到MCP服务器
  async forwardToMCP(message) {
    if (!this.mcpProcess) {
      console.error('MCP服务器未启动');
      return;
    }
    
    await this.sendToMCP(message);
  }

  // 发送消息到MCP服务器
  async sendToMCP(message) {
    if (!this.mcpProcess) {
      throw new Error('MCP服务器未启动');
    }
    
    const messageStr = JSON.stringify(message) + '\n';
    this.mcpProcess.stdin.write(messageStr);
  }

  // 发送消息到小智
  sendToXiaozhi(message) {
    if (!this.isConnected) {
      this.messageQueue.push(message);
      return;
    }
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // 处理消息队列
  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.sendToXiaozhi(message);
    }
  }

  // 安排重连
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 达到最大重连次数，停止重连');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectBackoff * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 ${delay}ms后尝试第${this.reconnectAttempts}次重连...`);
    
    setTimeout(() => {
      this.connectToXiaozhi().catch(error => {
        console.error('重连失败:', error.message);
      });
    }, delay);
  }

  // 获取下一个请求ID
  getNextRequestId() {
    return ++this.requestId;
  }

  // 启动桥接服务
  async start() {
    try {
      console.log('🌉 启动小智MCP桥接服务...');
      
      // 启动MCP服务器
      await this.startMCPServer();
      
      // 连接到小智
      await this.connectToXiaozhi();
      
      console.log('🎉 小智MCP桥接服务启动成功！');
      console.log('📋 可用工具:', this.config.mcpServers['idiom-chain-mcp'].tools.join(', '));
      
    } catch (error) {
      console.error('❌ 启动桥接服务失败:', error.message);
      throw error;
    }
  }

  // 停止桥接服务
  async stop() {
    console.log('🛑 停止小智MCP桥接服务...');
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    
    console.log('✅ 小智MCP桥接服务已停止');
  }

  // 获取状态
  getStatus() {
    return {
      connected: this.isConnected,
      mcpServerRunning: !!this.mcpProcess,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      availableTools: this.config.mcpServers['idiom-chain-mcp']?.tools || []
    };
  }
}

// 启动桥接服务
async function startBridge() {
  try {
    // 读取配置文件
    const configPath = path.join(__dirname, '..', 'xiaozhi-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // 创建桥接服务
    const bridge = new XiaozhiMCPBridge(config);
    
    // 处理进程退出
    process.on('SIGINT', async () => {
      console.log('\n收到退出信号，正在关闭服务...');
      await bridge.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n收到终止信号，正在关闭服务...');
      await bridge.stop();
      process.exit(0);
    });
    
    // 启动服务
    await bridge.start();
    
    // 定期输出状态
    setInterval(() => {
      const status = bridge.getStatus();
      console.log('📊 服务状态:', {
        连接状态: status.connected ? '✅ 已连接' : '❌ 未连接',
        MCP服务器: status.mcpServerRunning ? '✅ 运行中' : '❌ 未运行',
        重连次数: status.reconnectAttempts,
        队列消息: status.queuedMessages,
        可用工具数: status.availableTools.length
      });
    }, 30000); // 每30秒输出一次状态
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件，则启动桥接服务
if (import.meta.url === `file://${process.argv[1]}`) {
  startBridge();
}

export { XiaozhiMCPBridge };