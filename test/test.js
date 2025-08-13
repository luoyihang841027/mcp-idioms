import { IdiomChainGame } from '../src/game.js';
import { isValidIdiom, getRandomIdiom, findIdiomsByFirstChar } from '../src/idioms.js';

// 简单的测试框架
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('🧪 开始测试成语接龙应用...');
console.log('');

// 测试成语验证
test('成语验证 - 有效成语', () => {
  assert(isValidIdiom('一心一意'), '一心一意应该是有效成语');
  assert(isValidIdiom('意气风发'), '意气风发应该是有效成语');
});

test('成语验证 - 无效成语', () => {
  assert(!isValidIdiom('不存在的成语'), '不存在的成语应该无效');
  assert(!isValidIdiom(''), '空字符串应该无效');
});

// 测试随机成语
test('获取随机成语', () => {
  const idiom = getRandomIdiom();
  assert(idiom && idiom.text && idiom.pinyin && idiom.meaning, '随机成语应该包含完整信息');
  assert(isValidIdiom(idiom.text), '随机成语应该是有效的');
});

// 测试按首字查找
test('按首字查找成语', () => {
  const idioms = findIdiomsByFirstChar('一');
  assert(idioms.length > 0, '应该能找到以"一"开头的成语');
  assert(idioms.every(idiom => idiom.text[0] === '一'), '所有结果都应该以"一"开头');
});

// 测试游戏类
test('游戏初始化', () => {
  const game = new IdiomChainGame();
  const state = game.getGameState();
  assert(!state.gameStarted, '游戏初始状态应该是未开始');
  assert(state.chain.length === 0, '初始接龙链应该为空');
  assert(state.currentChar === null, '初始当前字符应该为null');
});

test('开始游戏 - 随机成语', () => {
  const game = new IdiomChainGame();
  const result = game.start();
  assert(result.success, '开始游戏应该成功');
  assert(result.idiom, '应该返回开始的成语');
  assert(result.nextChar, '应该返回下一个字符');
  
  const state = game.getGameState();
  assert(state.gameStarted, '游戏应该已开始');
  assert(state.chain.length === 1, '接龙链应该有一个成语');
});

test('开始游戏 - 指定成语', () => {
  const game = new IdiomChainGame();
  const result = game.start('一心一意');
  assert(result.success, '开始游戏应该成功');
  assert(result.idiom === '一心一意', '应该使用指定的成语');
  assert(result.nextChar === '意', '下一个字符应该是"意"');
});

test('开始游戏 - 无效成语', () => {
  const game = new IdiomChainGame();
  try {
    game.start('无效成语');
    assert(false, '应该抛出错误');
  } catch (error) {
    assert(error.message.includes('不是有效的成语'), '应该提示成语无效');
  }
});

test('添加成语 - 正确接龙', () => {
  const game = new IdiomChainGame();
  game.start('一心一意');
  const result = game.addIdiom('意气风发');
  assert(result.success, '添加成语应该成功');
  assert(result.nextChar === '发', '下一个字符应该是"发"');
  
  const state = game.getGameState();
  assert(state.chain.length === 2, '接龙链应该有两个成语');
});

test('添加成语 - 错误接龙', () => {
  const game = new IdiomChainGame();
  game.start('一心一意');
  try {
    game.addIdiom('发愤图强'); // 应该以"意"开头，不是"发"
    assert(false, '应该抛出错误');
  } catch (error) {
    assert(error.message.includes('不匹配'), '应该提示字符不匹配');
  }
});

test('添加成语 - 重复使用', () => {
  const game = new IdiomChainGame();
  game.start('一心一意');
  try {
    game.addIdiom('一心一意'); // 重复使用
    assert(false, '应该抛出错误');
  } catch (error) {
    assert(error.message.includes('已经使用过了'), '应该提示成语已使用');
  }
});

test('获取提示', () => {
  const game = new IdiomChainGame();
  game.start('一心一意');
  const hints = game.getHints(3);
  assert(Array.isArray(hints), '提示应该是数组');
  assert(hints.length <= 3, '提示数量不应超过限制');
  assert(hints.every(hint => hint.text[0] === '意'), '所有提示都应该以"意"开头');
});

test('检查是否可以继续', () => {
  const game = new IdiomChainGame();
  assert(!game.canContinue(), '游戏未开始时不能继续');
  
  game.start('一心一意');
  assert(game.canContinue(), '游戏开始后应该可以继续');
});

test('自动接龙', () => {
  const game = new IdiomChainGame();
  game.start('一心一意');
  const result = game.autoPlay();
  assert(result.success, '自动接龙应该成功');
  assert(result.idiom[0] === '意', 'AI选择的成语应该以"意"开头');
  
  const state = game.getGameState();
  assert(state.chain.length === 2, '接龙链应该有两个成语');
});

test('获取统计信息', () => {
  const game = new IdiomChainGame();
  game.start('一心一意');
  game.addIdiom('意气风发');
  
  const stats = game.getStats();
  assert(stats.totalIdioms === 2, '总成语数应该是2');
  assert(stats.gameStarted === true, '游戏应该已开始');
  assert(typeof stats.canContinue === 'boolean', 'canContinue应该是布尔值');
});

test('重置游戏', () => {
  const game = new IdiomChainGame();
  game.start('一心一意');
  game.addIdiom('意气风发');
  
  game.reset();
  const state = game.getGameState();
  assert(!state.gameStarted, '重置后游戏应该未开始');
  assert(state.chain.length === 0, '重置后接龙链应该为空');
  assert(state.currentChar === null, '重置后当前字符应该为null');
});

console.log('');
console.log('🎉 所有测试完成！');
console.log('');
console.log('📝 测试覆盖的功能：');
console.log('   - 成语验证');
console.log('   - 随机成语获取');
console.log('   - 按首字查找成语');
console.log('   - 游戏初始化和状态管理');
console.log('   - 成语接龙逻辑');
console.log('   - 错误处理');
console.log('   - 提示功能');
console.log('   - AI自动接龙');
console.log('   - 统计信息');
console.log('   - 游戏重置');
console.log('');
console.log('✨ 成语接龙MCP应用已准备就绪！');