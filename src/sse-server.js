import express from 'express';
import cors from 'cors';
import { IdiomChainGame } from './game.js';
import { idioms, isValidIdiom, getRandomIdiom } from './idioms.js';
import { EventEmitter } from 'events';

// 创建事件发射器用于游戏状态通知
class GameEventEmitter extends EventEmitter {}
const gameEvents = new GameEventEmitter();

// 扩展游戏类以支持事件发射
class SSEIdiomChainGame extends IdiomChainGame {
  constructor(eventEmitter) {
    // 必须先调用父类构造函数
    super();
    // 然后初始化EventEmitter
    this.eventEmitter = eventEmitter || new EventEmitter();
  }

  start(firstIdiom = null) {
    const result = super.start(firstIdiom);
    if (this.eventEmitter) {
      this.eventEmitter.emit('gameEvent', {
        type: 'game_started',
        data: {
          result,
          gameState: this.getGameState(),
          timestamp: new Date().toISOString()
        }
      });
    }
    return result;
  }

  addIdiom(idiom) {
    const result = super.addIdiom(idiom);
    if (this.eventEmitter) {
      this.eventEmitter.emit('gameEvent', {
        type: 'idiom_added',
        data: {
          result,
          gameState: this.getGameState(),
          timestamp: new Date().toISOString()
        }
      });
    }
    return result;
  }

  autoPlay() {
    const result = super.autoPlay();
    if (this.eventEmitter) {
      this.eventEmitter.emit('gameEvent', {
        type: 'auto_play',
        data: {
          result,
          gameState: this.getGameState(),
          timestamp: new Date().toISOString()
        }
      });
    }
    return result;
  }

  reset() {
    super.reset();
    if (this.eventEmitter) {
      this.eventEmitter.emit('gameEvent', {
        type: 'game_reset',
        data: {
          gameState: this.getGameState(),
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // 发送提示事件
  emitHints(hints) {
    this.eventEmitter.emit('gameEvent', {
      type: 'hints_provided',
      data: {
        hints,
        currentChar: this.currentChar,
        timestamp: new Date().toISOString()
      }
    });
  }

  // 发送错误事件
  emitError(error, context = {}) {
    this.eventEmitter.emit('gameEvent', {
      type: 'error',
      data: {
        error: error.message,
        context,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// 创建支持SSE的游戏实例
const sseGame = new SSEIdiomChainGame(gameEvents);

// 创建Express应用
const app = express();
app.use(cors());
app.use(express.json());

// 存储SSE连接
const sseClients = new Set();

// SSE端点
app.get('/events', (req, res) => {
  // 设置SSE头部
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // 发送初始连接消息
  const welcomeData = {
    type: 'connection_established',
    data: {
      message: '成语接龙SSE连接已建立',
      gameState: sseGame.getGameState(),
      timestamp: new Date().toISOString()
    }
  };
  res.write(`data: ${JSON.stringify(welcomeData)}\n\n`);

  // 添加客户端到连接集合
  sseClients.add(res);

  // 监听游戏事件
  const eventHandler = (eventData) => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    }
  };
  gameEvents.on('gameEvent', eventHandler);

  // 处理客户端断开连接
  req.on('close', () => {
    sseClients.delete(res);
    gameEvents.removeListener('gameEvent', eventHandler);
  });

  // 发送心跳
  const heartbeat = setInterval(() => {
    if (!res.destroyed) {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        data: { timestamp: new Date().toISOString() }
      })}\n\n`);
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // 每30秒发送一次心跳

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// REST API端点

// 开始游戏
app.post('/api/start', (req, res) => {
  try {
    const { firstIdiom } = req.body;
    const result = sseGame.start(firstIdiom);
    res.json({ success: true, result, gameState: sseGame.getGameState() });
  } catch (error) {
    sseGame.emitError(error, { action: 'start_game', input: req.body });
    res.status(400).json({ success: false, error: error.message });
  }
});

// 添加成语
app.post('/api/add-idiom', (req, res) => {
  try {
    const { idiom } = req.body;
    if (!idiom) {
      throw new Error('缺少必需参数: idiom');
    }
    const result = sseGame.addIdiom(idiom);
    res.json({ success: true, result, gameState: sseGame.getGameState() });
  } catch (error) {
    sseGame.emitError(error, { action: 'add_idiom', input: req.body });
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取提示
app.get('/api/hints', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const hints = sseGame.getHints(limit);
    sseGame.emitHints(hints);
    res.json({ success: true, hints, currentChar: sseGame.currentChar });
  } catch (error) {
    sseGame.emitError(error, { action: 'get_hints', input: req.query });
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取游戏状态
app.get('/api/state', (req, res) => {
  try {
    const gameState = sseGame.getGameState();
    res.json({ success: true, gameState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI自动接龙
app.post('/api/auto-play', (req, res) => {
  try {
    const result = sseGame.autoPlay();
    res.json({ success: true, result, gameState: sseGame.getGameState() });
  } catch (error) {
    sseGame.emitError(error, { action: 'auto_play' });
    res.status(400).json({ success: false, error: error.message });
  }
});

// 重置游戏
app.post('/api/reset', (req, res) => {
  try {
    sseGame.reset();
    res.json({ success: true, gameState: sseGame.getGameState() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 验证成语
app.post('/api/validate', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      throw new Error('缺少必需参数: text');
    }
    const isValid = isValidIdiom(text);
    const idiomInfo = isValid ? idioms.find(i => i.text === text) : null;
    res.json({ success: true, isValid, idiomInfo, text });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 获取随机成语
app.get('/api/random-idiom', (req, res) => {
  try {
    const randomIdiom = getRandomIdiom();
    res.json({ success: true, idiom: randomIdiom });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取统计信息
app.get('/api/stats', (req, res) => {
  try {
    const stats = sseGame.getStats();
    res.json({ 
      success: true, 
      stats, 
      totalIdiomsInDatabase: idioms.length,
      connectedClients: sseClients.size
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// MCP兼容的工具列表端点
app.get('/api/tools', (req, res) => {
  res.json({
    tools: [
      { name: 'start_game', description: '开始新游戏' },
      { name: 'add_idiom', description: '添加成语' },
      { name: 'get_hints', description: '获取提示' },
      { name: 'get_game_state', description: '获取游戏状态' },
      { name: 'auto_play', description: 'AI自动接龙' },
      { name: 'reset_game', description: '重置游戏' },
      { name: 'validate_idiom', description: '验证成语' },
      { name: 'get_random_idiom', description: '获取随机成语' },
      { name: 'get_stats', description: '获取统计信息' },
      { name: 'start_sse_server', description: '启动SSE服务器' },
      { name: 'get_sse_info', description: '获取SSE信息' }
    ]
  });
});

// MCP兼容的工具调用端点
app.post('/api/call/:toolName', (req, res) => {
  const { toolName } = req.params;
  const { arguments: args = {} } = req.body;

  try {
    let result;
    switch (toolName) {
      case 'start_game':
        result = sseGame.start(args.firstIdiom);
        break;
      case 'add_idiom':
        result = sseGame.addIdiom(args.idiom);
        break;
      case 'get_hints':
        result = sseGame.getHints();
        break;
      case 'get_game_state':
        result = sseGame.getGameState();
        break;
      case 'auto_play':
        result = sseGame.autoPlay();
        break;
      case 'reset_game':
        sseGame.reset();
        result = { success: true, message: '游戏已重置' };
        break;
      case 'validate_idiom':
        result = { valid: isValidIdiom(args.idiom), idiom: args.idiom };
        break;
      case 'get_random_idiom':
        result = { idiom: getRandomIdiom() };
        break;
      case 'get_stats':
        result = sseGame.getStats();
        break;
      case 'start_sse_server':
        result = { message: 'SSE服务器已在运行', port: 3000 };
        break;
      case 'get_sse_info':
        result = {
          sseEndpoint: 'http://localhost:3000/events',
          apiEndpoint: 'http://localhost:3000/api',
          healthEndpoint: 'http://localhost:3000/health',
          connectedClients: sseClients.size
        };
        break;
      default:
        return res.status(404).json({ error: `未知工具: ${toolName}` });
    }
    
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connectedClients: sseClients.size,
    gameState: sseGame.getGameState()
  });
});

// 静态文件服务（用于演示页面）
app.use(express.static('public'));

// 导出游戏实例和事件发射器（供MCP服务器使用）
export { sseGame, gameEvents };

// 启动SSE服务器
export function startSSEServer(port = 3000) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`成语接龙SSE服务器已启动，端口: ${port}`);
        console.log(`SSE端点: http://localhost:${port}/events`);
        console.log(`API端点: http://localhost:${port}/api/*`);
        console.log(`健康检查: http://localhost:${port}/health`);
        resolve(server);
      }
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，正在关闭SSE服务器...');
      server.close(() => {
        console.log('SSE服务器已关闭');
        process.exit(0);
      });
    });
  });
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startSSEServer().catch(console.error);
}