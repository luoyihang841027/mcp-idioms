#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { IdiomChainGame } from './game.js';
import { idioms, isValidIdiom, getRandomIdiom } from './idioms.js';
import { startSSEServer } from './sse-server.js';

// 创建全局游戏实例
const game = new IdiomChainGame();

// 创建MCP服务器
const server = new Server(
  {
    name: 'idiom-chain-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'start_game',
        description: '开始新的成语接龙游戏',
        inputSchema: {
          type: 'object',
          properties: {
            firstIdiom: {
              type: 'string',
              description: '可选：指定第一个成语，如果不指定则随机选择',
            },
          },
        },
      },
      {
        name: 'add_idiom',
        description: '向接龙链中添加一个成语',
        inputSchema: {
          type: 'object',
          properties: {
            idiom: {
              type: 'string',
              description: '要添加的成语',
            },
          },
          required: ['idiom'],
        },
      },
      {
        name: 'get_hints',
        description: '获取下一个可能的成语提示',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: '返回提示的数量限制，默认为5',
              default: 5,
            },
          },
        },
      },
      {
        name: 'get_game_state',
        description: '获取当前游戏状态',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'auto_play',
        description: 'AI自动接龙',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'reset_game',
        description: '重置游戏',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'validate_idiom',
        description: '验证一个词语是否为有效成语',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: '要验证的词语',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'get_random_idiom',
        description: '获取一个随机成语',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_stats',
        description: '获取游戏统计信息',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'start_sse_server',
        description: '启动SSE服务器',
        inputSchema: {
          type: 'object',
          properties: {
            port: {
              type: 'number',
              description: 'SSE服务器端口，默认为3000',
              default: 3000,
            },
          },
        },
      },
      {
        name: 'get_sse_info',
        description: '获取SSE服务器信息和使用说明',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'start_game': {
        const result = game.start(args?.firstIdiom);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '游戏开始',
                result: result,
                gameState: game.getGameState(),
              }, null, 2),
            },
          ],
        };
      }

      case 'add_idiom': {
        if (!args?.idiom) {
          throw new McpError(ErrorCode.InvalidParams, '缺少必需参数: idiom');
        }
        const result = game.addIdiom(args.idiom);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '添加成语',
                result: result,
                gameState: game.getGameState(),
              }, null, 2),
            },
          ],
        };
      }

      case 'get_hints': {
        const hints = game.getHints(args?.limit || 5);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '获取提示',
                hints: hints,
                currentChar: game.currentChar,
                hintsCount: hints.length,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_game_state': {
        const state = game.getGameState();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '获取游戏状态',
                gameState: state,
              }, null, 2),
            },
          ],
        };
      }

      case 'auto_play': {
        const result = game.autoPlay();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'AI自动接龙',
                result: result,
                gameState: game.getGameState(),
              }, null, 2),
            },
          ],
        };
      }

      case 'reset_game': {
        game.reset();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '重置游戏',
                message: '游戏已重置',
                gameState: game.getGameState(),
              }, null, 2),
            },
          ],
        };
      }

      case 'validate_idiom': {
        if (!args?.text) {
          throw new McpError(ErrorCode.InvalidParams, '缺少必需参数: text');
        }
        const isValid = isValidIdiom(args.text);
        const idiomInfo = isValid ? idioms.find(i => i.text === args.text) : null;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '验证成语',
                text: args.text,
                isValid: isValid,
                idiomInfo: idiomInfo,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_random_idiom': {
        const randomIdiom = getRandomIdiom();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '获取随机成语',
                idiom: randomIdiom,
              }, null, 2),
            },
          ],
        };
      }

      case 'get_stats': {
        const stats = game.getStats();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '获取统计信息',
                stats: stats,
                totalIdiomsInDatabase: idioms.length,
              }, null, 2),
            },
          ],
        };
      }

      case 'start_sse_server': {
        try {
          const port = args?.port || 3000;
          await startSSEServer(port);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  action: '启动SSE服务器',
                  message: `SSE服务器已在端口 ${port} 启动`,
                  endpoints: {
                    sse: `http://localhost:${port}/events`,
                    web: `http://localhost:${port}`,
                    api: `http://localhost:${port}/api/*`,
                    health: `http://localhost:${port}/health`
                  }
                }, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new McpError(ErrorCode.InternalError, `启动SSE服务器失败: ${error.message}`);
        }
      }

      case 'get_sse_info': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: '获取SSE信息',
                description: '成语接龙SSE服务器提供实时游戏状态推送',
                features: [
                  '实时游戏状态更新',
                  '成语添加事件推送',
                  'AI自动接龙通知',
                  '错误和提示信息推送',
                  '游戏重置通知'
                ],
                endpoints: {
                  sse: '/events - Server-Sent Events端点',
                  web: '/ - 演示网页',
                  api: '/api/* - REST API接口',
                  health: '/health - 健康检查'
                },
                usage: {
                  start: '使用 start_sse_server 工具启动服务器',
                  connect: '在浏览器中访问 http://localhost:3000 查看演示',
                  api: '使用REST API或SSE接口与游戏交互'
                }
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, error.message);
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('成语接龙 MCP 服务器已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});