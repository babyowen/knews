import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { NewsContent } from '../types/news';

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

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 shadow-lg border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-blue-400">{keyword}</h3>
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