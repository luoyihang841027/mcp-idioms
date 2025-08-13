# 🚀 小智接入快速开始指南

本指南帮助您在5分钟内将成语接龙MCP服务接入到小智系统。

## 📋 前置要求

- Node.js 16+ 
- 小智设备或小智账号
- 网络连接

## 🎯 快速接入 (推荐方式)

### 传输模式选择

**标准模式**: 适合一般使用，稳定可靠
**SSE模式**: 支持实时推送，适合需要实时游戏状态更新的场景

### 步骤1: 安装xiaozhi-client

```bash
# 全局安装
npm i -g xiaozhi-client

# 验证安装
xiaozhi --version
```

### 步骤2: 获取小智接入点

1. 访问 [xiaozhi.me](https://xiaozhi.me)
2. 登录您的小智账号
3. 进入MCP配置页面
4. 复制接入点地址 (格式类似: `wss://api.xiaozhi.me/mcp/?token=xxx`)

> 📖 详细说明: [小智AI配置MCP接入点使用说明](https://ccnphfhqs21z.feishu.cn/wiki/HiPEwZ37XiitnwktX13cEM5KnSb)

### 步骤3: 创建项目

```bash
# 创建xiaozhi-client项目
xiaozhi create idiom-chain-project

# 进入项目目录
cd idiom-chain-project
```

### 步骤4: 配置MCP服务器

编辑项目中的 `xiaozhi.config.json`:

```json
{
  "mcpEndpoint": "你的小智接入点地址",
  "mcpServers": {
    "idiom-chain": {
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/Users/luoyichang/newcode"
    }
  }
}
```

**重要**: 
- 将 `你的小智接入点地址` 替换为步骤2获取的实际地址
- 将 `cwd` 路径修改为您的成语接龙项目实际路径

### 步骤5: 启动服务

#### 标准模式启动
```bash
# 启动xiaozhi-client (标准模式)
xiaozhi start
```

#### SSE模式启动 (实时推送)
```bash
# 使用SSE配置启动
cp /Users/luoyichang/newcode/xiaozhi.config.sse.json ./xiaozhi.config.json
xiaozhi start

# 或者直接指定SSE配置
xiaozhi start --config /Users/luoyichang/newcode/xiaozhi.config.sse.json
```

看到以下输出表示成功:
```
✅ 连接到小智服务器成功
🚀 MCP服务器启动成功
📋 已注册工具: start_game, add_idiom, get_hints...
🌐 SSE服务器启动 (仅SSE模式): http://localhost:3001
```

### 步骤6: 在小智中测试

现在您可以在小智设备或应用中说:

```
"开始一个成语接龙游戏"
"我接龙马精神"
"给我一些提示"
"查看游戏状态"
```

## 🎮 使用示例

### 完整游戏流程

```
用户: "开始成语接龙"
小智: "好的！游戏开始，第一个成语是：一帆风顺"

用户: "我接顺水推舟"
小智: "很好！我接舟车劳顿"

用户: "我想不出来了"
小智: "给您一些提示：顿开茅塞、顿足捶胸、顿时三刻"

用户: "我接顿开茅塞"
小智: "excellent！我接塞翁失马"
```

## 🔧 高级配置

### Web UI管理

```bash
# 启动Web管理界面
xiaozhi start

# 访问管理界面
# 标准模式: http://localhost:3000
# SSE模式: http://localhost:3000 (管理) + http://localhost:3001 (事件流)
```

### SSE实时监控 (仅SSE模式)

```bash
# 监控实时事件流
curl -N http://localhost:3001/events

# 查看SSE服务状态
curl http://localhost:3001/status

# 在浏览器中查看实时游戏状态
open http://localhost:3001/events
```

### 工具可见性控制

```bash
# 查看所有工具
xiaozhi tools list

# 禁用SSE相关工具（小智中不需要）
xiaozhi tools disable idiom-chain.start_sse_server
xiaozhi tools disable idiom-chain.get_sse_info

# 启用核心游戏工具
xiaozhi tools enable idiom-chain.start_game
xiaozhi tools enable idiom-chain.add_idiom
```

### 后台运行

```bash
# 后台启动
xiaozhi start -d

# 查看状态
xiaozhi status

# 查看日志
xiaozhi logs

# 停止服务
xiaozhi stop
```

## 🐛 常见问题

### Q: 连接失败怎么办？
A: 
1. 检查接入点地址是否正确
2. 确认网络连接正常
3. 验证小智账号权限

### Q: MCP服务器启动失败？
A:
1. 检查成语接龙项目路径是否正确
2. 确认Node.js版本 >= 14
3. 运行 `npm install` 安装依赖

### Q: 小智无法识别工具？
A:
1. 检查xiaozhi-client是否正常运行
2. 使用 `xiaozhi tools list` 查看工具状态
3. 重启xiaozhi-client服务

### Q: 如何更新配置？
A:
```bash
# 停止服务
xiaozhi stop

# 编辑配置文件
vim xiaozhi.config.json

# 重新启动
xiaozhi start
```

## 📊 监控和调试

### 实时状态监控

```bash
# 查看详细状态
xiaozhi status --verbose

# 实时日志
xiaozhi logs --follow

# 工具调用统计
xiaozhi stats
```

### 调试模式

```bash
# 启用调试日志
xiaozhi start --debug

# 查看MCP消息
xiaozhi logs --level debug
```

## 🔄 备选方案

如果xiaozhi-client遇到问题，您也可以使用我们提供的自建桥接服务：

```bash
# 在成语接龙项目目录中
npm run xiaozhi-bridge
```

详细说明请参考 `XIAOZHI_INTEGRATION.md`。

## 📚 更多资源

- **详细文档**: [XIAOZHI_INTEGRATION.md](./XIAOZHI_INTEGRATION.md)
- **SSE接入指南**: [XIAOZHI_SSE_INTEGRATION.md](./XIAOZHI_SSE_INTEGRATION.md)
- **项目主页**: [README.md](./README.md)
- **xiaozhi-client**: [GitHub仓库](https://github.com/shenjingnan/xiaozhi-client)
- **小智官网**: [xiaozhi.me](https://xiaozhi.me)

---

🎉 恭喜！您已成功将成语接龙MCP服务接入小智系统，现在可以享受智能成语接龙的乐趣了！

💡 **提示**: 如需实时游戏状态推送，建议使用SSE模式，详见 [SSE接入指南](./XIAOZHI_SSE_INTEGRATION.md)