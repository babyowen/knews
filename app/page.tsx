"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { CalendarDaysIcon, MagnifyingGlassIcon, NewspaperIcon } from "@heroicons/react/24/outline";
import { getTenantAccessToken, fetchKeywords, fetchNewsSummaries, fetchNewsLinks } from './utils/api';
import ReactMarkdown from 'react-markdown';

interface NewsItem {
  keyword: string;
  summary: string;
  date: string;
  links?: { title: string; link: string }[];
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
    async function loadKeywords() {
      const appId = process.env.NEXT_PUBLIC_APP_ID;
      const appSecret = process.env.NEXT_PUBLIC_APP_SECRET;
      const appToken = process.env.NEXT_PUBLIC_APP_TOKEN;
      const tableId = process.env.NEXT_PUBLIC_TABLE_ID;

      if (appId && appSecret && appToken && tableId) {
        try {
          const tenantAccessToken = await getTenantAccessToken(appId, appSecret);
          const fetchedKeywords = await fetchKeywords(tenantAccessToken, appToken, tableId);
          setKeywords(fetchedKeywords);
        } catch (error) {
          console.error("Error in loadKeywords:", error);
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
    console.log("Search function triggered");
    console.log("handleSearch triggered with:", {
      selectedKeywords,
      selectedDate: selectedDate.toISOString().split('T')[0]
    });

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
      const localTableId = process.env.LOCAL_TABLE_ID;

      console.log("Environment variables check:", {
        hasAppId: !!appId,
        hasAppSecret: !!appSecret,
        hasAppToken: !!appToken,
        hasTableId: !!tableId,
        hasLocalTableId: !!localTableId
      });

      if (appId && appSecret && appToken && tableId && localTableId) {
        // 1. 获取 token
        console.log("Getting tenant access token...");
        const tenantAccessToken = await getTenantAccessToken(appId, appSecret);
        console.log("Got tenant access token");

        // 2. 获取新闻总结
        const searchDate = selectedDate.toISOString().split('T')[0];
        console.log("Fetching summaries with:", {
          date: searchDate,
          keywords: selectedKeywords
        });

        const fetchedSummaries = await fetchNewsSummaries(
          tenantAccessToken,
          appToken,
          tableId,
          searchDate,
          selectedKeywords
        );

        console.log("Fetched Summaries:", fetchedSummaries);

        if (fetchedSummaries.length === 0) {
          console.log("No summaries found");
          setSummaries([]);
          return;
        }

        // 3. 获取新闻链接
        console.log("Fetching links...");
        const fetchedLinks = await fetchNewsLinks(
          tenantAccessToken,
          appToken,
          localTableId,
          searchDate,
          selectedKeywords
        );

        console.log("Fetched Links:", fetchedLinks);

        // 4. 合并新闻总结和链接
        const combinedSummaries = fetchedSummaries.map(summary => {
          const summaryLinks = fetchedLinks.filter(link => link.keyword === summary.keyword);
          console.log(`Links for keyword ${summary.keyword}:`, summaryLinks);
          return {
            ...summary,
            links: summaryLinks
          };
        });

        console.log("Final combined summaries:", combinedSummaries);

        setSummaries(combinedSummaries);
      } else {
        console.error("Missing required environment variables");
        throw new Error("Missing required environment variables");
      }
    } catch (error) {
      console.error("Error in handleSearch:", error);
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
            onClick={() => {
              console.log("Search button clicked");
              handleSearch();
            }}
            type="button"
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
              {summaries.map((item, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-xl font-semibold text-blue-400 mb-2">
                    {item.keyword}
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{item.summary}</ReactMarkdown>
                    {item.links && item.links.length > 0 && (
                      <ul className="mt-2">
                        {item.links.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <a href={link.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                              {link.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
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
