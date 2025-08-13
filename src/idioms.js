// 成语数据库
export const idioms = [
  { text: "一心一意", pinyin: "yī xīn yī yì", meaning: "心思、意念专一" },
  { text: "意气风发", pinyin: "yì qì fēng fā", meaning: "意气奋发，精神振作" },
  { text: "发愤图强", pinyin: "fā fèn tú qiáng", meaning: "决心努力，谋求强盛" },
  { text: "强词夺理", pinyin: "qiáng cí duó lǐ", meaning: "没有道理，强行辩解" },
  { text: "理直气壮", pinyin: "lǐ zhí qì zhuàng", meaning: "理由正当，说话气势很盛" },
  { text: "壮志凌云", pinyin: "zhuàng zhì líng yún", meaning: "宏伟的志向直上云霄" },
  { text: "云开雾散", pinyin: "yún kāi wù sàn", meaning: "比喻疑虑消除" },
  { text: "散兵游勇", pinyin: "sàn bīng yóu yǒng", meaning: "没有组织的零散人员" },
  { text: "勇往直前", pinyin: "yǒng wǎng zhí qián", meaning: "勇敢地一直向前进" },
  { text: "前功尽弃", pinyin: "qián gōng jìn qì", meaning: "以前的功劳全部丢失" },
  { text: "弃暗投明", pinyin: "qì àn tóu míng", meaning: "离开黑暗，投靠光明" },
  { text: "明察秋毫", pinyin: "míng chá qiū háo", meaning: "眼力能看清秋天鸟兽的毫毛" },
  { text: "毫不犹豫", pinyin: "háo bù yóu yù", meaning: "一点儿也不迟疑" },
  { text: "豫章故郡", pinyin: "yù zhāng gù jùn", meaning: "古代豫章郡的别称" },
  { text: "郡县制度", pinyin: "jùn xiàn zhì dù", meaning: "古代的行政制度" },
  { text: "度日如年", pinyin: "dù rì rú nián", meaning: "过一天像过一年那样长" },
  { text: "年富力强", pinyin: "nián fù lì qiáng", meaning: "年纪轻，精力旺盛" },
  { text: "强人所难", pinyin: "qiáng rén suǒ nán", meaning: "勉强人家去做难以胜任的事情" },
  { text: "难以置信", pinyin: "nán yǐ zhì xìn", meaning: "很难相信" },
  { text: "信口开河", pinyin: "xìn kǒu kāi hé", meaning: "随口乱说一气" },
  { text: "河清海晏", pinyin: "hé qīng hǎi yàn", meaning: "黄河水清了，大海没有浪" },
  { text: "晏然自若", pinyin: "yàn rán zì ruò", meaning: "安然自在的样子" },
  { text: "若无其事", pinyin: "ruò wú qí shì", meaning: "好像没有那回事一样" },
  { text: "事半功倍", pinyin: "shì bàn gōng bèi", meaning: "做事得法，因而费力小，收效大" },
  { text: "倍道而进", pinyin: "bèi dào ér jìn", meaning: "加快速度，一天走两天的路程" },
  { text: "进退两难", pinyin: "jìn tuì liǎng nán", meaning: "前进和后退都难" },
  { text: "难兄难弟", pinyin: "nàn xiōng nàn dì", meaning: "共过患难的人或彼此处于同样困境的人" },
  { text: "弟子规矩", pinyin: "dì zǐ guī jǔ", meaning: "学生应该遵守的规则" },
  { text: "矩步方行", pinyin: "jǔ bù fāng xíng", meaning: "行走时步伐端正" },
  { text: "行云流水", pinyin: "xíng yún liú shuǐ", meaning: "形容文章自然不受约束" },
  { text: "水到渠成", pinyin: "shuǐ dào qú chéng", meaning: "水流到的地方自然形成一条水道" },
  { text: "成千上万", pinyin: "chéng qiān shàng wàn", meaning: "形容数量很多" },
  { text: "万紫千红", pinyin: "wàn zǐ qiān hóng", meaning: "形容百花齐放，色彩繁多" },
  { text: "红颜薄命", pinyin: "hóng yán bó mìng", meaning: "红颜：美女的容颜；薄命：命运不好" },
  { text: "命中注定", pinyin: "mìng zhōng zhù dìng", meaning: "迷信的人认为人的一切遭遇都是命运预先决定的" },
  { text: "定国安邦", pinyin: "dìng guó ān bāng", meaning: "治理和保卫国家，使国家安定稳固" },
  { text: "邦以民为本", pinyin: "bāng yǐ mín wéi běn", meaning: "国家以人民为根本" },
  { text: "本末倒置", pinyin: "běn mò dào zhì", meaning: "把根本的和枝节的、主要的和次要的关系弄颠倒了" },
  { text: "置之度外", pinyin: "zhì zhī dù wài", meaning: "放在考虑之外" },
  { text: "外强中干", pinyin: "wài qiáng zhōng gān", meaning: "外有强形，内中干竭" },
  { text: "干净利落", pinyin: "gān jìng lì luò", meaning: "利索，不拖泥带水" }
];

// 根据首字查找成语
export function findIdiomsByFirstChar(char) {
  return idioms.filter(idiom => idiom.text[0] === char);
}

// 根据尾字查找成语
export function findIdiomsByLastChar(char) {
  return idioms.filter(idiom => idiom.text[idiom.text.length - 1] === char);
}

// 获取成语的最后一个字
export function getLastChar(idiom) {
  return idiom.text[idiom.text.length - 1];
}

// 获取成语的第一个字
export function getFirstChar(idiom) {
  return idiom.text[0];
}

// 验证成语是否存在
export function isValidIdiom(text) {
  return idioms.some(idiom => idiom.text === text);
}

// 获取随机成语
export function getRandomIdiom() {
  return idioms[Math.floor(Math.random() * idioms.length)];
}