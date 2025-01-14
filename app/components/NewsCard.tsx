import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { NewsContent } from '../types/news';
import { TTSPlayer } from '../utils/speechSynthesis';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

interface NewsCardProps {
  keyword: string;
  summary: string;
  date: string;
  originalNews: NewsContent[];
}

export default function NewsCard({
  keyword,
  summary,
  date,
  originalNews
}: NewsCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsPlayer, setTtsPlayer] = useState<TTSPlayer | null>(null);

  useEffect(() => {
    console.log('NewsCard - 创建 TTSPlayer 实例');
    try {
      const player = new TTSPlayer();
      setTtsPlayer(player);
      console.log('NewsCard - TTSPlayer 实例创建成功');
    } catch (error) {
      console.error('NewsCard - TTSPlayer 实例创建失败:', error);
    }
  }, []);

  const handlePlayClick = async () => {
    console.log('NewsCard - 播放按钮被点击');
    if (!ttsPlayer) {
      console.error('NewsCard - TTSPlayer 实例不存在');
      return;
    }

    try {
      if (isPlaying) {
        console.log('NewsCard - 停止当前播放');
        ttsPlayer.stop();
        setIsPlaying(false);
      } else {
        console.log('NewsCard - 开始播放新内容, 文本长度:', summary.length);
        setIsPlaying(true);
        
        // 清理 Markdown 标记
        const cleanText = summary
          .replace(/#{1,6}\s/g, '') // 移除标题标记
          .replace(/\*\*/g, '') // 移除加粗标记
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
          .replace(/\n+/g, ' ') // 将多个换行替换为空格
          .trim();
        
        console.log('NewsCard - 清理后的文本长度:', cleanText.length);
        await ttsPlayer.synthesizeAndPlay(cleanText);
      }
    } catch (error) {
      console.error('NewsCard - 播放过程出错:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 shadow-lg border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-blue-400">{keyword}</h3>
          <button
            onClick={handlePlayClick}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors"
            title={isPlaying ? '停止播放' : '播放摘要'}
          >
            {isPlaying ? (
              <SpeakerXMarkIcon className="h-5 w-5 text-blue-400" />
            ) : (
              <SpeakerWaveIcon className="h-5 w-5 text-gray-400 hover:text-blue-400" />
            )}
          </button>
        </div>
        <span className="text-sm text-gray-400">{date}</span>
      </div>
      
      <div className="space-y-4">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown className="text-sm text-gray-300">
            {summary}
          </ReactMarkdown>
        </div>

        {originalNews && originalNews.length > 0 && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <h4 className="text-xs font-medium text-gray-400 mb-2">参考新闻：</h4>
            <div className="space-y-2">
              {originalNews.map((news, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-gray-500 text-xs">[{index + 1}]</span>
                  <a
                    href={news.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    {news.title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 