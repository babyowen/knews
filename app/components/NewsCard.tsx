import React, { useState } from 'react';
import { synthesizeSpeech } from '../utils/speechSynthesis';
import { FaPlay } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface NewsCardProps {
  title: string;
  url: string;
  summary: string;
  keywords: string[];
  date: string;
}

const VOICE_OPTIONS = [
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓（女声）' },
  { id: 'zh-CN-YunxiNeural', name: '云希（男声）' },
  { id: 'zh-CN-YunyangNeural', name: '云扬（男声）' },
  { id: 'zh-CN-XiaochenNeural', name: '晓辰（女声）' },
  { id: 'zh-CN-XiaohanNeural', name: '晓涵（女声）' },
  { id: 'zh-CN-XiaomengNeural', name: '晓梦（女声）' },
  { id: 'zh-CN-XiaomoNeural', name: '晓墨（女声）' },
  { id: 'zh-CN-XiaoqiuNeural', name: '晓秋（女声）' },
  { id: 'zh-CN-XiaoruiNeural', name: '晓睿（女声）' },
  { id: 'zh-CN-XiaoshuangNeural', name: '晓双（女声-儿童）' },
  { id: 'zh-CN-XiaoxuanNeural', name: '晓萱（女声）' },
  { id: 'zh-CN-XiaoyanNeural', name: '晓颜（女声）' },
  { id: 'zh-CN-XiaoyouNeural', name: '晓悠（女声-儿童）' },
  { id: 'zh-CN-YunfengNeural', name: '云枫（男声）' },
  { id: 'zh-CN-YunhaoNeural', name: '云皓（男声）' },
  { id: 'zh-CN-YunjianNeural', name: '云健（男声）' },
  { id: 'zh-CN-YunxiaNeural', name: '云夏（男声）' },
  { id: 'zh-CN-YunzeNeural', name: '云泽（男声）' },
];

const NewsCard: React.FC<NewsCardProps> = ({ title, url, summary, keywords, date }) => {
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);

  const handlePlay = async (text: string) => {
    console.log('开始播放音频，文本内容:', text.substring(0, 100) + '...');
    try {
      await synthesizeSpeech(text, selectedVoice);
    } catch (error) {
      console.error('播放音频失败:', error);
      alert('播放失败，请查看控制台了解详细信息');
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-md rounded-lg p-6 mb-4 border border-gray-700">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-semibold text-blue-400">{title}</h3>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="bg-gray-700 text-gray-200 text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            {VOICE_OPTIONS.map(voice => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
          <button 
            onClick={() => handlePlay(summary)}
            className="p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-full hover:bg-gray-700/50"
            title="播放摘要"
          >
            <FaPlay size={14} />
          </button>
          <span className="text-gray-400 text-sm">{date}</span>
        </div>
      </div>
      
      <div className="prose prose-invert max-w-none mb-4">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
};

export default NewsCard; 