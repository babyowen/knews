import { fetchWeeklySummaries } from './utils/api';

async function testWeeklySummaries() {
  try {
    console.log('测试 1: 使用日期范围和关键词进行查询');
    const result1 = await fetchWeeklySummaries('2024/03/11-2024/03/17', '公积金');
    console.log('测试 1 结果:', JSON.stringify(result1, null, 2));

    console.log('\n测试 2: 只使用日期范围进行查询');
    const result2 = await fetchWeeklySummaries('2024/03/11-2024/03/17');
    console.log('测试 2 结果:', JSON.stringify(result2, null, 2));

    console.log('\n测试 3: 只使用关键词进行查询');
    const result3 = await fetchWeeklySummaries(undefined, '公积金');
    console.log('测试 3 结果:', JSON.stringify(result3, null, 2));

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testWeeklySummaries(); 