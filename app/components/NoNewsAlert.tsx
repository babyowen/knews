import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface NoNewsAlertProps {
  keywords: string[];
  date: string;
}

export default function NoNewsAlert({ keywords, date }: NoNewsAlertProps) {
  return (
    <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 mt-4">
      <div className="flex items-start gap-2">
        <InformationCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            以下关键词在 {date} 暂无相关新闻：
          </h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span 
                key={keyword}
                className="px-2 py-1 bg-gray-700/30 rounded-md text-xs text-gray-400"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 