#!/usr/bin/env node

/**
 * SSE + xiaozhi-client 集成测试
 * 测试通过SSE方式接入xiaozhi-client的功能
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
// 使用动态导入来处理EventSource
let EventSource;
try {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  EventSource = require('eventsource');
} catch (error) {
  console.warn('无法加载EventSource模块:', error.message);
  EventSource = null;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SSEXiaozhiTest {
  constructor() {
    this.testResults = [];
    this.eventSource = null;
    this.receivedEvents = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'test': '🧪'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    this.log(`开始测试: ${name}`, 'test');
    try {
      await testFn();
      this.testResults.push({ name, status: 'PASS' });
      this.log(`测试通过: ${name}`, 'success');
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      this.log(`测试失败: ${name} - ${error.message}`, 'error');
    }
  }

  async testConfigFileExists() {
    const configPath = '/Users/luoyichang/newcode/xiaozhi.config.sse.json';
    if (!fs.existsSync(configPath)) {
      throw new Error('SSE配置文件不存在');
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.transport || config.transport !== 'sse') {
      throw new Error('配置文件中未启用SSE传输');
    }
    
    if (!config.sse || !config.sse.enabled) {
      throw new Error('配置文件中SSE未启用');
    }
  }

  async testSSEServerConnection() {
    // 检查SSE服务器是否可访问
    try {
      const response = await fetch('http://localhost:3000/health', {
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error(`SSE服务器响应错误: ${response.status}`);
      }
      
      const status = await response.json();
      if (!status.status || (status.status !== 'ok' && status.status !== 'healthy')) {
        throw new Error(`SSE服务器状态异常: ${JSON.stringify(status)}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到SSE服务器，请确保服务器正在运行');
      }
      throw error;
    }
  }

  async testSSEEventStream() {
    if (!EventSource) {
      throw new Error('EventSource模块未加载');
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.eventSource) {
          this.eventSource.close();
        }
        reject(new Error('SSE事件流连接超时'));
      }, 10000);

      this.eventSource = new EventSource('http://localhost:3000/events');
      
      this.eventSource.onopen = () => {
        clearTimeout(timeout);
        this.eventSource.close();
        resolve();
      };
      
      this.eventSource.onerror = (error) => {
        clearTimeout(timeout);
        this.eventSource.close();
        reject(new Error('SSE事件流连接失败'));
      };
    });
  }

  async testMCPOverSSE() {
    try {
      const response = await fetch('http://localhost:3000/api/tools', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`MCP请求失败: ${response.status}`);
      }

      const result = await response.json();
      if (!result.tools) {
        throw new Error('MCP响应格式错误');
      }

      const tools = result.tools;
      const expectedTools = ['start_game', 'add_idiom', 'get_hints', 'start_sse_server', 'get_sse_info'];
      
      for (const toolName of expectedTools) {
        if (!tools.find(tool => tool.name === toolName)) {
          throw new Error(`缺少工具: ${toolName}`);
        }
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到MCP服务器，请确保服务器正在运行');
      }
      throw error;
    }
  }

  async testSSEGameEvents() {
    if (!EventSource) {
      throw new Error('EventSource模块未加载');
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.eventSource) {
          this.eventSource.close();
        }
        reject(new Error('未收到游戏事件'));
      }, 15000);

      this.eventSource = new EventSource('http://localhost:3000/events');
      let gameEventReceived = false;
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.receivedEvents.push(data);
          
          if (data.type && data.type.includes('game')) {
            gameEventReceived = true;
            clearTimeout(timeout);
            this.eventSource.close();
            resolve();
          }
        } catch (error) {
          // 忽略非JSON消息
        }
      };
      
      this.eventSource.onerror = (error) => {
        clearTimeout(timeout);
        this.eventSource.close();
        reject(new Error('SSE事件流错误'));
      };

      // 发送一个游戏请求来触发事件
      setTimeout(async () => {
        try {
          await fetch('http://localhost:3000/api/call/start_game', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });
        } catch (error) {
          // 忽略错误，主要是为了触发事件
        }
      }, 2000);
    });
  }

  async testXiaozhiClientCompatibility() {
    // 检查xiaozhi-client是否已安装
    return new Promise((resolve, reject) => {
      const child = spawn('xiaozhi', ['--version'], { stdio: 'pipe' });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('xiaozhi-client未安装或版本不兼容'));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error('xiaozhi-client未安装'));
      });
      
      setTimeout(() => {
        child.kill();
        reject(new Error('xiaozhi-client版本检查超时'));
      }, 5000);
    });
  }

  async testSSEConfigValidation() {
    const configPath = '/Users/luoyichang/newcode/xiaozhi.config.sse.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // 验证必需的SSE配置
    const requiredFields = [
      'transport',
      'sse.enabled',
      'sse.port',
      'sse.host',
      'sse.endpoint'
    ];
    
    for (const field of requiredFields) {
      const keys = field.split('.');
      let value = config;
      
      for (const key of keys) {
        if (value[key] === undefined) {
          throw new Error(`配置缺少必需字段: ${field}`);
        }
        value = value[key];
      }
    }
    
    // 验证工具可见性
    if (!config.tools || !config.tools.visibility || !config.tools.visibility['idiom-chain']) {
      throw new Error('配置缺少工具可见性设置');
    }
    
    const toolVisibility = config.tools.visibility['idiom-chain'];
    if (!toolVisibility.start_sse_server || !toolVisibility.get_sse_info) {
      throw new Error('SSE相关工具未启用');
    }
  }

  async runAllTests() {
    this.log('开始SSE + xiaozhi-client集成测试', 'info');
    
    await this.test('SSE配置文件存在性检查', () => this.testConfigFileExists());
    await this.test('SSE配置验证', () => this.testSSEConfigValidation());
    await this.test('xiaozhi-client兼容性检查', () => this.testXiaozhiClientCompatibility());
    await this.test('SSE服务器连接测试', () => this.testSSEServerConnection());
    await this.test('SSE事件流连接测试', () => this.testSSEEventStream());
    await this.test('MCP over SSE测试', () => this.testMCPOverSSE());
    await this.test('SSE游戏事件测试', () => this.testSSEGameEvents());
  }

  printResults() {
    console.log('\n📊 测试结果汇总:');
    console.log('=' .repeat(50));
    
    let passed = 0;
    let failed = 0;
    
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.name}: ${status}`);
      
      if (result.status === 'PASS') {
        passed++;
      } else {
        failed++;
        if (result.error) {
          console.log(`   错误: ${result.error}`);
        }
      }
    });
    
    console.log('=' .repeat(50));
    console.log(`总计: ${this.testResults.length} 个测试`);
    console.log(`通过: ${passed} 个`);
    console.log(`失败: ${failed} 个`);
    console.log(`成功率: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (this.receivedEvents.length > 0) {
      console.log(`\n📨 收到的SSE事件: ${this.receivedEvents.length} 个`);
      this.receivedEvents.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.type || 'unknown'}: ${JSON.stringify(event).substring(0, 100)}...`);
      });
    }
    
    return failed === 0;
  }

  async cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// 主函数
async function main() {
  const tester = new SSEXiaozhiTest();
  
  try {
    await tester.runAllTests();
    const success = tester.printResults();
    
    if (success) {
      console.log('\n🎉 所有测试通过！SSE + xiaozhi-client集成正常工作。');
      process.exit(0);
    } else {
      console.log('\n⚠️ 部分测试失败，请检查配置和服务状态。');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// 处理命令行参数
if (process.argv[2] === 'help') {
  console.log(`
🧪 SSE + xiaozhi-client 集成测试

用法:
  node test-sse-xiaozhi.js        # 运行所有测试
  node test-sse-xiaozhi.js help   # 显示帮助

前置条件:
  1. 启动SSE服务器: npm run sse
  2. 安装xiaozhi-client: npm run xiaozhi-install
  3. 确保配置文件存在: xiaozhi.config.sse.json

测试内容:
  - SSE配置文件验证
  - xiaozhi-client兼容性
  - SSE服务器连接
  - SSE事件流
  - MCP over SSE
  - 游戏事件推送
`);
} else {
  main();
}

// 优雅退出
process.on('SIGINT', async () => {
  console.log('\n👋 收到退出信号...');
  process.exit(0);
});