#!/usr/bin/env node

/**
 * 简化的SSE演示脚本
 * 展示如何通过HTTP API与SSE服务器交互
 */

import fetch from 'node-fetch';

const SSE_BASE_URL = 'http://localhost:3000';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查SSE服务器状态
async function checkServerStatus() {
  try {
    const response = await fetch(`${SSE_BASE_URL}/health`);
    const data = await response.json();
    log(`✅ SSE服务器状态: ${data.status}`, 'green');
    log(`📊 连接的客户端: ${data.connectedClients}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ 无法连接到SSE服务器: ${error.message}`, 'red');
    return false;
  }
}

// 获取可用工具列表
async function getTools() {
  try {
    const response = await fetch(`${SSE_BASE_URL}/api/tools`);
    const data = await response.json();
    log(`🔧 可用工具 (${data.tools.length}个):`, 'blue');
    data.tools.forEach(tool => {
      log(`   - ${tool.name}: ${tool.description}`, 'yellow');
    });
    return data.tools;
  } catch (error) {
    log(`❌ 获取工具列表失败: ${error.message}`, 'red');
    return [];
  }
}

// 调用工具
async function callTool(toolName, args = {}) {
  try {
    const response = await fetch(`${SSE_BASE_URL}/api/call/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ arguments: args })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    log(`🎯 调用 ${toolName}:`, 'green');
    console.log(JSON.stringify(data.result, null, 2));
    return data.result;
  } catch (error) {
    log(`❌ 调用 ${toolName} 失败: ${error.message}`, 'red');
    return null;
  }
}

// 演示游戏流程
async function demoGameFlow() {
  log('\n🎮 开始成语接龙游戏演示', 'blue');
  
  // 1. 开始游戏
  log('\n1️⃣ 开始新游戏...', 'yellow');
  await callTool('start_game');
  
  // 2. 查看游戏状态
  log('\n2️⃣ 查看游戏状态...', 'yellow');
  await callTool('get_game_state');
  
  // 3. 添加成语
  log('\n3️⃣ 添加成语 "一心一意"...', 'yellow');
  await callTool('add_idiom', { idiom: '一心一意' });
  
  // 4. AI自动接龙
  log('\n4️⃣ AI自动接龙...', 'yellow');
  await callTool('auto_play');
  
  // 5. 获取提示
  log('\n5️⃣ 获取提示...', 'yellow');
  await callTool('get_hints');
  
  // 6. 查看统计
  log('\n6️⃣ 查看游戏统计...', 'yellow');
  await callTool('get_stats');
  
  // 7. 获取SSE信息
  log('\n7️⃣ 获取SSE信息...', 'yellow');
  await callTool('get_sse_info');
}

// 主函数
async function main() {
  log('🚀 SSE简化演示脚本启动', 'green');
  
  // 检查服务器状态
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    log('\n💡 请先启动SSE服务器: npm run sse', 'yellow');
    process.exit(1);
  }
  
  // 获取工具列表
  await getTools();
  
  // 演示游戏流程
  await demoGameFlow();
  
  log('\n✅ 演示完成！', 'green');
  log('\n💡 提示:', 'blue');
  log('   - 访问 http://localhost:3000/events 查看SSE事件流', 'yellow');
  log('   - 访问 http://localhost:3000/health 查看服务器状态', 'yellow');
  log('   - 使用 npm run xiaozhi-sse 启动xiaozhi-client集成', 'yellow');
}

// 错误处理
process.on('unhandledRejection', (error) => {
  log(`❌ 未处理的错误: ${error.message}`, 'red');
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', () => {
  log('\n👋 演示脚本已退出', 'yellow');
  process.exit(0);
});

// 运行主函数
main().catch(error => {
  log(`❌ 演示失败: ${error.message}`, 'red');
  process.exit(1);
});