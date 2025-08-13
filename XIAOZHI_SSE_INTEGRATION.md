# 小智(Xiaozhi) SSE接入指南

本指南详细说明如何通过Server-Sent Events (SSE)方式将成语接龙MCP应用接入到小智系统。

## 🌟 SSE接入优势

### 为什么选择SSE传输？
- **实时性**: 支持服务器主动推送，实现真正的实时通信
- **轻量级**: 相比WebSocket更轻量，适合单向数据流
- **稳定性**: 自动重连机制，网络中断后自动恢复
- **兼容性**: 基于HTTP协议，防火墙友好
- **调试友好**: 可以直接在浏览器中查看事件流

### 适用场景
- 需要实时游戏状态推送
- 多人协作成语接龙
- 实时提示和建议
- 游戏进度监控

## 🚀 快速开始

### 1. 安装xiaozhi-client
```bash
npm install -g xiaozhi-client
```

### 2. 获取小智接入点
1. 访问 [xiaozhi.me](https://xiaozhi.me)
2. 登录您的账户
3. 获取设备的接入点地址（格式：`wss://api.xiaozhi.me/v1/mcp/xxx`）

### 3. 配置SSE传输
复制SSE配置模板：
```bash
cp xiaozhi.config.sse.json xiaozhi.config.json
```

编辑配置文件：
```json
{
  "mcpEndpoint": "你的小智接入点地址",
  "transport": "sse",
  "mcpServers": {
    "idiom-chain": {
      "transport": "sse",
      "sseConfig": {
        "port": 3001,
        "host": "localhost",
        "endpoint": "/events",
        "autoStart": true
      }
    }
  },
  "sse": {
    "enabled": true,
    "port": 3001,
    "host": "localhost",
    "endpoint": "/events"
  }
}
```

### 4. 启动服务
```bash
# 启动xiaozhi-client (SSE模式)
xiaozhi start

# 或者使用项目脚本
npm run xiaozhi-sse
```

## 🔧 详细配置

### SSE服务器配置
```json
{
  "sse": {
    "enabled": true,
    "port": 3001,
    "host": "localhost",
    "endpoint": "/events",
    "cors": {
      "origin": "*",
      "methods": ["GET", "POST", "OPTIONS"],
      "allowedHeaders": ["Content-Type", "Authorization"]
    },
    "heartbeat": {
      "enabled": true,
      "interval": 30000
    },
    "reconnect": {
      "enabled": true,
      "maxAttempts": 5,
      "delay": 1000
    }
  }
}
```

### MCP服务器SSE配置
```json
{
  "mcpServers": {
    "idiom-chain": {
      "transport": "sse",
      "sseConfig": {
        "port": 3001,
        "host": "localhost",
        "endpoint": "/events",
        "autoStart": true,
        "compression": true,
        "maxConnections": 100
      }
    }
  }
}
```

### 工具可见性配置
```json
{
  "tools": {
    "visibility": {
      "idiom-chain": {
        "start_game": true,
        "add_idiom": true,
        "get_hints": true,
        "get_game_state": true,
        "auto_play": true,
        "reset_game": true,
        "validate_idiom": true,
        "get_random_idiom": true,
        "get_stats": true,
        "start_sse_server": true,
        "get_sse_info": true
      }
    }
  }
}
```

## 📊 服务监控

### 1. 检查服务状态
```bash
# 查看xiaozhi-client状态
xiaozhi status

# 查看SSE服务器状态
curl http://localhost:3001/status
```

### 2. 实时监控SSE事件
```bash
# 监控SSE事件流
curl -N http://localhost:3001/events

# 或在浏览器中访问
open http://localhost:3001/events
```

### 3. Web UI监控
访问 `http://localhost:3000` 查看：
- 连接状态
- 事件流监控
- 工具调用日志
- 性能指标

## 🎮 使用示例

### 在小智中测试SSE功能

1. **启动游戏**：
   ```
   "开始一个成语接龙游戏"
   ```

2. **实时接龙**：
   ```
   "我接'龙飞凤舞'"
   ```

3. **获取实时提示**：
   ```
   "给我一些提示"
   ```

4. **查看实时状态**：
   ```
   "查看当前游戏状态"
   ```

### SSE事件示例
```javascript
// 游戏状态更新事件
{
  "type": "game_state_update",
  "data": {
    "currentIdiom": "龙飞凤舞",
    "nextChar": "舞",
    "score": 150,
    "round": 5
  }
}

// 新提示事件
{
  "type": "hint_available",
  "data": {
    "hints": ["舞文弄墨", "舞刀弄枪"],
    "difficulty": "medium"
  }
}
```

## 🔍 故障排除

### 常见问题

**1. SSE连接失败**
```bash
# 检查端口是否被占用
lsof -i :3001

# 检查防火墙设置
sudo ufw status
```

**2. 事件推送延迟**
- 检查网络连接
- 调整心跳间隔
- 优化事件缓冲区大小

**3. 连接频繁断开**
- 增加重连延迟
- 检查代理设置
- 调整超时配置

### 调试模式
```bash
# 启用详细日志
DEBUG=xiaozhi:* xiaozhi start

# 查看SSE服务器日志
tail -f xiaozhi-client-sse.log
```

## ⚡ 性能优化

### 1. 连接池配置
```json
{
  "sse": {
    "maxConnections": 100,
    "connectionTimeout": 30000,
    "keepAliveTimeout": 60000
  }
}
```

### 2. 事件缓冲
```json
{
  "sse": {
    "bufferSize": 1024,
    "flushInterval": 100,
    "compression": true
  }
}
```

### 3. 资源限制
```json
{
  "sse": {
    "maxEventSize": 65536,
    "maxQueueSize": 1000,
    "rateLimiting": {
      "enabled": true,
      "maxEvents": 100,
      "windowMs": 60000
    }
  }
}
```

## 🔒 安全配置

### CORS设置
```json
{
  "sse": {
    "cors": {
      "origin": ["https://xiaozhi.me", "http://localhost:3000"],
      "credentials": true,
      "maxAge": 86400
    }
  }
}
```

### 认证配置
```json
{
  "sse": {
    "auth": {
      "enabled": true,
      "type": "bearer",
      "secret": "your-secret-key"
    }
  }
}
```

## 📚 高级功能

### 1. 事件过滤
```json
{
  "sse": {
    "eventFilters": {
      "game_state": true,
      "hints": true,
      "errors": true,
      "debug": false
    }
  }
}
```

### 2. 自定义事件
```javascript
// 在MCP服务器中发送自定义事件
sse.send({
  type: 'custom_event',
  data: { message: 'Hello from MCP!' }
});
```

### 3. 事件持久化
```json
{
  "sse": {
    "persistence": {
      "enabled": true,
      "storage": "redis",
      "ttl": 3600
    }
  }
}
```

## 🆚 传输方式对比

| 特性 | SSE | WebSocket | HTTP |
|------|-----|-----------|------|
| 实时性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 轻量级 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 兼容性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 双向通信 | ❌ | ✅ | ❌ |
| 自动重连 | ✅ | 需实现 | ❌ |
| 调试友好 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 📞 技术支持

- **项目仓库**: [成语接龙MCP](https://github.com/your-repo)
- **xiaozhi-client**: [官方文档](https://github.com/shenjingnan/xiaozhi-client)
- **问题反馈**: 提交Issue或Pull Request
- **社区讨论**: 加入小智开发者群组

---

通过SSE方式接入，您可以享受到更加实时、稳定的成语接龙体验！🎉