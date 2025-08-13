import { findIdiomsByFirstChar, getLastChar, isValidIdiom, getRandomIdiom } from './idioms.js';

// 游戏状态管理
export class IdiomChainGame {
  constructor() {
    this.reset();
  }

  // 重置游戏
  reset() {
    this.chain = [];
    this.usedIdioms = new Set();
    this.currentChar = null;
    this.gameStarted = false;
  }

  // 开始游戏
  start(firstIdiom = null) {
    this.reset();
    this.gameStarted = true;
    
    if (firstIdiom) {
      if (!isValidIdiom(firstIdiom)) {
        throw new Error(`"${firstIdiom}" 不是有效的成语`);
      }
      return this.addIdiom(firstIdiom);
    } else {
      // 随机选择一个成语开始
      const randomIdiom = getRandomIdiom();
      return this.addIdiom(randomIdiom.text);
    }
  }

  // 添加成语到接龙链
  addIdiom(idiom) {
    if (!this.gameStarted) {
      throw new Error('游戏尚未开始，请先调用 start() 方法');
    }

    // 验证成语是否有效
    if (!isValidIdiom(idiom)) {
      throw new Error(`"${idiom}" 不是有效的成语`);
    }

    // 检查是否已经使用过
    if (this.usedIdioms.has(idiom)) {
      throw new Error(`"${idiom}" 已经使用过了`);
    }

    // 检查是否符合接龙规则（除了第一个成语）
    if (this.currentChar && idiom[0] !== this.currentChar) {
      throw new Error(`成语 "${idiom}" 的首字 "${idiom[0]}" 与上一个成语的尾字 "${this.currentChar}" 不匹配`);
    }

    // 添加到链中
    this.chain.push(idiom);
    this.usedIdioms.add(idiom);
    this.currentChar = getLastChar({ text: idiom });

    return {
      success: true,
      idiom: idiom,
      nextChar: this.currentChar,
      chainLength: this.chain.length,
      message: `成功添加 "${idiom}"，下一个成语需要以 "${this.currentChar}" 开头`
    };
  }

  // 获取可能的下一个成语提示
  getHints(limit = 5) {
    if (!this.currentChar) {
      return [];
    }

    const possibleIdioms = findIdiomsByFirstChar(this.currentChar)
      .filter(idiom => !this.usedIdioms.has(idiom.text))
      .slice(0, limit);

    return possibleIdioms.map(idiom => ({
      text: idiom.text,
      pinyin: idiom.pinyin,
      meaning: idiom.meaning
    }));
  }

  // 获取当前游戏状态
  getGameState() {
    return {
      gameStarted: this.gameStarted,
      chain: [...this.chain],
      chainLength: this.chain.length,
      currentChar: this.currentChar,
      usedCount: this.usedIdioms.size,
      lastIdiom: this.chain.length > 0 ? this.chain[this.chain.length - 1] : null
    };
  }

  // 检查是否还有可能的接龙
  canContinue() {
    if (!this.currentChar) {
      return false;
    }
    
    const possibleIdioms = findIdiomsByFirstChar(this.currentChar)
      .filter(idiom => !this.usedIdioms.has(idiom.text));
    
    return possibleIdioms.length > 0;
  }

  // 自动接龙（AI模式）
  autoPlay() {
    if (!this.canContinue()) {
      throw new Error('无法继续接龙，游戏结束');
    }

    const possibleIdioms = findIdiomsByFirstChar(this.currentChar)
      .filter(idiom => !this.usedIdioms.has(idiom.text));
    
    // 随机选择一个成语
    const randomIndex = Math.floor(Math.random() * possibleIdioms.length);
    const selectedIdiom = possibleIdioms[randomIndex];
    
    return this.addIdiom(selectedIdiom.text);
  }

  // 获取游戏统计
  getStats() {
    return {
      totalIdioms: this.chain.length,
      uniqueChars: new Set(this.chain.map(idiom => idiom[0]).concat(this.currentChar ? [this.currentChar] : [])).size,
      gameStarted: this.gameStarted,
      canContinue: this.canContinue()
    };
  }
}