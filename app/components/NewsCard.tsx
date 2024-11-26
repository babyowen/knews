import React, { useState, useEffect } from 'react';
import { synthesizeSpeech } from '../utils/speechSynthesis';
import { fetchNewsLinks } from '../utils/api';
import { FaPlay, FaStop } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface NewsLink {
  title: string;
  link: string;
}

interface NewsCardProps {
  title: string;
  url: string;
  summary: string;
  keywords: string[];
  date: string;
  tenantAccessToken: string;
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
 * @param {string} props.tenantAccessToken - 租户访问令牌
 */
const NewsCard: React.FC<NewsCardProps> = ({ 
  title, 
  url, 
  summary, 
  keywords, 
  date, 
  tenantAccessToken,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [newsLinks, setNewsLinks] = useState<NewsLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setIsLoading(true);
        console.log('=== NewsCard Debug Info ===');
        
        // 确保日期格式一致
        const formattedDate = new Date(date).toISOString().split('T')[0].replace(/-/g, '/');
        
        console.log('1. Starting fetch with:', {
          hasToken: !!tenantAccessToken,
          tokenPreview: tenantAccessToken ? `${tenantAccessToken.substring(0, 10)}...` : 'MISSING',
          date: formattedDate,
          keyword: keywords[0]
        });

        if (!tenantAccessToken) {
          console.error('2. Error: Missing tenant access token');
          return;
        }

        // 使用新闻链接专用的表格 ID
        const newsTableId = process.env.NEXT_PUBLIC_NEWS_TABLE_ID;
        console.log('3. Table ID check:', {
          tableId: newsTableId,
          isValid: !!newsTableId,
          envValue: process.env.NEXT_PUBLIC_NEWS_TABLE_ID,
          appToken: process.env.NEXT_PUBLIC_APP_TOKEN
        });

        if (!newsTableId) {
          console.error('4. Error: Missing news table ID');
          return;
        }

        console.log('5. Calling fetchNewsLinks with params:', {
          tableId: newsTableId,
          date: formattedDate,
          keyword: keywords[0]
        });
        
        const links = await fetchNewsLinks(
          tenantAccessToken,
          newsTableId,
          formattedDate,  // 使用格式化后的日期
          keywords[0]
        );
        
        console.log('6. Received links:', links);
        setNewsLinks(links);
      } catch (error) {
        console.error('7. Failed to fetch news links:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 防止重复请求
    let isSubscribed = true;

    if (keywords.length > 0 && tenantAccessToken) {
      console.log('Starting to fetch news links for:', {
        keyword: keywords[0],
        date,
        hasToken: !!tenantAccessToken
      });
      fetchLinks().then(() => {
        if (!isSubscribed) {
          console.log('Request cancelled due to component unmount or re-render');
        }
      });
    } else {
      console.log('Skipping news links fetch:', {
        hasKeywords: keywords.length > 0,
        hasToken: !!tenantAccessToken
      });
    }

    return () => {
      isSubscribed = false;
    };
  }, [date, keywords, tenantAccessToken]);

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

      <div className="mt-4 border-t border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">相关新闻链接：</h4>
        {isLoading ? (
          <p className="text-sm text-gray-500">加载中...</p>
        ) : newsLinks.length > 0 ? (
          <ul className="space-y-2">
            {newsLinks.map((newsLink, index) => (
              <li key={index}>
                <a
                  href={newsLink.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm block truncate"
                >
                  {newsLink.title || '无标题'}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">暂无相关新闻链接</p>
        )}
      </div>
    </div>
  );
};

export default NewsCard; 