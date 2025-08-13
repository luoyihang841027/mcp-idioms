import { XiaozhiMCPBridge } from '../src/xiaozhi-bridge.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试配置
const testConfig = {
  name: "成语接龙MCP服务测试",
  description: "测试小智MCP桥接功能",
  version: "1.0.0",
  mcpServers: {
    "idiom-chain-mcp": {
      command: "node",
      args: ["src/index.js"],
      cwd: path.join(__dirname, '..')
    }
  },
  xiaozhi: {
    endpoint: "ws://localhost:9999/test", // 测试用的假端点
    reconnect: {
      enabled: false, // 测试时禁用重连
      maxRetries: 1,
      backoffMs: 100
    },
    features: {
      mcp: true,
      realtime: true
    }
  },
  bridge: {
    port: 8080,
    host: "localhost",
    logging: {
      level: "info"
    }
  }
};

// 测试框架
class TestFramework {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('🧪 开始小智MCP桥接服务测试\n');
    
    for (const { name, fn } of this.tests) {
      try {
        console.log(`🔍 测试: ${name}`);
        await fn();
        console.log(`✅ 通过: ${name}\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ 失败: ${name}`);
        console.log(`   错误: ${error.message}\n`);
        this.failed++;
      }
    }
    
    console.log('📊 测试结果:');
    console.log(`   通过: ${this.passed}`);
    console.log(`   失败: ${this.failed}`);
    console.log(`   总计: ${this.tests.length}`);
    
    if (this.failed === 0) {
      console.log('🎉 所有测试通过！');
    } else {
      console.log('⚠️  部分测试失败');
    }
  }
}

// 创建测试实例
const test = new TestFramework();

// 测试桥接服务创建
test.test('创建桥接服务实例', async () => {
  const bridge = new XiaozhiMCPBridge(testConfig);
  
  if (!bridge) {
    throw new Error('无法创建桥接服务实例');
  }
  
  if (bridge.config !== testConfig) {
    throw new Error('配置未正确设置');
  }
  
  console.log('   ✓ 桥接服务实例创建成功');
});

// 测试配置验证
test.test('配置验证', async () => {
  const bridge = new XiaozhiMCPBridge(testConfig);
  
  const serverConfig = bridge.config.mcpServers['idiom-chain-mcp'];
  if (!serverConfig) {
    throw new Error('MCP服务器配置缺失');
  }
  
  if (serverConfig.command !== 'node') {
    throw new Error('MCP服务器命令配置错误');
  }
  
  console.log('   ✓ 配置验证通过');
});

// 测试状态获取
test.test('获取服务状态', async () => {
  const bridge = new XiaozhiMCPBridge(testConfig);
  
  const status = bridge.getStatus();
  
  if (typeof status !== 'object') {
    throw new Error('状态返回类型错误');
  }
  
  const requiredFields = ['connected', 'mcpServerRunning', 'reconnectAttempts', 'queuedMessages', 'availableTools'];
  for (const field of requiredFields) {
    if (!(field in status)) {
      throw new Error(`状态缺少字段: ${field}`);
    }
  }
  
  console.log('   ✓ 状态字段完整');
  console.log(`   ✓ 初始状态: 连接=${status.connected}, MCP运行=${status.mcpServerRunning}`);
});

// 测试消息队列
test.test('消息队列功能', async () => {
  const bridge = new XiaozhiMCPBridge(testConfig);
  
  // 在未连接状态下发送消息应该进入队列
  const testMessage = { type: 'test', data: 'hello' };
  bridge.sendToXiaozhi(testMessage);
  
  const status = bridge.getStatus();
  if (status.queuedMessages !== 1) {
    throw new Error(`消息队列数量错误，期望1，实际${status.queuedMessages}`);
  }
  
  console.log('   ✓ 消息正确进入队列');
});

// 测试请求ID生成
test.test('请求ID生成', async () => {
  const bridge = new XiaozhiMCPBridge(testConfig);
  
  const id1 = bridge.getNextRequestId();
  const id2 = bridge.getNextRequestId();
  
  if (id1 >= id2) {
    throw new Error('请求ID应该递增');
  }
  
  if (typeof id1 !== 'number' || typeof id2 !== 'number') {
    throw new Error('请求ID应该是数字');
  }
  
  console.log(`   ✓ 请求ID正确生成: ${id1} -> ${id2}`);
});

// 测试MCP服务器启动（模拟）
test.test('MCP服务器启动准备', async () => {
  const bridge = new XiaozhiMCPBridge(testConfig);
  
  // 检查MCP服务器配置
  const serverConfig = bridge.config.mcpServers['idiom-chain-mcp'];
  
  // 验证命令和参数
  if (!serverConfig.command || !serverConfig.args) {
    throw new Error('MCP服务器启动参数不完整');
  }
  
  // 验证工作目录
  if (!fs.existsSync(serverConfig.cwd)) {
    throw new Error(`工作目录不存在: ${serverConfig.cwd}`);
  }
  
  // 验证MCP服务器文件
  const mcpServerPath = path.join(serverConfig.cwd, serverConfig.args[0]);
  if (!fs.existsSync(mcpServerPath)) {
    throw new Error(`MCP服务器文件不存在: ${mcpServerPath}`);
  }
  
  console.log('   ✓ MCP服务器文件存在');
  console.log(`   ✓ 工作目录: ${serverConfig.cwd}`);
  console.log(`   ✓ 启动命令: ${serverConfig.command} ${serverConfig.args.join(' ')}`);
});

// 测试事件发射器
test.test('事件发射器功能', async () => {
  const bridge = new XiaozhiMCPBridge(testConfig);
  
  let eventReceived = false;
  
  bridge.on('test-event', () => {
    eventReceived = true;
  });
  
  bridge.emit('test-event');
  
  if (!eventReceived) {
    throw new Error('事件未正确发射');
  }
  
  console.log('   ✓ 事件发射器工作正常');
});

// 测试配置文件读取
test.test('配置文件格式验证', async () => {
  // 验证实际配置文件格式
  const configPath = path.join(__dirname, '..', 'xiaozhi-config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('配置文件不存在');
  }
  
  const configData = fs.readFileSync(configPath, 'utf8');
  let config;
  
  try {
    config = JSON.parse(configData);
  } catch (error) {
    throw new Error(`配置文件JSON格式错误: ${error.message}`);
  }
  
  // 验证必要字段
  if (!config.mcpServers || !config.xiaozhi) {
    throw new Error('配置文件缺少必要字段');
  }
  
  if (!config.mcpServers['idiom-chain-mcp']) {
    throw new Error('配置文件缺少成语接龙MCP服务器配置');
  }
  
  console.log('   ✓ 配置文件格式正确');
  console.log(`   ✓ 配置的小智端点: ${config.xiaozhi.endpoint}`);
});

// 运行所有测试
async function runTests() {
  try {
    await test.run();
  } catch (error) {
    console.error('❌ 测试运行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { TestFramework, testConfig };