# 小智(Xiaozhi) MCP接入指南

本文档详细说明如何将成语接龙MCP应用通过xiaozhi-client接入到小智(Xiaozhi)系统中。

## 概述

通过xiaozhi-client，我们可以将本地的成语接龙MCP服务器标准化接入到小智系统，xiaozhi-client作为官方推荐的MCP客户端，提供了完整的小智系统集成方案。

## 系统架构

```
小智设备 ↔ 小智服务器 ↔ xiaozhi-client ↔ 成语接龙MCP服务器
```

## 接入方式对比

| 方式 | 优势 | 适用场景 |
|------|------|----------|
| **xiaozhi-client (推荐)** | 官方支持、标准化、稳定可靠 | 生产环境、长期使用 |
| 自建桥接服务 | 自定义程度高、学习价值 | 开发测试、特殊需求 |

## 配置步骤

### 方式一：使用xiaozhi-client (推荐)

#### 1. 安装xiaozhi-client

```bash
# 全局安装
npm i -g xiaozhi-client

# 或使用npx直接运行
npx -y xiaozhi-client
```

#### 2. 获取小智接入点地址

1. 访问 [xiaozhi.me](https://xiaozhi.me) 获取MCP接入点地址
2. 参考官方文档：[小智AI配置MCP接入点使用说明](https://ccnphfhqs21z.feishu.cn/wiki/HiPEwZ37XiitnwktX13cEM5KnSb)

#### 3. 创建xiaozhi-client项目

```bash
# 创建项目
xiaozhi create idiom-chain-project

# 进入项目目录
cd idiom-chain-project
```

#### 4. 配置MCP服务器

编辑项目中的 `xiaozhi.config.json` 文件：

```json
{
  "mcpEndpoint": "你的小智接入点地址",
  "mcpServers": {
    "idiom-chain": {
      "command": "node",
      "args": ["path/to/your/newcode/src/index.js"],
      "cwd": "/Users/luoyichang/newcode"
    }
  }
}
```

#### 5. 启动服务

```bash
# 启动xiaozhi-client
xiaozhi start

# 后台运行
xiaozhi start -d
```

### 方式二：使用自建桥接服务

如果需要自定义功能，可以使用我们提供的桥接服务：

#### 1. 获取小智访问令牌

参考方式一的步骤2获取接入点地址。

#### 2. 配置桥接服务

编辑 `xiaozhi-config.json` 文件：

```json
{
  "xiaozhi": {
    "endpoint": "你的小智接入点地址",
    "reconnect": {
      "enabled": true,
      "maxRetries": 5,
      "backoffMs": 1000
    }
  }
}
```

#### 3. 安装依赖并启动

```bash
npm install
npm run xiaozhi-bridge
```

## 启动服务

### 使用xiaozhi-client (推荐)

```bash
# 基本启动
xiaozhi start

# 后台运行
xiaozhi start -d

# 查看状态
xiaozhi status

# 停止服务
xiaozhi stop
```

### 使用自建桥接服务

```bash
# 生产模式
npm run xiaozhi-bridge

# 开发模式（自动重启）
npm run xiaozhi-dev

# 功能演示
npm run xiaozhi-demo
```

## 服务状态监控

### xiaozhi-client状态监控

xiaozhi-client提供了完整的状态监控功能：

```bash
# 查看服务状态
xiaozhi status

# 查看日志
xiaozhi logs

# Web UI监控 (默认端口3000)
http://localhost:3000
```

### 自建桥接服务状态

桥接服务启动后会显示以下信息：

- 🚀 MCP服务器启动状态
- 🔗 小智服务器连接状态
- 📋 可用工具列表
- 📊 定期状态报告（每30秒）

## 可用工具

通过小智可以使用以下成语接龙功能：

| 工具名称 | 功能描述 |
|---------|----------|
| `start_game` | 开始新的成语接龙游戏 |
| `add_idiom` | 添加成语到游戏中 |
| `get_hints` | 获取成语提示 |
| `get_game_state` | 获取当前游戏状态 |
| `auto_play` | AI自动接龙 |
| `reset_game` | 重置游戏 |
| `validate_idiom` | 验证成语有效性 |
| `get_random_idiom` | 获取随机成语 |
| `get_stats` | 获取游戏统计 |
| `start_sse_server` | 启动SSE实时推送服务 |
| `get_sse_info` | 获取SSE服务信息 |

## 使用示例

### 在小智中开始游戏

```
用户: 开始一个成语接龙游戏
小智: 好的，我来为您开始一个成语接龙游戏...
     [调用 start_game 工具]
     游戏已开始！第一个成语是：一帆风顺
```

### 添加成语

```
用户: 我接"顺水推舟"
小智: [调用 add_idiom 工具]
     很好！"顺水推舟"接得很棒，现在轮到我了...
     [调用 auto_play 工具]
     我接"舟车劳顿"
```

### 获取提示

```
用户: 我想不出来了，给我一些提示
小智: [调用 get_hints 工具]
     以下是一些提示：
     - 顿开茅塞
     - 顿足捶胸
     - 顿时三刻
```

### xiaozhi-client特有功能

```
# 动态控制工具可见性
xiaozhi tools list
xiaozhi tools enable idiom-chain
xiaozhi tools disable idiom-chain

# 多接入点管理
xiaozhi endpoint add "新的接入点地址"
xiaozhi endpoint list
```

## 故障排除

### 常见问题

#### xiaozhi-client相关问题

1. **xiaozhi-client安装失败**
   - 检查Node.js版本（需要16+）
   - 使用 `npm cache clean --force` 清理缓存
   - 尝试使用 `npx` 直接运行

2. **接入点配置错误**
   - 确认从xiaozhi.me获取的接入点地址正确
   - 检查网络连接是否正常
   - 参考官方文档进行配置

3. **MCP服务器路径问题**
   - 确认 `xiaozhi.config.json` 中的路径正确
   - 使用绝对路径避免相对路径问题
   - 检查文件权限

#### 自建桥接服务问题

1. **连接失败**
   - 检查网络连接
   - 验证访问令牌是否正确
   - 确认小智服务器地址是否正确

2. **MCP服务器启动失败**
   - 检查Node.js版本（需要14+）
   - 确认项目依赖已正确安装
   - 查看错误日志

3. **工具调用失败**
   - 检查MCP服务器是否正常运行
   - 查看桥接服务日志
   - 验证消息格式是否正确

### 日志分析

桥接服务会输出详细的日志信息：

- `🚀` MCP服务器启动
- `🔗` 小智连接状态
- `📨` 消息收发
- `🤝` 握手成功
- `📊` 状态报告
- `❌` 错误信息

## 高级配置

### 自定义重连策略

```json
{
  "xiaozhi": {
    "reconnect": {
      "enabled": true,
      "maxRetries": 10,
      "backoffMs": 2000
    }
  }
}
```

### 日志配置

```json
{
  "bridge": {
    "logging": {
      "level": "debug",
      "file": "xiaozhi-bridge.log"
    }
  }
}
```

## 安全注意事项

1. **保护访问令牌**
   - 不要将令牌提交到版本控制系统
   - 使用环境变量存储敏感信息
   - 定期更换访问令牌

2. **网络安全**
   - 使用HTTPS/WSS加密连接
   - 配置防火墙规则
   - 监控异常连接

## 技术支持

### xiaozhi-client支持

- **官方仓库**: [xiaozhi-client GitHub](https://github.com/shenjingnan/xiaozhi-client)
- **官方文档**: [小智AI配置MCP接入点使用说明](https://ccnphfhqs21z.feishu.cn/wiki/HiPEwZ37XiitnwktX13cEM5KnSb)
- **Web UI**: 启动后访问 http://localhost:3000 进行可视化配置

### 成语接龙MCP支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目的GitHub Issues
3. 使用 `npm run xiaozhi-status` 检查服务状态
4. 提供详细的错误日志和配置信息

## 更新日志

- v1.0.0: 初始版本，支持基本MCP桥接功能
- 支持自动重连和错误恢复
- 支持所有成语接龙工具
- 支持SSE实时推送集成