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
    try {
      const player = new TTSPlayer();
      setTtsPlayer(player);
    } catch (error) {
      console.error('播放器初始化失败');
    }

    return () => {
      if (ttsPlayer) {
        ttsPlayer.stop();
      }
    };
  }, []);

  const handlePlayClick = async () => {
    if (!ttsPlayer) {
      return;
    }

    try {
      if (isPlaying) {
        ttsPlayer.stop();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        
        // 清理 Markdown 标记
        const cleanText = summary
          .replace(/#{1,6}\s/g, '')
          .replace(/\*\*/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\n+/g, ' ')
          .trim();
        
        try {
          await ttsPlayer.synthesizeAndPlay(cleanText);
          setIsPlaying(false);
        } catch (error) {
          console.error('播放失败:', error);
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error('播放处理失败:', error);
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
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            title={isPlaying ? '停止播放' : '播放摘要'}
          >
            {isPlaying ? (
              <SpeakerXMarkIcon className="h-6 w-6 text-blue-400" />
            ) : (
              <SpeakerWaveIcon className="h-6 w-6 text-gray-400 hover:text-blue-400" />
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