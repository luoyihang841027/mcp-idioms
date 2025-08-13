#!/usr/bin/env node

/**
 * SSE成语接龙演示脚本
 * 展示如何通过Server-Sent Events实时监控游戏状态
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const EventSource = require('eventsource');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SSEDemo {
  constructor() {
    this.mcpProcess = null;
    this.sseProcess = null;
    this.eventSource = null;
    this.gameEvents = [];
  }

  async startServices() {
    console.log('🚀 启动SSE演示...');
    
    // 启动MCP服务器
    console.log('📡 启动MCP服务器...');
    this.mcpProcess = spawn('node', ['src/index.js'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    // 等待MCP服务器启动
    await this.sleep(2000);

    // 启动SSE服务器
    console.log('🌐 启动SSE服务器...');
    this.sseProcess = spawn('node', ['src/sse-server.js'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    // 等待SSE服务器启动
    await this.sleep(3000);

    console.log('✅ 服务启动完成');
  }

  async connectSSE() {
    console.log('🔗 连接到SSE事件流...');
    
    this.eventSource = new EventSource('http://localhost:3000/events');
    
    this.eventSource.onopen = () => {
      console.log('✅ SSE连接已建立');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleGameEvent(data);
      } catch (error) {
        console.log('📨 收到消息:', event.data);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ SSE连接错误:', error);
    };

    // 监听特定事件类型
    this.eventSource.addEventListener('game_state', (event) => {
      const data = JSON.parse(event.data);
      console.log('🎮 游戏状态更新:', data);
    });

    this.eventSource.addEventListener('new_idiom', (event) => {
      const data = JSON.parse(event.data);
      console.log('📝 新成语:', data.idiom);
    });

    this.eventSource.addEventListener('hints', (event) => {
      const data = JSON.parse(event.data);
      console.log('💡 提示:', data.hints.join(', '));
    });
  }

  handleGameEvent(data) {
    this.gameEvents.push({
      timestamp: new Date().toISOString(),
      ...data
    });

    switch (data.type) {
      case 'game_started':
        console.log('🎯 游戏开始! 第一个成语:', data.firstIdiom);
        break;
      case 'idiom_added':
        console.log('✨ 成语接龙:', data.idiom, '(得分:', data.score, ')');
        break;
      case 'hint_requested':
        console.log('🤔 请求提示，可能的成语:', data.hints.join(', '));
        break;
      case 'game_reset':
        console.log('🔄 游戏重置');
        break;
      case 'auto_play':
        console.log('🤖 AI自动接龙:', data.idiom);
        break;
      default:
        console.log('📊 事件:', data);
    }
  }

  async sendMCPRequest(method, params = {}) {
    try {
      const response = await fetch('http://localhost:3001/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: `tools/call`,
          params: {
            name: method,
            arguments: params
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ MCP请求失败:', error.message);
      return null;
    }
  }

  async demonstrateGame() {
    console.log('\n🎮 开始游戏演示...');
    
    // 等待连接稳定
    await this.sleep(2000);

    // 1. 开始游戏
    console.log('\n1️⃣ 开始新游戏...');
    await this.sendMCPRequest('start_game');
    await this.sleep(2000);

    // 2. 添加成语
    console.log('\n2️⃣ 添加成语...');
    await this.sendMCPRequest('add_idiom', { idiom: '意气风发' });
    await this.sleep(2000);

    // 3. 获取提示
    console.log('\n3️⃣ 获取提示...');
    await this.sendMCPRequest('get_hints', { limit: 3 });
    await this.sleep(2000);

    // 4. AI自动接龙
    console.log('\n4️⃣ AI自动接龙...');
    await this.sendMCPRequest('auto_play');
    await this.sleep(2000);

    // 5. 查看游戏状态
    console.log('\n5️⃣ 查看游戏状态...');
    await this.sendMCPRequest('get_game_state');
    await this.sleep(2000);

    // 6. 获取统计信息
    console.log('\n6️⃣ 获取统计信息...');
    await this.sendMCPRequest('get_stats');
    await this.sleep(2000);
  }

  async showEventSummary() {
    console.log('\n📊 事件汇总:');
    console.log(`总共收到 ${this.gameEvents.length} 个事件`);
    
    const eventTypes = {};
    this.gameEvents.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    console.log('事件类型统计:');
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} 次`);
    });

    if (this.gameEvents.length > 0) {
      console.log('\n最近的事件:');
      this.gameEvents.slice(-3).forEach(event => {
        console.log(`  ${event.timestamp}: ${event.type}`);
      });
    }
  }

  async cleanup() {
    console.log('\n🧹 清理资源...');
    
    if (this.eventSource) {
      this.eventSource.close();
      console.log('✅ SSE连接已关闭');
    }

    if (this.sseProcess) {
      this.sseProcess.kill();
      console.log('✅ SSE服务器已停止');
    }

    if (this.mcpProcess) {
      this.mcpProcess.kill();
      console.log('✅ MCP服务器已停止');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async run() {
    try {
      await this.startServices();
      await this.connectSSE();
      await this.demonstrateGame();
      await this.showEventSummary();
    } catch (error) {
      console.error('❌ 演示过程中出错:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// 处理命令行参数
const command = process.argv[2];

switch (command) {
  case 'monitor':
    console.log('🔍 启动SSE事件监控模式...');
    const eventSource = new EventSource('http://localhost:3000/events');
    eventSource.onmessage = (event) => {
      console.log('📨', new Date().toLocaleTimeString(), event.data);
    };
    eventSource.onerror = (error) => {
      console.error('❌ 连接错误，请确保SSE服务器正在运行');
      process.exit(1);
    };
    break;

  case 'status':
    console.log('📊 检查SSE服务状态...');
    try {
      const response = await fetch('http://localhost:3000/status');
      const status = await response.json();
      console.log('✅ SSE服务状态:', status);
    } catch (error) {
      console.error('❌ 无法连接到SSE服务器');
    }
    break;

  case 'test':
    console.log('🧪 运行SSE功能测试...');
    const demo = new SSEDemo();
    await demo.run();
    break;

  default:
    console.log(`
🌐 SSE成语接龙演示脚本

用法:
  node demo-sse.js test     # 运行完整演示
  node demo-sse.js monitor  # 监控SSE事件流
  node demo-sse.js status   # 检查服务状态

示例:
  # 启动SSE服务器
  npm run sse
  
  # 在另一个终端运行演示
  node demo-sse.js test
`);
}

// 优雅退出处理
process.on('SIGINT', () => {
  console.log('\n👋 收到退出信号，正在清理...');
  process.exit(0);
});