// 清理文本，移除 Markdown 和 emoji
function cleanTextForSpeech(text: string): string {
  return text
    // 移除 Markdown 标题
    .replace(/#{1,6}\s/g, '')
    // 移除 Markdown 加粗
    .replace(/\*\*/g, '')
    // 移除 Markdown 斜体
    .replace(/\*/g, '')
    // 移除 Markdown 链接
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除 emoji（Unicode 表情符号范围）
    .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // 移除多余的空格和换行
    .replace(/\s+/g, ' ')
    .trim();
}

export async function synthesizeSpeech(text: string): Promise<void> {
  try {
    // 检查浏览器是否支持语音合成
    if (!window.speechSynthesis) {
      throw new Error('您的浏览器不支持语音合成功能');
    }

    // 清理文本
    const cleanedText = cleanTextForSpeech(text);
    console.log('清理后的文本:', cleanedText);

    // 创建语音合成实例
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // 设置语音参数
    utterance.lang = 'zh-CN';  // 设置语言为中文
    utterance.rate = 1;        // 语速 (0.1 到 10)
    utterance.pitch = 1;       // 音高 (0 到 2)
    utterance.volume = 1;      // 音量 (0 到 1)

    // 播放语音
    return new Promise((resolve, reject) => {
      utterance.onend = () => {
        console.log('语音播放完成');
        resolve();
      };

      utterance.onerror = (event) => {
        // 如果是被主动中断的，不视为错误
        if (event.error === 'interrupted') {
          console.log('语音播放被中断');
          resolve();
        } else {
          console.error('语音播放错误:', event);
          reject(new Error('语音播放失败'));
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  } catch (error) {
    console.error('语音合成失败:', error);
    throw error;
  }
} 