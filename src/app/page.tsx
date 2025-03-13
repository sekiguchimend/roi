"use client"
import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const ChatbotROICalculator = () => {
  // 初期値の設定
  const [inputs, setInputs] = useState({
    inquiryCount: 500,
    hourlyRate: 2500,
    timePerInquiry: 10,
    botEfficiency: 70,
    botMonthlyCost: 100000,
    setupCost: 500000,
    amortizationMonths: 12,
    workHoursPerMonth: 160,
    industryType: 'IT・テクノロジー',
    internalQuestionsEnabled: true,
    internalQuestionsCount: 300,
    managerHourlyRate: 3500,
    timePerInternalQuestion: 15

  });

  // タブ管理用の状態
  const [activeTab, setActiveTab] = useState('efficiency');

  // 質問履歴分析の設定
  const [questionHistory, setQuestionHistory] = useState({
    enabled: true,
    storageDays: 90,
    analysisFrequency: 'monthly',
    additionalInsightValue: 15, // パーセント
  });

  // 質問カテゴリの分布（サンプルデータ）
  const [questionCategories, setQuestionCategories] = useState([
    { name: '社内システム', value: 35 },
    { name: '福利厚生', value: 25 },
    { name: '業務手順', value: 20 },
    { name: 'IT関連', value: 15 },
    { name: 'その他', value: 5 }
  ]);

  // 入力値に基づく計算結果
  const [results, setResults] = useState({
    breakEvenPoint: 0,
    monthlySavings: 0,
    annualSavings: 0,
    roiMonths: 0,
    fteSaved: 0,
    currentCost: 0,
    newCost: 0,
    botCost: 0,
    remainingStaffCost: 0,
    insightBenefit: 0,
    totalValue: 0,
    effectiveEfficiency: 0 ,
    baseEfficiency: 0  // この行を追加

  });

  // 業種別のデフォルト効率と応答時間
  const industryDefaults = {
    'IT・テクノロジー': { botEfficiency: 75, timePerInquiry: 8 },
    '金融・保険': { botEfficiency: 65, timePerInquiry: 12 },
    '製造業': { botEfficiency: 70, timePerInquiry: 10 },
    '小売・流通': { botEfficiency: 68, timePerInquiry: 9 },
    '医療・ヘルスケア': { botEfficiency: 60, timePerInquiry: 15 },
    '教育・学習支援': { botEfficiency: 72, timePerInquiry: 7 },
    'その他サービス業': { botEfficiency: 65, timePerInquiry: 10 }
  };

  // 業種を変更した時のデフォルト値を設定
 // 業種を変更した時のデフォルト値を設定
useEffect(() => {
  // デフォルト値を定義
  const defaultBotEfficiency = 65;
  const defaultTimePerInquiry = 10;
  
  // TypeScriptの型安全なチェック方法を使用
  const selectedIndustry = inputs.industryType as keyof typeof industryDefaults;
  
  if (selectedIndustry && Object.prototype.hasOwnProperty.call(industryDefaults, selectedIndustry)) {
    // 選択した業種のデフォルト値を適用
    setInputs(prev => ({
      ...prev,
      botEfficiency: industryDefaults[selectedIndustry].botEfficiency,
      timePerInquiry: industryDefaults[selectedIndustry].timePerInquiry
    }));
  } else {
    // 業種がない場合や対応するデフォルト値がない場合はフォールバック値を使用
    setInputs(prev => ({
      ...prev,
      botEfficiency: defaultBotEfficiency,
      timePerInquiry: defaultTimePerInquiry
    }));
  }
}, [inputs.industryType]);
  // 計算結果を更新
  useEffect(() => {
    calculateResults();
  }, [inputs, questionHistory]);

  // 損益分岐点を計算
  const findBreakEvenPoint = () => {
    const params = {
      staffHourlyCost: inputs.hourlyRate,
      avgInquiryTimeMinutes: inputs.timePerInquiry,
      staffWorkHoursPerMonth: inputs.workHoursPerMonth,
      chatbotMonthlyCost: inputs.botMonthlyCost,
      chatbotSetupCost: inputs.setupCost,
      chatbotEfficiency: inputs.botEfficiency / 100,
      amortizationMonths: inputs.amortizationMonths,
      internalQuestionsEnabled: inputs.internalQuestionsEnabled,
      internalQuestionsCount: inputs.internalQuestionsCount,
      timePerInternalQuestion: inputs.timePerInternalQuestion,
      managerHourlyRate: inputs.managerHourlyRate,
      insightMultiplier: questionHistory.enabled ? (1 + questionHistory.additionalInsightValue / 100) : 1
    };

    let low = 0;
    let high = 10000;
    let mid;
    
    while (high - low > 1) {
      mid = Math.floor((high + low) / 2);
      const savings = calculateSavings(mid, params);
      
      if (savings > 0) {
        high = mid;
      } else {
        low = mid;
      }
    }
    
    return high;
  };

  // 月間削減額計算
  const calculateSavings = (inquiryCount:any, params:any) => {
    // 通常の問い合わせに関する計算
    const hourlyInquiries = inquiryCount * params.avgInquiryTimeMinutes / 60;
    const currentMonthlyCost = hourlyInquiries * params.staffHourlyCost;
    
    // 質問履歴分析による効率改善を考慮
    const adjustedEfficiency = params.chatbotEfficiency * params.insightMultiplier;
    const effectiveEfficiency = Math.min(adjustedEfficiency, 0.95); // 最大95%まで
    
    const remainingInquiries = inquiryCount * (1 - effectiveEfficiency);
    const remainingHours = remainingInquiries * params.avgInquiryTimeMinutes / 60;
    const remainingStaffCost = remainingHours * params.staffHourlyCost;
    
    // 社内の上司への質問に関する計算
    let internalSavings = 0;
    
    if (params.internalQuestionsEnabled) {
      const internalHourlyQuestions = params.internalQuestionsCount * params.timePerInternalQuestion / 60;
      const internalCurrentCost = internalHourlyQuestions * params.managerHourlyRate;
      
      const remainingInternalQuestions = params.internalQuestionsCount * (1 - effectiveEfficiency);
      const remainingInternalHours = remainingInternalQuestions * params.timePerInternalQuestion / 60;
      const internalRemainingCost = remainingInternalHours * params.managerHourlyRate;
      
      internalSavings = internalCurrentCost - internalRemainingCost;
    }
    
    const totalChatbotCost = params.chatbotMonthlyCost + (params.chatbotSetupCost / params.amortizationMonths);
    
    return (currentMonthlyCost - remainingStaffCost) + internalSavings - totalChatbotCost;
  };

  // すべての計算結果を更新
  const calculateResults = () => {
    const insightMultiplier = questionHistory.enabled ? (1 + questionHistory.additionalInsightValue / 100) : 1;
    const adjustedEfficiency = inputs.botEfficiency / 100 * insightMultiplier;
    const effectiveEfficiency = Math.min(adjustedEfficiency, 0.95); // 最大95%まで
    
    // 通常の問い合わせに関する計算
    const hourlyInquiries = inputs.inquiryCount * inputs.timePerInquiry / 60;
    const currentMonthlyCost = hourlyInquiries * inputs.hourlyRate;
    
    const remainingInquiries = inputs.inquiryCount * (1 - effectiveEfficiency);
    const remainingHours = remainingInquiries * inputs.timePerInquiry / 60;
    const remainingStaffCost = remainingHours * inputs.hourlyRate;
    
    // 社内の上司への質問に関する計算
    let internalSavings = 0;
    let internalCurrentCost = 0;
    let internalRemainingCost = 0;
    let internalFTESaved = 0;
    
    if (inputs.internalQuestionsEnabled) {
      const internalHourlyQuestions = inputs.internalQuestionsCount * inputs.timePerInternalQuestion / 60;
      internalCurrentCost = internalHourlyQuestions * inputs.managerHourlyRate;
      
      const remainingInternalQuestions = inputs.internalQuestionsCount * (1 - effectiveEfficiency);
      const remainingInternalHours = remainingInternalQuestions * inputs.timePerInternalQuestion / 60;
      internalRemainingCost = remainingInternalHours * inputs.managerHourlyRate;
      
      internalSavings = internalCurrentCost - internalRemainingCost;
      
      const internalCurrentFTE = internalHourlyQuestions / inputs.workHoursPerMonth;
      const internalNewFTE = remainingInternalHours / inputs.workHoursPerMonth;
      internalFTESaved = internalCurrentFTE - internalNewFTE;
    }
    
    // 合計コストの計算
    const totalChatbotCost = inputs.botMonthlyCost + (inputs.setupCost / inputs.amortizationMonths);
    const totalCurrentCost = currentMonthlyCost + internalCurrentCost;
    const totalRemainingCost = remainingStaffCost + internalRemainingCost + totalChatbotCost;
    
    const monthlySavings = (currentMonthlyCost + internalCurrentCost) - (remainingStaffCost + internalRemainingCost + totalChatbotCost);
    const annualSavings = monthlySavings * 12;
    const roiMonths = monthlySavings > 0 ? (inputs.setupCost / monthlySavings) : 0;
    
    const currentFTE = hourlyInquiries / inputs.workHoursPerMonth;
    const newFTE = remainingHours / inputs.workHoursPerMonth;
    const fteSaved = (currentFTE - newFTE) + internalFTESaved;
    
    const breakEvenPoint = findBreakEvenPoint();
    
    // 質問履歴分析による追加メリットを計算
    const baseValue = currentMonthlyCost + internalCurrentCost;
    const insightBenefit = questionHistory.enabled 
      ? baseValue * (inputs.botEfficiency / 100) * (questionHistory.additionalInsightValue / 100)
      : 0;
    
    const totalValue = monthlySavings + insightBenefit;

    setResults({
      breakEvenPoint,
      monthlySavings,
      annualSavings,
      roiMonths,
      fteSaved,
      currentCost: totalCurrentCost,
      newCost: totalRemainingCost,
      botCost: totalChatbotCost,
      remainingStaffCost: remainingStaffCost + internalRemainingCost,
      insightBenefit,
      totalValue,
      baseEfficiency: inputs.botEfficiency,
      effectiveEfficiency: effectiveEfficiency * 100
    });
  };

  // 質問履歴分析の影響を示すデータを生成
  const generateHistoryImpactData = () => {
    const data = [];
    for (let i = 0; i <= 30; i += 5) {
      const baseEfficiency = inputs.botEfficiency / 100;
      const adjustedEfficiency = Math.min(baseEfficiency * (1 + i / 100), 0.95);
      
      const params = {
        staffHourlyCost: inputs.hourlyRate,
        avgInquiryTimeMinutes: inputs.timePerInquiry,
        staffWorkHoursPerMonth: inputs.workHoursPerMonth,
        chatbotMonthlyCost: inputs.botMonthlyCost,
        chatbotSetupCost: inputs.setupCost,
        chatbotEfficiency: adjustedEfficiency,
        amortizationMonths: inputs.amortizationMonths,
        internalQuestionsEnabled: inputs.internalQuestionsEnabled,
        internalQuestionsCount: inputs.internalQuestionsCount,
        timePerInternalQuestion: inputs.timePerInternalQuestion,
        managerHourlyRate: inputs.managerHourlyRate,
        insightMultiplier: 1
      };
      
      data.push({
        improvement: i,
        savings: calculateSavings(inputs.inquiryCount, params),
        efficiency: Math.round(adjustedEfficiency * 100)
      });
    }
    
    return data;
  };

  // 質問のカテゴリ分布データを取得
  const getQuestionCategoryData = () => {
    return questionCategories.map(category => ({
      ...category,
      value: Math.round(category.value)
    }));
  };
  
  // 質問の複雑さレベルのサンプルデータ（1-5の難易度スケール）
  const [questionComplexity, setQuestionComplexity] = useState({
    simple: 60,  // 1-2レベル（簡単な質問）
    medium: 30,  // 3レベル（中程度の質問）
    complex: 10  // 4-5レベル（複雑な質問）
  });
  
  // 質問対応時間のトレンドデータ（サンプル）
  const [responseTimeTrend, setResponseTimeTrend] = useState([
    { month: '1月', humanTime: 10, botTime: 0.5 },
    { month: '2月', humanTime: 10, botTime: 0.4 },
    { month: '3月', humanTime: 10, botTime: 0.3 },
    { month: '4月', humanTime: 10, botTime: 0.3 },
    { month: '5月', humanTime: 10, botTime: 0.2 },
    { month: '6月', humanTime: 10, botTime: 0.2 }
  ]);
  
  // 質問検索履歴のサンプルデータ
  const [searchHistory, setSearchHistory] = useState([
    { term: '休暇申請', count: 145 },
    { term: 'パスワード変更', count: 120 },
    { term: '経費精算', count: 95 },
    { term: '勤怠申請', count: 80 },
    { term: '保険手続き', count: 65 },
    { term: 'リモートワーク', count: 60 }
  ]);
  
  // 結果をCSVとしてエクスポート
  const exportResults = () => {
    const csvContent = [
      "項目,値",
      `業種,${inputs.industryType}`,
      `月間問い合わせ数,${inputs.inquiryCount}`,
      `チャットボット効率(%),${inputs.botEfficiency}`,
      `履歴分析による向上(%),${questionHistory.enabled ? questionHistory.additionalInsightValue : 0}`,
      `実効効率(%),${results.effectiveEfficiency.toFixed(1)}`,
      `月間削減額,${results.totalValue}`,
      `年間削減額,${results.annualSavings}`,
      `初期費用回収期間(月),${results.roiMonths.toFixed(1)}`,
      `削減工数(FTE),${results.fteSaved.toFixed(2)}`,
      `損益分岐点(件/月),${results.breakEvenPoint}`,
      "",
      "カテゴリ別質問分布",
      "カテゴリ,割合(%)",
      ...questionCategories.map(cat => `${cat.name},${cat.value}`),
      "",
      "質問複雑さレベル",
      "レベル,割合(%)",
      `簡単(レベル1-2),${questionComplexity.simple}`,
      `中程度(レベル3),${questionComplexity.medium}`,
      `複雑(レベル4-5),${questionComplexity.complex}`,
      "",
      "よく検索される用語",
      "検索ワード,回数",
      ...searchHistory.map(item => `${item.term},${item.count}`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chatbot_roi_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 通貨フォーマット
  const formatCurrency = (value:any) => {
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const handleInputChange = (e:any) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name === 'industryType' ? value : Number(value)
    }));
  };

  const handleHistoryChange = (e:any) => {
    const { name, value, type, checked } = e.target;
    setQuestionHistory(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  // カテゴリ分布の色
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="w-full p-4 bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI社内チャットボット ROI計算機</h1>
          <p className="text-gray-600">質問履歴分析機能を含めた費用対効果シミュレーション</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 左側パネル：基本設定 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本情報 */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">基本情報</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    業種
                  </label>
                  <select
                    name="industryType"
                    value={inputs.industryType}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.keys(industryDefaults).map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    月間問い合わせ数
                    <span className="ml-2 text-xs text-gray-500">({results.breakEvenPoint}件以上で収益化)</span>
                  </label>
                  <input
                    type="range"
                    name="inquiryCount"
                    min="100"
                    max="5000"
                    step="100"
                    value={inputs.inquiryCount}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">100</span>
                    <span className="text-sm font-medium">{inputs.inquiryCount}件</span>
                    <span className="text-xs text-gray-500">5000</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1件あたりの対応時間 (分)
                    </label>
                    <input
                      type="number"
                      name="timePerInquiry"
                      min="1"
                      max="60"
                      value={inputs.timePerInquiry}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      スタッフの時給 (円)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      min="1000"
                      max="5000"
                      step="100"
                      value={inputs.hourlyRate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="internalQuestionsEnabled"
                      name="internalQuestionsEnabled"
                      checked={inputs.internalQuestionsEnabled}
                      onChange={(e) => setInputs(prev => ({ ...prev, internalQuestionsEnabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="internalQuestionsEnabled" className="text-sm font-medium text-gray-700">
                      上司・マネージャーへの質問も自動化
                    </label>
                  </div>
                  
                  {inputs.internalQuestionsEnabled && (
                    <div className="pl-6 border-l-2 border-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            月間質問数
                          </label>
                          <input
                            type="number"
                            name="internalQuestionsCount"
                            min="10"
                            max="1000"
                            step="10"
                            value={inputs.internalQuestionsCount}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            マネージャーの時給 (円)
                          </label>
                          <input
                            type="number"
                            name="managerHourlyRate"
                            min="2000"
                            max="10000"
                            step="100"
                            value={inputs.managerHourlyRate}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          1件あたりの対応時間 (分)
                        </label>
                        <input
                          type="number"
                          name="timePerInternalQuestion"
                          min="1"
                          max="60"
                          value={inputs.timePerInternalQuestion}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* チャットボット設定 */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">チャットボット設定</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    自動化率 (%)
                  </label>
                  <input
                    type="range"
                    name="botEfficiency"
                    min="30"
                    max="90"
                    value={inputs.botEfficiency}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">30%</span>
                    <span className="text-sm font-medium">{inputs.botEfficiency}%</span>
                    <span className="text-xs text-gray-500">90%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      月額費用 (円)
                    </label>
                    <input
                      type="number"
                      name="botMonthlyCost"
                      min="0"
                      max="500000"
                      step="10000"
                      value={inputs.botMonthlyCost}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      初期費用 (円)
                    </label>
                    <input
                      type="number"
                      name="setupCost"
                      min="0"
                      max="2000000"
                      step="100000"
                      value={inputs.setupCost}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    初期費用の償却期間 (月)
                  </label>
                  <input
                    type="number"
                    name="amortizationMonths"
                    min="1"
                    max="36"
                    value={inputs.amortizationMonths}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* 質問履歴分析設定 */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-bold mb-3 text-blue-700">質問履歴分析機能</h3>
                  
                  <div className="mb-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="historyEnabled"
                        name="enabled"
                        checked={questionHistory.enabled}
                        onChange={handleHistoryChange}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor="historyEnabled" className="ml-2 text-sm font-medium text-gray-700">
                        質問履歴を分析して効率改善
                      </label>
                    </div>
                  </div>
                  
                  {questionHistory.enabled && (
                    <div className="pl-6 border-l-2 border-blue-200">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          履歴保存期間 (日)
                        </label>
                        <input
                          type="number"
                          name="storageDays"
                          min="30"
                          max="365"
                          step="30"
                          value={questionHistory.storageDays}
                          onChange={handleHistoryChange}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          分析実施頻度
                        </label>
                        <select
                          name="analysisFrequency"
                          value={questionHistory.analysisFrequency}
                          onChange={handleHistoryChange}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="weekly">毎週</option>
                          <option value="biweekly">隔週</option>
                          <option value="monthly">毎月</option>
                          <option value="quarterly">四半期</option>
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          追加効率向上 (%)
                        </label>
                        <input
                          type="range"
                          name="additionalInsightValue"
                          min="5"
                          max="30"
                          step="1"
                          value={questionHistory.additionalInsightValue}
                          onChange={handleHistoryChange}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">5%</span>
                          <span className="text-sm font-medium">{questionHistory.additionalInsightValue}%</span>
                          <span className="text-xs text-gray-500">30%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-600 bg-opacity-50 rounded-lg p-3">
                  <span className="text-sm block mb-1">年間削減額</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(results.annualSavings)}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">初期費用回収期間:</span>
                  <span className="font-bold">
                    {results.monthlySavings > 0 ? `${results.roiMonths.toFixed(1)}ヶ月` : '採算取れず'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">削減工数 (FTE):</span>
                  <span className="font-bold">
                    {results.fteSaved.toFixed(2)}人
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">現在の効率:</span>
                  <span className="font-bold">
                    {results.baseEfficiency}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">履歴分析後の効率:</span>
                  <span className="font-bold">
                    {questionHistory.enabled ? `${results.effectiveEfficiency.toFixed(1)}%` : '無効'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-400">
              <h3 className="font-bold mb-2">損益分岐点</h3>
              <p>月間 <span className="text-xl font-bold">{results.breakEvenPoint}</span> 件以上で収益化</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-400">
              <h3 className="font-bold mb-2">履歴分析によるメリット</h3>
              <p className="text-sm mb-2">質問パターンの分析とチャットボットの継続的改善により、さらなる効率化が可能です。</p>
              <div className="flex justify-between">
                <span className="text-sm">追加削減額:</span>
                <span className="font-bold">
                  {questionHistory.enabled ? formatCurrency(results.insightBenefit) : '無効'}
                </span>
              </div>
            </div>

            {/* エクスポートボタン */}
            <div className="mt-6">
              <button 
                className="w-full py-2 px-4 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                onClick={() => exportResults()}
              >
                分析結果をエクスポート
              </button>
            </div>
          </div>
          
          {/* 右側パネル：結果サマリー */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-md p-6 text-white">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b border-blue-400">導入効果サマリー</h2>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">収益化判定:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${results.totalValue > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                  {results.totalValue > 0 ? '収益化' : '赤字'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-600 bg-opacity-50 rounded-lg p-3">
                  <span className="text-sm block mb-1">月間削減額</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(results.totalValue)}
                    </span>
                </div>
                
                <div className="bg-blue-600 bg-opacity-50 rounded-lg p-3">
                  <span className="text-sm block mb-1">年間削減額</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(results.annualSavings)}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">初期費用回収期間:</span>
                  <span className="font-bold">
                    {results.monthlySavings > 0 ? `${results.roiMonths.toFixed(1)}ヶ月` : '採算取れず'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">削減工数 (FTE):</span>
                  <span className="font-bold">
                    {results.fteSaved.toFixed(2)}人
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">現在の効率:</span>
                  <span className="font-bold">
                    {results.baseEfficiency}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm">履歴分析後の効率:</span>
                  <span className="font-bold">
                  {questionHistory.enabled && results.effectiveEfficiency !== undefined 
    ? `${results.effectiveEfficiency.toFixed(1)}%` 
    : '無効'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-400">
              <h3 className="font-bold mb-2">損益分岐点</h3>
              <p>月間 <span className="text-xl font-bold">{results.breakEvenPoint}</span> 件以上で収益化</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-400">
              <h3 className="font-bold mb-2">履歴分析によるメリット</h3>
              <p className="text-sm mb-2">質問パターンの分析とチャットボットの継続的改善により、さらなる効率化が可能です。</p>
              <div className="flex justify-between">
                <span className="text-sm">追加削減額:</span>
                <span className="font-bold">
                  {questionHistory.enabled ? formatCurrency(results.insightBenefit) : '無効'}
                </span>
              </div>
            </div>
            
            {/* エクスポートボタン */}
            <div className="mt-6">
              <button 
                className="w-full py-2 px-4 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
                onClick={() => exportResults()}
              >
                分析結果をエクスポート
              </button>
            </div>
          </div>
        </div>
        </div>
     </div>
  );
};

export default ChatbotROICalculator;