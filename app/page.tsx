"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { CalendarDaysIcon, MagnifyingGlassIcon, NewspaperIcon } from "@heroicons/react/24/outline";
import { getTenantAccessToken, fetchKeywords, fetchNewsSummaries } from './utils/api';
import ReactMarkdown from 'react-markdown';
import NewsCard from './components/NewsCard';

interface NewsItem {
  keyword: string;
  summary: string;
  date: string;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
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
      TABLE_ID: process.env.NEXT_PUBLIC_TABLE_ID ? "exists" : "missing",
    });
    
    async function loadKeywords() {
      const appId = process.env.NEXT_PUBLIC_APP_ID;
      const appSecret = process.env.NEXT_PUBLIC_APP_SECRET;
      const appToken = process.env.NEXT_PUBLIC_APP_TOKEN;
      const tableId = process.env.NEXT_PUBLIC_TABLE_ID;

      console.log("Environment variables check:", {
        appId: appId ? `${appId.substring(0, 4)}...` : 'missing',
        appSecret: appSecret ? `${appSecret.substring(0, 4)}...` : 'missing',
        appToken: appToken ? `${appToken.substring(0, 4)}...` : 'missing',
        tableId: tableId || 'missing'
      });

      if (appId && appSecret && appToken && tableId) {
        try {
          console.log("Starting to fetch tenant access token...");
          const tenantAccessToken = await getTenantAccessToken(appId, appSecret);
          console.log("Got tenant access token:", tenantAccessToken.substring(0, 4) + "****");
          
          console.log("Starting to fetch keywords...");
          const fetchedKeywords = await fetchKeywords(tenantAccessToken, appToken, tableId);
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

    setIsLoadingSummaries(true);
    setHasSearched(true);
    try {
      const appId = process.env.NEXT_PUBLIC_APP_ID;
      const appSecret = process.env.NEXT_PUBLIC_APP_SECRET;
      const appToken = process.env.NEXT_PUBLIC_APP_TOKEN;
      const tableId = process.env.NEXT_PUBLIC_TABLE_ID;

      if (appId && appSecret && appToken && tableId) {
        const tenantAccessToken = await getTenantAccessToken(appId, appSecret);
        const fetchedSummaries = await fetchNewsSummaries(
          tenantAccessToken,
          appToken,
          tableId,
          selectedDate.toISOString().split('T')[0],
          selectedKeywords
        );

        setSummaries(fetchedSummaries);
      }
    } catch (error) {
      console.error("Error fetching summaries:", error);
      setSummaries([]);
    } finally {
      setIsLoadingSummaries(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8 pb-20 sm:p-20">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-wide bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text drop-shadow-lg">
          KeyWord News AI Summary
        </h1>
        <p className="text-lg text-gray-400 mt-4">根据关键词每天收集新闻，由AI进行总结</p>
      </header>

      {/* Main content */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
        {/* Sidebar */}
        <aside className="col-span-1 bg-white/10 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-gray-700">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2 text-blue-400">
              <CalendarDaysIcon className="h-6 w-6" /> 选择日期
            </h2>
            <div className="flex items-center gap-2" onClick={handleDateClick}>
              <input
                type="date"
                ref={dateInputRef}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
              <CalendarDaysIcon className="h-6 w-6 text-blue-400 cursor-pointer" />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-purple-400">
              <NewspaperIcon className="h-6 w-6" /> 选择关键词
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {isLoading ? (
                <div className="text-gray-400 animate-pulse flex items-center gap-2 col-span-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  读取关键词中......
                </div>
              ) : (
                keywords.map((keyword) => {
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
                        px-4 py-2 rounded-full text-sm font-medium cursor-pointer
                        transition-all duration-300 transform hover:scale-105
                        flex items-center justify-center gap-2
                        ${isSelected ? 
                          'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20' : 
                          'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                        }
                        hover:shadow-lg hover:shadow-blue-500/10
                        backdrop-blur-sm
                      `}
                    >
                      <span>{keyword}</span>
                      {isSelected && (
                        <svg 
                          className="w-4 h-4" 
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
                })
              )}
            </div>
            {selectedKeywords.length > 0 && (
              <button
                onClick={() => setSelectedKeywords([])}
                className="mt-3 w-full px-3 py-1.5 text-sm border border-gray-600 rounded-lg 
                         text-gray-400 hover:text-white hover:border-gray-400
                         transition-all duration-300 flex items-center justify-center gap-2
                         bg-gray-800/30 hover:bg-gray-700/30"
              >
                <svg 
                  className="w-4 h-4" 
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
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg 
                     hover:shadow-lg hover:scale-105 transition transform flex items-center justify-center gap-2 
                     focus:outline-none focus:ring-2 focus:ring-purple-500"
            onClick={handleSearch}
          >
            <MagnifyingGlassIcon className="h-5 w-5" /> 查找
          </button>
        </aside>

        {/* Main section */}
        <main className="col-span-2 bg-white/10 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <NewspaperIcon className="h-8 w-8 text-purple-400" />
            <h2 className="text-3xl font-semibold">新闻总结</h2>
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
                    title={item.keyword}
                    url=""
                    summary={item.summary}
                    keywords={[item.keyword]}
                    date={formattedDate}
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
