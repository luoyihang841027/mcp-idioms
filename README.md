# 成语接龙 MCP 应用

一个基于 Model Context Protocol (MCP) 的智能成语接龙游戏应用，支持AI自动接龙、智能提示、游戏统计等功能。

## 🚀 快速开始

- **接入小智系统**: 查看 [快速开始指南](./QUICK_START_XIAOZHI.md) 5分钟接入小智
- **本地开发**: 继续阅读下方完整文档

## 功能特性

- 🎮 **成语接龙游戏**: 经典的成语接龙玩法
- 🤖 **AI自动接龙**: 智能AI帮助继续接龙
- 💡 **智能提示**: 获取可能的下一个成语提示
- 📊 **游戏统计**: 实时查看游戏进度和统计信息
- ✅ **成语验证**: 验证输入的词语是否为有效成语
- 🎲 **随机成语**: 获取随机成语开始游戏
- 🌐 **实时推送**: 支持SSE(Server-Sent Events)实时推送游戏状态
- 🖥️ **Web界面**: 提供可视化的游戏界面和实时事件监控
- 🔗 **小智系统接入**: 支持接入小智(Xiaozhi)系统，实现远程MCP功能访问 (支持xiaozhi-client)

## 安装依赖

```bash
npm install
```

## 启动服务

### 启动MCP服务器
```bash
npm start
```

### 启动SSE服务器（实时Web界面）
```bash
npm run sse
```

### 小智系统接入

#### 方式一：使用xiaozhi-client (推荐)
```bash
# 安装xiaozhi-client
npm i -g xiaozhi-client

# 创建项目并配置
xiaozhi create idiom-chain-project
cd idiom-chain-project

# 启动服务 (标准模式)
xiaozhi start

# 启动服务 (SSE模式)
npm run xiaozhi-sse
```

#### 方式二：使用自建桥接服务
```bash
npm run xiaozhi-bridge
```

### 同时启动MCP和SSE服务器
```bash
npm run start-all
```

或者开发模式（自动重启）：

```bash
npm run dev
npm run xiaozhi-dev      # 小智桥接服务开发模式
npm run sse-dev          # SSE服务器开发模式
npm run xiaozhi-install  # 安装xiaozhi-client
npm run xiaozhi-quick    # 查看快速接入指南
npm run xiaozhi-sse      # 启动xiaozhi-client (SSE模式)
npm run xiaozhi-sse-dev  # xiaozhi-client SSE开发模式
npm run xiaozhi-sse-status  # 查看SSE服务状态
npm run xiaozhi-sse-events  # 监控SSE事件流
```

服务器启动后：
- MCP客户端可以连接到MCP服务器使用成语接龙功能
- 浏览器可以访问 `http://localhost:3000` 使用Web界面
- SSE事件流可通过 `http://localhost:3000/events` 访问

## MCP 工具列表

### 1. start_game
开始新的成语接龙游戏

**参数:**
- `firstIdiom` (可选): 指定第一个成语，如果不指定则随机选择

**示例:**
```json
{
  "firstIdiom": "一心一意"
}
```

### 2. add_idiom
向接龙链中添加一个成语

**参数:**
- `idiom` (必需): 要添加的成语

**示例:**
```json
{
  "idiom": "意气风发"
}
```

### 3. get_hints
获取下一个可能的成语提示

**参数:**
- `limit` (可选): 返回提示的数量限制，默认为5

**示例:**
```json
{
  "limit": 3
}
```

### 4. get_game_state
获取当前游戏状态

**参数:** 无

### 5. auto_play
AI自动接龙

**参数:** 无

### 6. reset_game
重置游戏

**参数:** 无

### 7. validate_idiom
验证一个词语是否为有效成语

**参数:**
- `text` (必需): 要验证的词语

**示例:**
```json
{
  "text": "一心一意"
}
```

### 8. get_random_idiom
获取一个随机成语

**参数:** 无

### 9. get_stats
获取游戏统计信息

**参数:** 无

### 10. start_sse_server
启动SSE服务器

**参数:** 无

### 11. get_sse_info
获取SSE服务器信息

**参数:** 无

## 小智系统接入

成语接龙MCP应用支持接入小智(Xiaozhi)系统，提供两种接入方式：

### xiaozhi-client接入 (推荐)
- **标准配置**: `xiaozhi.config.example.json` - xiaozhi-client配置模板
- **SSE配置**: `xiaozhi.config.sse.json` - SSE传输模式配置
- **官方客户端**: [xiaozhi-client](https://github.com/shenjingnan/xiaozhi-client) - 官方MCP客户端
- **Web UI**: 支持可视化配置和监控
- **实时推送**: SSE模式支持实时事件推送

### 自建桥接服务
- **配置文件**: `xiaozhi-config.json` - 自建桥接配置
- **桥接服务**: `src/xiaozhi-bridge.js` - 自建MCP桥接服务器
- **演示脚本**: `demo-xiaozhi.js` - 功能演示和测试

**使用文档**: 
- `XIAOZHI_CLIENT_INTEGRATION.md` - xiaozhi-client对接指南
- `XIAOZHI_INTEGRATION.md` - 详细接入指南
- `XIAOZHI_SSE_INTEGRATION.md` - SSE接入专门指南

## 游戏规则

1. **接龙规则**: 下一个成语的第一个字必须与上一个成语的最后一个字相同
2. **不重复**: 每个成语在一局游戏中只能使用一次
3. **有效成语**: 只能使用应用内置成语库中的成语

## 使用示例

### 开始游戏
```bash
# 随机开始
start_game

# 指定第一个成语
start_game {"firstIdiom": "一心一意"}
```

### 添加成语
```bash
add_idiom {"idiom": "意气风发"}
```

### 获取提示
```bash
get_hints {"limit": 3}
```

### AI自动接龙
```bash
auto_play
```

### 查看游戏状态
```bash
get_game_state
```

## 成语数据库

应用内置了40+个常用成语，包含：
- 成语文本
- 拼音标注
- 含义解释

## 项目结构

```
idiom-chain-mcp/
├── package.json          # 项目配置和依赖
├── src/
│   ├── index.js         # MCP服务器主文件
│   ├── game.js          # 游戏逻辑核心
│   ├── idioms.js        # 成语数据库和工具函数
│   ├── sse-server.js    # SSE服务器（实时推送）
│   └── xiaozhi-bridge.js # 小智MCP桥接服务器
├── public/
│   └── index.html       # Web界面（实时游戏界面）
├── test/
│   ├── test.js          # 基础功能测试
│   ├── test-sse.js      # SSE功能测试
│   └── test-xiaozhi-bridge.js # 小智桥接测试
├── README.md            # 项目说明
├── mcp-config.json      # MCP配置文件
├── xiaozhi-config.json  # 自建桥接配置文件
├── xiaozhi.config.example.json # xiaozhi-client标准配置示例
├── xiaozhi.config.sse.json # xiaozhi-client SSE配置示例
├── demo-xiaozhi.js       # 小智接入演示脚本
├── QUICK_START_XIAOZHI.md # 小智快速开始指南
├── XIAOZHI_INTEGRATION.md # 小智详细接入指南
├── XIAOZHI_CLIENT_INTEGRATION.md # xiaozhi-client对接指南
├── XIAOZHI_SSE_INTEGRATION.md # 小智SSE接入专门指南
└── example-usage.md     # 使用示例
```

## 技术栈

- **Node.js**: JavaScript运行环境
- **MCP SDK**: Model Context Protocol 软件开发包
- **Express.js**: Web服务器框架
- **Server-Sent Events (SSE)**: 实时数据推送
- **WebSocket (ws)**: 小智系统通信
- **CORS**: 跨域资源共享
- **ES Modules**: 现代JavaScript模块系统
- **EventEmitter**: 事件驱动架构
- **JSON-RPC 2.0**: MCP消息格式

## 开发说明

### 添加新成语

在 `src/idioms.js` 文件中的 `idioms` 数组中添加新的成语对象：

```javascript
{
  text: "成语文本",
  pinyin: "chéng yǔ wén běn",
  meaning: "成语含义解释"
}
```

### 扩展功能

可以在 `src/game.js` 中扩展游戏逻辑，在 `src/index.js` 中添加新的MCP工具。

## 许可证

MIT License