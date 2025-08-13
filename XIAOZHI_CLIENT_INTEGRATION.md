# xiaozhi-client 对接指南

本文档详细说明如何使用现有的 `xiaozhi-client` 对接成语接龙MCP应用。

## 📋 前置条件

### 1. 安装 xiaozhi-client

```bash
# 全局安装
npm install -g xiaozhi-client

# 或本地安装
npm install xiaozhi-client
```

### 2. 确认版本兼容性

```bash
xiaozhi-client --version
```

要求版本 >= 1.0.0

## 🚀 快速对接

### 方式一：标准MCP对接

1. **启动成语接龙MCP服务器**
   ```bash
   npm run start
   ```

2. **使用xiaozhi-client连接**
   ```bash
   xiaozhi-client --config xiaozhi.config.example.json
   ```

### 方式二：SSE实时对接（推荐）

1. **启动SSE服务器**
   ```bash
   npm run sse
   ```

2. **使用xiaozhi-client SSE模式**
   ```bash
   xiaozhi-client --config xiaozhi.config.sse.json
   ```

## ⚙️ 配置文件详解

### 标准MCP配置 (xiaozhi.config.example.json)

```json
{
  "mcpServers": {
    "idiom-chain": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "./",
      "env": {}
    }
  },
  "clientInfo": {
    "name": "xiaozhi-idiom-chain",
    "version": "1.0.0"
  },
  "capabilities": {
    "tools": {
      "listChanged": true
    }
  }
}
```

### SSE配置 (xiaozhi.config.sse.json)

```json
{
  "transport": {
    "type": "sse",
    "endpoint": "http://localhost:3000",
    "events": "/events",
    "api": "/api"
  },
  "clientInfo": {
    "name": "xiaozhi-idiom-chain-sse",
    "version": "1.0.0"
  },
  "capabilities": {
    "tools": {
      "listChanged": true
    },
    "realtime": {
      "events": true,
      "notifications": true
    }
  }
}
```

## 🔧 高级配置

### 1. 自定义端口

**修改SSE服务器端口:**
```bash
PORT=3001 npm run sse
```

**更新配置文件:**
```json
{
  "transport": {
    "endpoint": "http://localhost:3001"
  }
}
```

### 2. 环境变量配置

```bash
# 设置调试模式
export DEBUG=xiaozhi-client:*

# 设置日志级别
export LOG_LEVEL=debug

# 启动客户端
xiaozhi-client --config xiaozhi.config.sse.json
```

### 3. 代理配置

```json
{
  "transport": {
    "type": "sse",
    "endpoint": "http://localhost:3000",
    "proxy": {
      "host": "proxy.example.com",
      "port": 8080,
      "auth": {
        "username": "user",
        "password": "pass"
      }
    }
  }
}
```

## 📡 实时功能

### SSE事件监听

xiaozhi-client 会自动监听以下事件：

- `game_started` - 游戏开始
- `idiom_added` - 成语添加
- `auto_play` - AI自动接龙
- `game_reset` - 游戏重置
- `hints_provided` - 提示提供
- `error` - 错误事件

### 事件处理示例

```javascript
// xiaozhi-client 内部事件处理
client.on('gameEvent', (event) => {
  console.log('收到游戏事件:', event.type);
  console.log('事件数据:', event.data);
});
```

## 🛠️ 工具调用

### 可用工具列表

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| `start_game` | 开始新游戏 | `firstIdiom?` (可选) |
| `add_idiom` | 添加成语 | `idiom` (必需) |
| `get_hints` | 获取提示 | 无 |
| `get_game_state` | 获取游戏状态 | 无 |
| `auto_play` | AI自动接龙 | 无 |
| `reset_game` | 重置游戏 | 无 |
| `validate_idiom` | 验证成语 | `idiom` (必需) |
| `get_random_idiom` | 获取随机成语 | 无 |
| `get_stats` | 获取统计信息 | 无 |
| `start_sse_server` | 启动SSE服务器 | `port?` (可选) |
| `get_sse_info` | 获取SSE信息 | 无 |

### 调用示例

```bash
# 通过xiaozhi-client调用工具
xiaozhi-client call start_game
xiaozhi-client call add_idiom --idiom "一心一意"
xiaozhi-client call auto_play
```

## 🔍 监控和调试

### 1. 连接状态检查

```bash
# 检查xiaozhi-client状态
xiaozhi-client status

# 检查MCP服务器状态
curl http://localhost:3000/health
```

### 2. 日志查看

```bash
# 启用详细日志
DEBUG=* xiaozhi-client --config xiaozhi.config.sse.json

# 只显示xiaozhi相关日志
DEBUG=xiaozhi:* xiaozhi-client --config xiaozhi.config.sse.json
```

### 3. 事件流监控

```bash
# 直接监听SSE事件流
curl -N http://localhost:3000/events

# 使用项目提供的监控脚本
npm run xiaozhi-sse-events
```

## 🚨 故障排除

### 常见问题

#### 1. 连接失败

**问题:** `ECONNREFUSED`

**解决方案:**
```bash
# 确认服务器正在运行
npm run sse

# 检查端口是否被占用
lsof -i :3000
```

#### 2. 工具调用失败

**问题:** `Tool not found`

**解决方案:**
```bash
# 检查工具列表
curl http://localhost:3000/api/tools

# 重启服务器
npm run sse
```

#### 3. SSE事件丢失

**问题:** 事件不能实时接收

**解决方案:**
```bash
# 检查SSE连接
curl -N http://localhost:3000/events

# 重新连接客户端
xiaozhi-client restart
```

### 错误代码对照

| 错误代码 | 描述 | 解决方案 |
|---------|------|----------|
| `CONN_001` | 连接超时 | 检查网络和服务器状态 |
| `AUTH_002` | 认证失败 | 检查配置文件中的认证信息 |
| `TOOL_003` | 工具不存在 | 检查工具名称拼写 |
| `PARAM_004` | 参数错误 | 检查工具参数格式 |
| `SSE_005` | SSE连接断开 | 重新启动SSE服务器 |

## 📈 性能优化

### 1. 连接池配置

```json
{
  "transport": {
    "pool": {
      "maxConnections": 10,
      "keepAlive": true,
      "timeout": 30000
    }
  }
}
```

### 2. 缓存配置

```json
{
  "cache": {
    "tools": {
      "ttl": 300000,
      "maxSize": 100
    },
    "responses": {
      "ttl": 60000,
      "maxSize": 50
    }
  }
}
```

### 3. 批量操作

```bash
# 批量调用工具
xiaozhi-client batch --file commands.json
```

## 🔐 安全配置

### 1. HTTPS配置

```json
{
  "transport": {
    "endpoint": "https://localhost:3443",
    "ssl": {
      "cert": "./certs/server.crt",
      "key": "./certs/server.key",
      "ca": "./certs/ca.crt"
    }
  }
}
```

### 2. 认证配置

```json
{
  "auth": {
    "type": "bearer",
    "token": "your-api-token"
  }
}
```

### 3. 访问控制

```json
{
  "security": {
    "allowedOrigins": ["http://localhost:3000"],
    "allowedMethods": ["GET", "POST"],
    "rateLimit": {
      "requests": 100,
      "window": 60000
    }
  }
}
```

## 📚 API参考

### xiaozhi-client CLI命令

```bash
# 基本命令
xiaozhi-client --help
xiaozhi-client --version
xiaozhi-client --config <config-file>

# 工具操作
xiaozhi-client list-tools
xiaozhi-client call <tool-name> [args]
xiaozhi-client describe <tool-name>

# 连接管理
xiaozhi-client connect
xiaozhi-client disconnect
xiaozhi-client status
xiaozhi-client restart

# 调试命令
xiaozhi-client debug
xiaozhi-client logs
xiaozhi-client test-connection
```

### 编程接口

```javascript
const { XiaozhiClient } = require('xiaozhi-client');

// 创建客户端
const client = new XiaozhiClient({
  config: './xiaozhi.config.sse.json'
});

// 连接
await client.connect();

// 调用工具
const result = await client.callTool('start_game');

// 监听事件
client.on('gameEvent', (event) => {
  console.log('游戏事件:', event);
});

// 断开连接
await client.disconnect();
```

## 🎯 最佳实践

### 1. 配置管理

- 使用环境变量管理敏感配置
- 为不同环境创建不同的配置文件
- 定期备份配置文件

### 2. 错误处理

- 实现重试机制
- 记录详细的错误日志
- 设置合理的超时时间

### 3. 监控告警

- 监控连接状态
- 设置性能指标告警
- 定期检查服务健康状态

### 4. 版本管理

- 保持xiaozhi-client版本更新
- 测试新版本兼容性
- 记录版本变更日志

## 📞 技术支持

如果在对接过程中遇到问题，可以通过以下方式获取帮助：

1. **查看日志**: 启用详细日志模式排查问题
2. **检查文档**: 参考本文档和xiaozhi-client官方文档
3. **运行测试**: 使用 `npm run test-sse-xiaozhi` 验证功能
4. **社区支持**: 在相关技术社区寻求帮助

---

*最后更新: 2024年12月*