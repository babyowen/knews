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

// 将长文本分割成较短的片段
function splitTextIntoChunks(text: string, maxLength: number = 4096): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // 按句号分割文本
  const sentences = text.split('。');
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence + '。';
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence + '。';
    }
  }
  
  if (currentChunk) chunks.push(currentChunk);
  console.log('文本分段结果:', chunks.length, '个片段');
  return chunks;
}

export async function synthesizeSpeech(text: string, voice: string): Promise<void> {
  try {
    // 清理文本
    const cleanedText = cleanTextForSpeech(text);
    console.log('清理后的文本:', cleanedText);

    // 分割文本
    const textChunks = splitTextIntoChunks(cleanedText);
    console.log(`准备播放 ${textChunks.length} 个文本片段`);

    // 创建音频上下文
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 顺序播放每个文本片段
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`开始处理第 ${i + 1}/${textChunks.length} 个片段...`);

      // 调用我们的 API 获取音频
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: chunk, voice }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 获取音频数据并播放
      const audioData = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      
      await new Promise<void>((resolve) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => resolve();
        // 移除 onerror 处理，改用 try-catch
        try {
          source.start(0);
        } catch (error) {
          console.error('音频播放失败:', error);
          throw error;
        }
      });

      console.log(`第 ${i + 1} 个片段播放完成`);
    }
    
    console.log('所有文本片段播放完成');
  } catch (error) {
    console.error('语音合成失败:', error);
    throw error;
  }
} 