#!/usr/bin/env node

/**
 * xiaozhi-client 使用示例
 * 展示如何使用 xiaozhi-client 连接成语接龙MCP应用
 */

// 注意：这是一个示例脚本，实际使用需要安装 xiaozhi-client
// npm install xiaozhi-client

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 检查 xiaozhi-client 是否已安装
function checkXiaozhiClient() {
  return new Promise((resolve) => {
    const child = spawn('xiaozhi-client', ['--version'], { stdio: 'pipe' });
    
    child.on('close', (code) => {
      resolve(code === 0);
    });
    
    child.on('error', () => {
      resolve(false);
    });
  });
}

// 检查配置文件是否存在
function checkConfigFiles() {
  const configs = [
    'xiaozhi.config.example.json',
    'xiaozhi.config.sse.json'
  ];
  
  const results = {};
  
  for (const config of configs) {
    const configPath = join(__dirname, config);
    results[config] = fs.existsSync(configPath);
  }
  
  return results;
}

// 启动MCP服务器
function startMCPServer() {
  return new Promise((resolve, reject) => {
    log('🚀 启动MCP服务器...', 'blue');
    
    const child = spawn('npm', ['run', 'start'], {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('MCP服务器已启动')) {
        log('✅ MCP服务器启动成功', 'green');
        resolve(child);
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP服务器启动失败，退出码: ${code}`));
      }
    });
    
    // 超时处理
    setTimeout(() => {
      if (!child.killed) {
        log('⚠️ MCP服务器启动超时，但可能仍在运行', 'yellow');
        resolve(child);
      }
    }, 10000);
  });
}

// 启动SSE服务器
function startSSEServer() {
  return new Promise((resolve, reject) => {
    log('🌐 启动SSE服务器...', 'blue');
    
    const child = spawn('npm', ['run', 'sse'], {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('SSE服务器已启动')) {
        log('✅ SSE服务器启动成功', 'green');
        resolve(child);
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`SSE服务器启动失败，退出码: ${code}`));
      }
    });
    
    // 超时处理
    setTimeout(() => {
      if (!child.killed) {
        log('⚠️ SSE服务器启动超时，但可能仍在运行', 'yellow');
        resolve(child);
      }
    }, 5000);
  });
}

// 使用 xiaozhi-client 连接（标准模式）
function connectStandardMode() {
  return new Promise((resolve, reject) => {
    log('🔗 使用标准模式连接 xiaozhi-client...', 'cyan');
    
    const configPath = join(__dirname, 'xiaozhi.config.example.json');
    const child = spawn('xiaozhi-client', ['--config', configPath], {
      stdio: 'pipe'
    });
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('连接成功') || output.includes('Connected')) {
        log('✅ xiaozhi-client 标准模式连接成功', 'green');
        resolve(child);
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`xiaozhi-client 连接失败，退出码: ${code}`));
      }
    });
    
    // 超时处理
    setTimeout(() => {
      if (!child.killed) {
        log('⚠️ xiaozhi-client 连接超时', 'yellow');
        resolve(child);
      }
    }, 15000);
  });
}

// 使用 xiaozhi-client 连接（SSE模式）
function connectSSEMode() {
  return new Promise((resolve, reject) => {
    log('🔗 使用SSE模式连接 xiaozhi-client...', 'cyan');
    
    const configPath = join(__dirname, 'xiaozhi.config.sse.json');
    const child = spawn('xiaozhi-client', ['--config', configPath], {
      stdio: 'pipe'
    });
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('连接成功') || output.includes('Connected')) {
        log('✅ xiaozhi-client SSE模式连接成功', 'green');
        resolve(child);
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`xiaozhi-client SSE连接失败，退出码: ${code}`));
      }
    });
    
    // 超时处理
    setTimeout(() => {
      if (!child.killed) {
        log('⚠️ xiaozhi-client SSE连接超时', 'yellow');
        resolve(child);
      }
    }, 15000);
  });
}

// 测试工具调用
function testToolCalls() {
  return new Promise((resolve) => {
    log('🧪 测试工具调用...', 'blue');
    
    const tools = [
      { name: 'start_game', args: [] },
      { name: 'get_game_state', args: [] },
      { name: 'add_idiom', args: ['--idiom', '一心一意'] },
      { name: 'auto_play', args: [] },
      { name: 'get_hints', args: [] },
      { name: 'get_stats', args: [] }
    ];
    
    let completed = 0;
    
    tools.forEach((tool, index) => {
      setTimeout(() => {
        log(`📞 调用工具: ${tool.name}`, 'yellow');
        
        const child = spawn('xiaozhi-client', ['call', tool.name, ...tool.args], {
          stdio: 'pipe'
        });
        
        child.stdout.on('data', (data) => {
          console.log(`   结果: ${data.toString().trim()}`);
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            log(`   ✅ ${tool.name} 调用成功`, 'green');
          } else {
            log(`   ❌ ${tool.name} 调用失败`, 'red');
          }
          
          completed++;
          if (completed === tools.length) {
            resolve();
          }
        });
      }, index * 2000); // 每2秒调用一个工具
    });
  });
}

// 清理进程
function cleanup(processes) {
  log('🧹 清理进程...', 'yellow');
  
  processes.forEach(proc => {
    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
    }
  });
  
  setTimeout(() => {
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill('SIGKILL');
      }
    });
  }, 5000);
}

// 主函数
async function main() {
  const processes = [];
  
  try {
    log('🎯 xiaozhi-client 使用示例开始', 'green');
    log('=' .repeat(50), 'blue');
    
    // 1. 检查 xiaozhi-client
    log('\n1️⃣ 检查 xiaozhi-client 安装状态...', 'blue');
    const clientInstalled = await checkXiaozhiClient();
    
    if (!clientInstalled) {
      log('❌ xiaozhi-client 未安装', 'red');
      log('💡 请先安装: npm install -g xiaozhi-client', 'yellow');
      log('\n📖 安装指南:', 'blue');
      log('   1. 全局安装: npm install -g xiaozhi-client', 'cyan');
      log('   2. 本地安装: npm install xiaozhi-client', 'cyan');
      log('   3. 验证安装: xiaozhi-client --version', 'cyan');
      return;
    }
    
    log('✅ xiaozhi-client 已安装', 'green');
    
    // 2. 检查配置文件
    log('\n2️⃣ 检查配置文件...', 'blue');
    const configs = checkConfigFiles();
    
    for (const [config, exists] of Object.entries(configs)) {
      if (exists) {
        log(`✅ ${config} 存在`, 'green');
      } else {
        log(`❌ ${config} 不存在`, 'red');
      }
    }
    
    // 3. 选择演示模式
    const mode = process.argv[2] || 'sse';
    
    if (mode === 'standard') {
      log('\n3️⃣ 演示标准MCP模式...', 'blue');
      
      if (!configs['xiaozhi.config.example.json']) {
        log('❌ 标准模式配置文件不存在', 'red');
        return;
      }
      
      // 启动MCP服务器
      const mcpServer = await startMCPServer();
      processes.push(mcpServer);
      
      // 等待服务器稳定
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 连接 xiaozhi-client
      const client = await connectStandardMode();
      processes.push(client);
      
    } else if (mode === 'sse') {
      log('\n3️⃣ 演示SSE模式...', 'blue');
      
      if (!configs['xiaozhi.config.sse.json']) {
        log('❌ SSE模式配置文件不存在', 'red');
        return;
      }
      
      // 启动SSE服务器
      const sseServer = await startSSEServer();
      processes.push(sseServer);
      
      // 等待服务器稳定
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 连接 xiaozhi-client
      const client = await connectSSEMode();
      processes.push(client);
      
    } else {
      log(`❌ 未知模式: ${mode}`, 'red');
      log('💡 支持的模式: standard, sse', 'yellow');
      return;
    }
    
    // 4. 测试工具调用
    log('\n4️⃣ 测试工具调用...', 'blue');
    await testToolCalls();
    
    log('\n✅ 演示完成！', 'green');
    log('\n💡 提示:', 'blue');
    log('   - 使用 Ctrl+C 退出', 'cyan');
    log('   - 查看日志了解详细信息', 'cyan');
    log('   - 参考 XIAOZHI_CLIENT_INTEGRATION.md 获取更多信息', 'cyan');
    
    // 保持运行
    log('\n⏳ 保持连接运行中... (按 Ctrl+C 退出)', 'yellow');
    
  } catch (error) {
    log(`❌ 演示失败: ${error.message}`, 'red');
  } finally {
    // 设置退出处理
    process.on('SIGINT', () => {
      log('\n👋 正在退出...', 'yellow');
      cleanup(processes);
      setTimeout(() => process.exit(0), 2000);
    });
    
    process.on('SIGTERM', () => {
      cleanup(processes);
      process.exit(0);
    });
  }
}

// 显示帮助信息
function showHelp() {
  log('📖 xiaozhi-client 使用示例', 'green');
  log('=' .repeat(40), 'blue');
  log('\n用法:', 'blue');
  log('  node example-xiaozhi-client.js [mode]', 'cyan');
  log('\n模式:', 'blue');
  log('  standard  - 标准MCP模式演示', 'cyan');
  log('  sse       - SSE模式演示 (默认)', 'cyan');
  log('\n示例:', 'blue');
  log('  node example-xiaozhi-client.js sse', 'cyan');
  log('  node example-xiaozhi-client.js standard', 'cyan');
  log('\n前置条件:', 'blue');
  log('  1. 安装 xiaozhi-client: npm install -g xiaozhi-client', 'cyan');
  log('  2. 确保配置文件存在', 'cyan');
  log('  3. 确保端口 3000 可用', 'cyan');
}

// 检查命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 运行主函数
main().catch(error => {
  log(`❌ 程序异常: ${error.message}`, 'red');
  process.exit(1);
});