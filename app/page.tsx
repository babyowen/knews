"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { CalendarDaysIcon, MagnifyingGlassIcon, NewspaperIcon } from "@heroicons/react/24/outline";
import { getTenantAccessToken, fetchKeywords, fetchNewsSummaries, fetchOriginalNews } from './utils/api';
import ReactMarkdown from 'react-markdown';
import NewsCard from './components/NewsCard';
import { categorizeKeywords } from './utils/keywordUtils';
import { KeywordCategory } from './types/keywords';

interface NewsItem {
  keyword: string;
  summary: string;
  date: string;
  originalNews: NewsContent[];
}

export default function Home() {
  const getYesterday = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return yesterday;
  };

  const [selectedDate, setSelectedDate] = useState(getYesterday());
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaries, setSummaries] = useState<NewsItem[]>([]);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("Environment variables status:", {
      APP_ID: process.env.NEXT_PUBLIC_APP_ID ? "exists" : "missing",
      APP_SECRET: process.env.NEXT_PUBLIC_APP_SECRET ? "exists" : "missing",
      APP_TOKEN: process.env.NEXT_PUBLIC_APP_TOKEN ? "exists" : "missing",
      SUMMARY_TABLE_ID: process.env.NEXT_PUBLIC_SUMMARY_TABLE_ID ? "exists" : "missing",
      SUMMARY_VIEW_ID: process.env.NEXT_PUBLIC_SUMMARY_VIEW_ID ? "exists" : "missing",
    });
    
    async function loadKeywords() {
      const appId = process.env.NEXT_PUBLIC_APP_ID;
      const appSecret = process.env.NEXT_PUBLIC_APP_SECRET;
      const appToken = process.env.NEXT_PUBLIC_APP_TOKEN;
      const summaryTableId = process.env.NEXT_PUBLIC_SUMMARY_TABLE_ID;
      const summaryViewId = process.env.NEXT_PUBLIC_SUMMARY_VIEW_ID;

      console.log("Environment variables check:", {
        appId: appId ? `${appId.substring(0, 4)}...` : 'missing',
        appSecret: appSecret ? `${appSecret.substring(0, 4)}...` : 'missing',
        appToken: appToken ? `${appToken.substring(0, 4)}...` : 'missing',
        summaryTableId: summaryTableId || 'missing',
        summaryViewId: summaryViewId || 'missing'
      });

      if (appId && appSecret && appToken && summaryTableId && summaryViewId) {
        try {
          console.log("Starting to fetch tenant access token...");
          const tenantAccessToken = await getTenantAccessToken(appId, appSecret);
          console.log("Got tenant access token:", tenantAccessToken.substring(0, 4) + "****");
          
          console.log("Starting to fetch keywords...");
          const fetchedKeywords = await fetchKeywords(
            tenantAccessToken, 
            appToken, 
            summaryTableId,
            summaryViewId
          );
          console.log("Fetched keywords:", fetchedKeywords);
          
          if (Array.isArray(fetchedKeywords) && fetchedKeywords.length > 0) {
            console.log("Sorting keywords...");
            const sortedKeywords = [...fetchedKeywords].sort();
            setKeywords(sortedKeywords);
            console.log("Keywords set successfully:", sortedKeywords);
          } else {
            console.warn("No keywords found in response");
            setKeywords([]);
          }
        } catch (error) {
          console.error("Error in loadKeywords:", error);
          if (error instanceof Error) {
            console.error("Error details:", {
              message: error.message,
              stack: error.stack
            });
          }
          setKeywords([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.error("Missing environment variables");
        setKeywords([]);
        setIsLoading(false);
      }
    }

    loadKeywords();
  }, []);

  const handleDateClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const handleSearch = async () => {
    if (selectedKeywords.length === 0) {
      alert("请至少选择一个关键词");
      return;
    }

    console.log('handleSearch called with:', {
      date: selectedDate.toISOString().split('T')[0],
      selectedKeywords
    });

    setIsLoadingSummaries(true);
    setHasSearched(true);
    try {
      const appId = process.env.NEXT_PUBLIC_APP_ID;
      const appSecret = process.env.NEXT_PUBLIC_APP_SECRET;
      const appToken = process.env.NEXT_PUBLIC_APP_TOKEN;
      const summaryTableId = process.env.NEXT_PUBLIC_SUMMARY_TABLE_ID;
      const summaryViewId = process.env.NEXT_PUBLIC_SUMMARY_VIEW_ID;
      const newsTableId = process.env.NEXT_PUBLIC_NEWS_TABLE_ID;
      const newsViewId = process.env.NEXT_PUBLIC_NEWS_VIEW_ID;

      console.log('Environment variables loaded:', {
        appId: appId ? 'exists' : 'missing',
        appSecret: appSecret ? 'exists' : 'missing',
        appToken: appToken ? 'exists' : 'missing',
        summaryTableId,
        summaryViewId,
        newsTableId,
        newsViewId
      });

      if (!appId || !appSecret || !appToken || !summaryTableId || !summaryViewId || !newsTableId || !newsViewId) {
        throw new Error('Missing required environment variables');
      }

      const tenantAccessToken = await getTenantAccessToken(appId, appSecret);
      console.log('Got tenant access token');
      
      // 并行获取摘要和原始新闻
      const [summaries, originalNews] = await Promise.all([
        fetchNewsSummaries(
          tenantAccessToken,
          appToken,
          summaryTableId,
          summaryViewId,
          selectedDate.toISOString().split('T')[0],
          selectedKeywords
        ),
        fetchOriginalNews(
          tenantAccessToken,
          appToken,
          newsTableId,
          newsViewId,
          selectedDate.toISOString().split('T')[0],
          selectedKeywords
        )
      ]);

      console.log('Fetched data:', {
        summariesCount: summaries.length,
        originalNewsCount: originalNews.length
      });

      // 将原始新闻与摘要匹配
      const combinedResults = summaries.map(summary => {
        const matchingNews = originalNews.filter(
          news => news.keyword === summary.keyword && news.date === summary.date
        );
        
        return {
          ...summary,
          originalNews: matchingNews
        };
      });

      // 按照选择的关键词顺序排序
      const orderedResults = [...combinedResults].sort((a, b) => {
        const indexA = selectedKeywords.indexOf(a.keyword);
        const indexB = selectedKeywords.indexOf(b.keyword);
        return indexA - indexB;
      });

      console.log('Final results with original news:', orderedResults.map(r => ({
        keyword: r.keyword,
        originalNewsCount: r.originalNews.length,
        originalNewsTitles: r.originalNews.map(n => n.title)
      })));

      setSummaries(orderedResults);
    } catch (error) {
      console.error('Error in handleSearch:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setSummaries([]);
    } finally {
      setIsLoadingSummaries(false);
    }
  };

  const handleCategoryClick = (category: KeywordCategory) => {
    const categoryKeywords = category.keywords;
    const allSelected = categoryKeywords.every(k => selectedKeywords.includes(k));
    
    if (allSelected) {
      setSelectedKeywords(selectedKeywords.filter(k => !categoryKeywords.includes(k)));
    } else {
      const newKeywords = [...selectedKeywords];
      categoryKeywords.forEach(k => {
        if (!newKeywords.includes(k)) {
          newKeywords.push(k);
        }
      });
      setSelectedKeywords(newKeywords);
    }
  };

  const renderKeywords = () => {
    if (isLoading) {
      return (
        <div className="text-gray-400 animate-pulse flex items-center gap-2 col-span-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          读取关键词中......
        </div>
      );
    }

    const categories = categorizeKeywords(keywords);
    
    return (
      <>
        {/* 用户提示 */}
        <div className="col-span-2 mb-2 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            点击分类标题可以快速选择/取消选择该分类下的所有关键词
          </p>
        </div>

        {categories.map((category) => {
          const allSelected = category.keywords.every(k => selectedKeywords.includes(k));
          const someSelected = category.keywords.some(k => selectedKeywords.includes(k));
          
          return (
            <div key={category.name} className="col-span-2 mb-3">
              {/* 分类标题按钮 */}
              <div
                onClick={() => handleCategoryClick(category)}
                className={`
                  px-4 py-2 rounded-lg text-base font-semibold cursor-pointer
                  transition-all duration-300 transform hover:scale-102
                  flex items-center justify-between
                  ${allSelected ? 
                    'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20' : 
                    someSelected ?
                    'bg-gradient-to-r from-purple-600/50 to-blue-600/50 text-white shadow-md shadow-purple-500/10' :
                    'bg-gray-800/70 text-gray-300 hover:bg-gray-700/70'
                  }
                  hover:shadow-lg backdrop-blur-sm mb-2
                `}
              >
                <div className="flex items-center gap-2">
                  <span>{category.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/20">
                    {category.keywords.length}
                  </span>
                </div>
                
                {/* 选择状态指示器 */}
                <div className="flex items-center gap-1">
                  {allSelected && (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                      已全选
                    </span>
                  )}
                  {someSelected && !allSelected && (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                      部分选择
                    </span>
                  )}
                  <svg 
                    className={`w-4 h-4 transition-transform duration-300 ${allSelected ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </div>
              </div>

              {/* 关键词网格 - 改为一行最多4个 */}
              <div className="grid grid-cols-4 gap-1.5">
                {category.keywords.map((keyword) => {
                  const isSelected = selectedKeywords.includes(keyword);
                  return (
                    <div
                      key={keyword}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
                        } else {
                          setSelectedKeywords([...selectedKeywords, keyword]);
                        }
                      }}
                      className={`
                        px-2 py-1 rounded-full text-xs font-medium cursor-pointer
                        transition-all duration-300 transform hover:scale-105
                        flex items-center justify-center gap-1
                        ${isSelected ? 
                          'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20' : 
                          'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        }
                        hover:shadow-lg hover:shadow-blue-500/10
                        backdrop-blur-sm
                        whitespace-nowrap overflow-hidden text-ellipsis
                      `}
                    >
                      <span className="truncate">{keyword}</span>
                      {isSelected && (
                        <svg 
                          className="w-3 h-3 flex-shrink-0"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4 pb-12 sm:p-12">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-wide bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text drop-shadow-lg">
          KeyWord News AI Summary
        </h1>
        <p className="text-base text-gray-400 mt-2">根据关键词每天收集新闻，由AI进行总结</p>
      </header>

      {/* Main content */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Sidebar */}
        <aside className="col-span-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-700">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-400">
              <CalendarDaysIcon className="h-5 w-5" /> 选择日期
            </h2>
            <div className="flex items-center gap-2" onClick={handleDateClick}>
              <input
                type="date"
                ref={dateInputRef}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  newDate.setHours(0, 0, 0, 0);
                  setSelectedDate(newDate);
                }}
              />
              <CalendarDaysIcon className="h-5 w-5 text-blue-400 cursor-pointer" />
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-400">
              <NewspaperIcon className="h-5 w-5" /> 选择关键词
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {renderKeywords()}
            </div>
            {selectedKeywords.length > 0 && (
              <button
                onClick={() => setSelectedKeywords([])}
                className="mt-2 w-full px-2 py-1 text-xs border border-gray-600 rounded-lg 
                         text-gray-400 hover:text-white hover:border-gray-400
                         transition-all duration-300 flex items-center justify-center gap-1
                         bg-gray-800/30 hover:bg-gray-700/30"
              >
                <svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
                清除选择
              </button>
            )}
          </div>

          <button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg 
                     hover:shadow-lg hover:scale-105 transition transform flex items-center justify-center gap-2 
                     focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            onClick={handleSearch}
          >
            <MagnifyingGlassIcon className="h-4 w-4" /> 查找
          </button>
        </aside>

        {/* Main section */}
        <main className="col-span-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <NewspaperIcon className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl font-semibold">新闻总结</h2>
          </div>
          
          {isLoadingSummaries ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : summaries.length > 0 ? (
            <div className="space-y-6">
              {summaries.map((item, index) => {
                const formattedDate = new Date(item.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
                
                return (
                  <NewsCard
                    key={index}
                    keyword={item.keyword}
                    summary={item.summary}
                    date={formattedDate}
                    originalNews={item.originalNews}
                  />
                );
              })}
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center text-gray-400 p-8">
              <svg 
                className="w-12 h-12 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 21a9 9 0 110-18 9 9 0 010 18z" 
                />
              </svg>
              <p className="text-lg">未找到任何新闻AI总结</p>
            </div>
          ) : (
            <p className="text-gray-300 text-lg">请选择日期和关键词后点击查找按钮...</p>
          )}
        </main>
      </div>
    </div>
  );
}
