import React, { useState } from 'react';
import { synthesizeSpeech } from '../utils/speechSynthesis';
import { FaPlay, FaStop } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface NewsCardProps {
  title: string;
  url: string;
  summary: string;
  keywords: string[];
  date: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ title, url, summary, keywords, date }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (text: string) => {
    console.log('开始播放音频，文本内容:', text.substring(0, 100) + '...');
    try {
      setIsPlaying(true);
      await synthesizeSpeech(text);
      setIsPlaying(false);
    } catch (error) {
      console.error('播放音频失败:', error);
      alert('播放失败，请查看控制台了解详细信息');
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6 mb-4 border border-gray-700">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-semibold text-blue-400">{title}</h3>
          {isPlaying ? (
            <button 
              onClick={handleStop}
              className="p-2 text-red-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-700/50"
              title="停止播放"
            >
              <FaStop size={14} />
            </button>
          ) : (
            <button 
              onClick={() => handlePlay(summary)}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700/50"
              title="播放摘要"
            >
              <FaPlay size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className="prose prose-invert max-w-none mb-4">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
};

export default NewsCard; 