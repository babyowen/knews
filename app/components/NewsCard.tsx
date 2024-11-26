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

/**
 * NewsCard组件 - 用于显示单条新闻信息的卡片组件
 * 
 * @component
 * @param {NewsCardProps} props - 组件属性
 * @param {string} props.title - 新闻标题
 * @param {string} props.url - 新闻链接
 * @param {string} props.summary - 新闻摘要
 * @param {string[]} props.keywords - 关键词数组
 * @param {string} props.date - 新闻日期
 */
const NewsCard: React.FC<NewsCardProps> = ({ title, url, summary, keywords, date }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * 处理播放按钮点击事件
   * @param {string} text - 要播放的文本内容
   */
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

  /**
   * 处理停止播放按钮点击事件
   */
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