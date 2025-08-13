import { startSSEServer } from '../src/sse-server.js';
import fetch from 'node-fetch';

// 简单的测试框架
function test(name, fn) {
  return new Promise(async (resolve) => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      resolve(true);
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      resolve(false);
    }
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// 等待函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('🧪 开始测试SSE功能...');
console.log('');

let server;
const PORT = 3001; // 使用不同端口避免冲突
const BASE_URL = `http://localhost:${PORT}`;

// 启动测试服务器
async function setupServer() {
  try {
    server = await startSSEServer(PORT);
    await sleep(1000); // 等待服务器完全启动
    console.log(`🚀 测试服务器已启动在端口 ${PORT}`);
    return true;
  } catch (error) {
    console.error('启动测试服务器失败:', error.message);
    return false;
  }
}

// 关闭测试服务器
function teardownServer() {
  if (server) {
    server.close();
    console.log('🛑 测试服务器已关闭');
  }
}

// API测试函数
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${BASE_URL}/api${endpoint}`, options);
  return await response.json();
}

// SSE连接测试
function testSSEConnection() {
  return new Promise((resolve, reject) => {
    const EventSource = require('eventsource');
    const eventSource = new EventSource(`${BASE_URL}/events`);
    
    let connectionEstablished = false;
    let eventsReceived = [];
    
    const timeout = setTimeout(() => {
      eventSource.close();
      if (!connectionEstablished) {
        reject(new Error('SSE连接超时'));
      } else {
        resolve(eventsReceived);
      }
    }, 5000);
    
    eventSource.onopen = () => {
      connectionEstablished = true;
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        eventsReceived.push(data);
        
        // 如果收到连接建立事件，测试完成
        if (data.type === 'connection_established') {
          clearTimeout(timeout);
          eventSource.close();
          resolve(eventsReceived);
        }
      } catch (error) {
        clearTimeout(timeout);
        eventSource.close();
        reject(new Error('解析SSE数据失败'));
      }
    };
    
    eventSource.onerror = () => {
      clearTimeout(timeout);
      eventSource.close();
      reject(new Error('SSE连接错误'));
    };
  });
}

// 运行所有测试
async function runTests() {
  const results = [];
  
  // 启动服务器
  const serverStarted = await setupServer();
  if (!serverStarted) {
    console.log('❌ 无法启动测试服务器，跳过SSE测试');
    return;
  }
  
  try {
    // 测试健康检查端点
    results.push(await test('健康检查端点', async () => {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      assert(data.status === 'healthy', '健康检查应该返回healthy状态');
      assert(data.connectedClients !== undefined, '应该包含连接客户端数量');
    }));
    
    // 测试游戏状态API
    results.push(await test('获取游戏状态API', async () => {
      const result = await apiRequest('/state');
      assert(result.success === true, 'API调用应该成功');
      assert(result.gameState !== undefined, '应该返回游戏状态');
      assert(result.gameState.gameStarted === false, '初始游戏状态应该是未开始');
    }));
    
    // 测试开始游戏API
    results.push(await test('开始游戏API', async () => {
      const result = await apiRequest('/start', 'POST', { firstIdiom: '一心一意' });
      assert(result.success === true, '开始游戏应该成功');
      assert(result.result.idiom === '一心一意', '应该使用指定的成语');
      assert(result.gameState.gameStarted === true, '游戏状态应该是已开始');
    }));
    
    // 测试添加成语API
    results.push(await test('添加成语API', async () => {
      const result = await apiRequest('/add-idiom', 'POST', { idiom: '意气风发' });
      assert(result.success === true, '添加成语应该成功');
      assert(result.result.idiom === '意气风发', '应该添加指定的成语');
      assert(result.gameState.chainLength === 2, '接龙链长度应该是2');
    }));
    
    // 测试获取提示API
    results.push(await test('获取提示API', async () => {
      const result = await apiRequest('/hints?limit=3');
      assert(result.success === true, '获取提示应该成功');
      assert(Array.isArray(result.hints), '提示应该是数组');
      assert(result.hints.length <= 3, '提示数量不应超过限制');
    }));
    
    // 测试AI自动接龙API
    results.push(await test('AI自动接龙API', async () => {
      const result = await apiRequest('/auto-play', 'POST');
      assert(result.success === true, 'AI自动接龙应该成功');
      assert(result.result.idiom, '应该返回AI选择的成语');
      assert(result.gameState.chainLength === 3, '接龙链长度应该是3');
    }));
    
    // 测试验证成语API
    results.push(await test('验证成语API', async () => {
      const result = await apiRequest('/validate', 'POST', { text: '一心一意' });
      assert(result.success === true, '验证成语应该成功');
      assert(result.isValid === true, '一心一意应该是有效成语');
      assert(result.idiomInfo !== null, '应该返回成语信息');
    }));
    
    // 测试获取随机成语API
    results.push(await test('获取随机成语API', async () => {
      const result = await apiRequest('/random-idiom');
      assert(result.success === true, '获取随机成语应该成功');
      assert(result.idiom.text, '应该返回成语文本');
      assert(result.idiom.pinyin, '应该返回成语拼音');
      assert(result.idiom.meaning, '应该返回成语含义');
    }));
    
    // 测试获取统计信息API
    results.push(await test('获取统计信息API', async () => {
      const result = await apiRequest('/stats');
      assert(result.success === true, '获取统计信息应该成功');
      assert(result.stats.totalIdioms >= 0, '总成语数应该大于等于0');
      assert(result.totalIdiomsInDatabase > 0, '数据库中应该有成语');
      assert(result.connectedClients >= 0, '连接客户端数应该大于等于0');
    }));
    
    // 测试重置游戏API
    results.push(await test('重置游戏API', async () => {
      const result = await apiRequest('/reset', 'POST');
      assert(result.success === true, '重置游戏应该成功');
      assert(result.gameState.gameStarted === false, '重置后游戏状态应该是未开始');
      assert(result.gameState.chainLength === 0, '重置后接龙链长度应该是0');
    }));
    
    // 测试SSE连接（需要额外的依赖）
    try {
      results.push(await test('SSE连接测试', async () => {
        const events = await testSSEConnection();
        assert(events.length > 0, '应该收到SSE事件');
        assert(events[0].type === 'connection_established', '第一个事件应该是连接建立');
      }));
    } catch (error) {
      console.log('⚠️  SSE连接测试跳过（需要eventsource依赖）');
    }
    
    // 测试错误处理
    results.push(await test('错误处理 - 无效成语', async () => {
      const result = await apiRequest('/add-idiom', 'POST', { idiom: '无效成语' });
      assert(result.success === false, '添加无效成语应该失败');
      assert(result.error, '应该返回错误信息');
    }));
    
    results.push(await test('错误处理 - 缺少参数', async () => {
      const result = await apiRequest('/add-idiom', 'POST', {});
      assert(result.success === false, '缺少参数应该失败');
      assert(result.error, '应该返回错误信息');
    }));
    
  } finally {
    teardownServer();
  }
  
  // 统计测试结果
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('');
  console.log(`🎉 SSE测试完成！通过 ${passed}/${total} 个测试`);
  console.log('');
  console.log('📝 测试覆盖的功能：');
  console.log('   - REST API接口');
  console.log('   - SSE连接和事件推送');
  console.log('   - 游戏状态同步');
  console.log('   - 错误处理');
  console.log('   - 健康检查');
  console.log('');
  
  if (passed === total) {
    console.log('✨ 所有SSE功能测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能');
  }
}

// 运行测试
runTests().catch(console.error);