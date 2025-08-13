#!/usr/bin/env node

/**
 * 小智MCP桥接服务演示脚本
 * 
 * 此脚本演示如何配置和启动小智MCP桥接服务
 * 注意：需要有效的小智访问令牌才能正常连接
 */

import { XiaozhiMCPBridge } from './src/xiaozhi-bridge.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 演示配置（使用测试端点）
const demoConfig = {
  name: "成语接龙MCP服务演示",
  description: "演示小智MCP桥接功能",
  version: "1.0.0",
  mcpServers: {
    "idiom-chain-mcp": {
      command: "node",
      args: ["src/index.js"],
      cwd: __dirname,
      env: {
        NODE_ENV: "demo"
      },
      transport: "stdio",
      description: "成语接龙MCP服务器",
      tools: [
        "start_game",
        "add_idiom", 
        "get_hints",
        "get_game_state",
        "auto_play",
        "reset_game",
        "validate_idiom",
        "get_random_idiom",
        "get_stats",
        "start_sse_server",
        "get_sse_info"
      ]
    }
  },
  xiaozhi: {
    endpoint: "ws://localhost:9999/demo", // 演示用端点
    reconnect: {
      enabled: true,
      maxRetries: 3,
      backoffMs: 1000
    },
    features: {
      mcp: true,
      realtime: true
    }
  },
  bridge: {
    port: 8080,
    host: "localhost",
    cors: {
      enabled: true,
      origins: ["*"]
    },
    logging: {
      level: "info",
      file: "xiaozhi-bridge-demo.log"
    }
  }
};

// 检查配置文件
function checkConfiguration() {
  const configPath = path.join(__dirname, 'xiaozhi-config.json');
  
  console.log('🔍 检查配置文件...');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ 配置文件不存在，将创建演示配置');
    return null;
  }
  
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    if (config.xiaozhi.endpoint.includes('YOUR_XIAOZHI_TOKEN_HERE')) {
      console.log('⚠️  配置文件中包含占位符令牌，将使用演示配置');
      return null;
    }
    
    console.log('✅ 找到有效配置文件');
    return config;
    
  } catch (error) {
    console.log('❌ 配置文件格式错误，将使用演示配置');
    return null;
  }
}

// 演示MCP服务器启动
async function demonstrateMCPServer() {
  console.log('\n🚀 演示MCP服务器功能...');
  
  const config = checkConfiguration() || demoConfig;
  const bridge = new XiaozhiMCPBridge(config);
  
  try {
    // 只启动MCP服务器部分
    console.log('📦 启动成语接龙MCP服务器...');
    await bridge.startMCPServer();
    
    console.log('✅ MCP服务器启动成功！');
    console.log('📋 可用工具:', config.mcpServers['idiom-chain-mcp'].tools.join(', '));
    
    // 演示一些MCP消息
    console.log('\n📨 演示MCP消息交互...');
    
    // 模拟工具列表请求
    const listToolsMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };
    
    console.log('发送工具列表请求:', JSON.stringify(listToolsMessage, null, 2));
    
    // 等待一段时间让用户看到输出
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🛑 演示完成，关闭MCP服务器...');
    await bridge.stop();
    
  } catch (error) {
    console.error('❌ 演示过程中出错:', error.message);
    await bridge.stop();
  }
}

// 显示配置指南
function showConfigurationGuide() {
  console.log('\n📖 小智接入配置指南:');
  console.log('\n1. 获取小智访问令牌:');
  console.log('   - 访问小智官网申请MCP接入权限');
  console.log('   - 获取WebSocket接入点地址和访问令牌');
  
  console.log('\n2. 编辑配置文件 xiaozhi-config.json:');
  console.log('   - 将 YOUR_XIAOZHI_TOKEN_HERE 替换为实际令牌');
  console.log('   - 确认接入点地址正确');
  
  console.log('\n3. 启动桥接服务:');
  console.log('   npm run xiaozhi-bridge');
  
  console.log('\n4. 在小智中使用成语接龙功能:');
  console.log('   - "开始一个成语接龙游戏"');
  console.log('   - "我接[成语]"');
  console.log('   - "给我一些提示"');
  console.log('   - "查看游戏状态"');
  
  console.log('\n📚 详细文档: XIAOZHI_INTEGRATION.md');
}

// 显示状态信息
function showStatus() {
  console.log('\n📊 当前状态:');
  
  const configPath = path.join(__dirname, 'xiaozhi-config.json');
  const hasConfig = fs.existsSync(configPath);
  
  console.log(`配置文件: ${hasConfig ? '✅ 存在' : '❌ 不存在'}`);
  
  if (hasConfig) {
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      const hasValidToken = !config.xiaozhi.endpoint.includes('YOUR_XIAOZHI_TOKEN_HERE');
      
      console.log(`访问令牌: ${hasValidToken ? '✅ 已配置' : '⚠️  需要配置'}`);
      console.log(`接入点: ${config.xiaozhi.endpoint}`);
      
    } catch (error) {
      console.log('配置格式: ❌ 格式错误');
    }
  }
  
  // 检查依赖
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const packageData = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(packageData);
      const hasWs = packageJson.dependencies && packageJson.dependencies.ws;
      
      console.log(`WebSocket依赖: ${hasWs ? '✅ 已安装' : '❌ 未安装'}`);
      
    } catch (error) {
      console.log('依赖检查: ❌ 检查失败');
    }
  }
}

// 主函数
async function main() {
  console.log('🌉 小智MCP桥接服务演示');
  console.log('================================\n');
  
  const args = process.argv.slice(2);
  const command = args[0] || 'demo';
  
  switch (command) {
    case 'demo':
      await demonstrateMCPServer();
      break;
      
    case 'config':
      showConfigurationGuide();
      break;
      
    case 'status':
      showStatus();
      break;
      
    case 'help':
      console.log('可用命令:');
      console.log('  demo   - 演示MCP服务器功能（默认）');
      console.log('  config - 显示配置指南');
      console.log('  status - 显示当前状态');
      console.log('  help   - 显示此帮助信息');
      break;
      
    default:
      console.log(`❌ 未知命令: ${command}`);
      console.log('使用 "help" 查看可用命令');
      break;
  }
  
  console.log('\n演示结束。');
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 演示失败:', error.message);
    process.exit(1);
  });
}

export { demoConfig, demonstrateMCPServer };