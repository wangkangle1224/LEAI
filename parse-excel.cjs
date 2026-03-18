const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = [
  '分析图专题.xlsx',
  '建筑专题.xlsx',
  '景观专题.xlsx',
  '室内打光.xlsx',
  '室内专题.xlsx'
];

const categoryMap = {
  '分析图专题.xlsx': 'analysis',
  '建筑专题.xlsx': 'arch',
  '景观专题.xlsx': 'landscape',
  '室内打光.xlsx': 'interior_light',
  '室内专题.xlsx': 'interior'
};

const results = {};

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  console.log(`\n正在解析: ${file}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`工作表: ${sheetName}`);
  console.log(`数据行数: ${data.length}`);
  console.log('数据示例 (前3行):');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));
  
  const categoryId = categoryMap[file];
  results[categoryId] = data.map((row, index) => {
    // 获取所有列名
    const keys = Object.keys(row);
    console.log(`行 ${index + 1} 列名:`, keys);
    
    // 尝试找到提示词相关的列
    const label = row['提示词'] || row['名称'] || row['name'] || row['标题'] || row['Title'] || Object.values(row)[0];
    const value = row['关键词'] || row['关键词组'] || row['prompt'] || row['Prompt'] || row['value'] || Object.values(row)[1] || '';
    
    return {
      label: String(label || ''),
      value: value ? `, ${value}` : ''
    };
  }).filter(item => item.label); // 过滤掉没有标签的项
});

console.log('\n\n========== 最终结果 ==========');
console.log(JSON.stringify(results, null, 2));

// 保存到文件
fs.writeFileSync(
  path.join(__dirname, 'prompt-data.json'),
  JSON.stringify(results, null, 2)
);
console.log('\n已保存到 prompt-data.json');
