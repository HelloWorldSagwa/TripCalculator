import React, { useState, useEffect } from 'react';

// 통화 정보
const currencies = [
  { code: 'KRW', symbol: '₩', name: '원', rate: 1 },
  { code: 'THB', symbol: '฿', name: '바트', rate: 42 },
  { code: 'USD', symbol: '$', name: '달러', rate: 1350 },
  { code: 'EUR', symbol: '€', name: '유로', rate: 1450 }
];

const ExpenseApp = () => {
  // 상태
  const [currentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [spenderTotals, setSpenderTotals] = useState([]);
  const [dailySpenderTotals, setDailySpenderTotals] = useState([]);
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState('total');
  const [totalSubTab, setTotalSubTab] = useState('summary');
  const [todaySubTab, setTodaySubTab] = useState('summary');
  
  // 입력 상태
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState('');
  const [currency, setCurrency] = useState(currencies[0]);
  const [showCurrency, setShowCurrency] = useState(false);
  const [isExpense, setIsExpense] = useState(true);
  
  // 태그
  const [savedPersons, setSavedPersons] = useState([]);
  const [savedExpensePersons, setSavedExpensePersons] = useState([]);
  const [savedIncomePersons, setSavedIncomePersons] = useState([]);
  const [savedCategories, setSavedCategories] = useState([]);
  const [savedExpenseCategories, setSavedExpenseCategories] = useState([]);
  const [savedIncomeCategories, setSavedIncomeCategories] = useState([]);
  
  // 전체 여행 합계 상태
  const [tripTotals, setTripTotals] = useState({
    income: 0,
    expense: 0
  });
  
  // 유틸리티 함수
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  const formatNumber = (num) => {
    if (isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 금액을 한글로 변환
  const numberToKorean = (num) => {
    if (isNaN(num) || num === 0) return '0';
    
    let result = '';
    
    if (num >= 100000000) {
      const billions = Math.floor(num / 100000000);
      result += billions + '억';
      num %= 100000000;
      if (num === 0) return result;
      result += ' ';
    }
    
    if (num >= 10000) {
      const tenThousands = Math.floor(num / 10000);
      result += tenThousands + '만';
      num %= 10000;
      if (num === 0) return result;
      result += ' ';
    }
    
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      result += thousands + '천';
      num %= 1000;
      if (num === 0) return result;
      result += ' ';
    }
    
    if (num > 0) {
      result += num;
    }
    
    return result;
  };
  
  // 현재 날짜의 거래내역 (최신순)
  const currentItems = (transactions[formatDate(selectedDate)] || [])
    .sort((a, b) => b.id - a.id);
  
  // 통화별 총계 계산
  const totals = currentItems.reduce((acc, item) => {
    const code = item.currency?.code || 'KRW';
    const rate = item.currency?.rate || 1;
    
    if (!acc[code]) {
      acc[code] = {
        income: 0,
        expense: 0,
        symbol: item.currency?.symbol || '₩',
        name: item.currency?.name || '원',
        rate: rate
      };
    }
    
    if (item.isExpense) {
      acc[code].expense += item.amount;
    } else {
      acc[code].income += item.amount;
    }
    
    return acc;
  }, {});
  
  // 오늘의 지출자별 지출액 계산
  const calculateDailySpenderTotals = () => {
    const spenderMap = {};
    const dateKey = formatDate(selectedDate);
    
    // 오늘 날짜의 거래만 필터링
    const todayTransactions = transactions[dateKey] || [];
    
    // 오늘 거래에서 지출자별 금액 합산
    todayTransactions.forEach(item => {
      if (item.isExpense) {
        const amountInKRW = item.amount * (item.currency?.rate || 1);
        
        if (!spenderMap[item.person]) {
          spenderMap[item.person] = 0;
        }
        
        spenderMap[item.person] += amountInKRW;
      }
    });
    
    // 배열로 변환 후 금액 내림차순 정렬
    return Object.entries(spenderMap)
      .map(([person, amount]) => ({ person, amount }))
      .sort((a, b) => b.amount - a.amount);
  };
  
  // 지출자별 지출액 계산
  const calculateSpenderTotals = () => {
    const spenderMap = {};
    
    // 모든 거래에서 지출자별 금액 합산
    Object.values(transactions).forEach(dateTransactions => {
      dateTransactions.forEach(item => {
        if (item.isExpense) {
          const amountInKRW = item.amount * (item.currency?.rate || 1);
          
          if (!spenderMap[item.person]) {
            spenderMap[item.person] = 0;
          }
          
          spenderMap[item.person] += amountInKRW;
        }
      });
    });
    
    // 배열로 변환 후 금액 내림차순 정렬
    return Object.entries(spenderMap)
      .map(([person, amount]) => ({ person, amount }))
      .sort((a, b) => b.amount - a.amount);
  };
  
  // 전체 여행 합계 계산
  const calculateTripTotals = () => {
    let totalExpense = 0;
    let totalIncome = 0;
    
    // 모든 날짜의 모든 거래를 합산
    Object.values(transactions).forEach(dateTransactions => {
      dateTransactions.forEach(item => {
        const amountInKRW = item.amount * (item.currency?.rate || 1);
        
        if (item.isExpense) {
          totalExpense += amountInKRW;
        } else {
          totalIncome += amountInKRW;
        }
      });
    });
    
    return { income: totalIncome, expense: totalExpense };
  };
  
  // 초기화
  useEffect(() => {
    loadData();
    checkLockStatus();
  }, []);
  
  // 날짜 변경 시 마감상태 확인 및 일별 지출 계산
  useEffect(() => {
    checkLockStatus();
    setDailySpenderTotals(calculateDailySpenderTotals());
  }, [selectedDate, transactions]);

  // 거래 내역 변경 시 전체 여행 합계 계산 및 지출자별 지출액 계산
  useEffect(() => {
    setTripTotals(calculateTripTotals());
    setSpenderTotals(calculateSpenderTotals());
  }, [transactions]);
  
  // 금액 입력 포맷팅
  useEffect(() => {
    if (amount) {
      const numOnly = amount.replace(/,/g, '');
      const numValue = parseInt(numOnly);
      
      if (!isNaN(numValue) && numValue > 0) {
        setDisplayAmount(formatNumber(numValue));
        setAmountText(`${numberToKorean(numValue)}${currency.name}`);
      } else {
        setDisplayAmount('');
        setAmountText('');
      }
    } else {
      setDisplayAmount('');
      setAmountText('');
    }
  }, [amount, currency]);

  // 지출/수입 전환 시 인풋 초기화
  useEffect(() => {
    setCategory('');
  }, [isExpense]);
  
  // 데이터 로드
  const loadData = () => {
    try {
      // 예시 데이터
      const mockTransactions = {
        [formatDate(new Date())]: [
          {
            id: 1,
            date: formatDate(new Date()),
            person: '김철수',
            amount: 500,
            category: '식사',
            currency: currencies[1],
            isExpense: true
          },
          {
            id: 2,
            date: formatDate(new Date()),
            person: '이영희',
            amount: 300,
            category: '교통',
            currency: currencies[1],
            isExpense: true
          },
          {
            id: 3,
            date: formatDate(new Date()),
            person: '호텔환전소',
            amount: 500,
            category: '환전',
            currency: currencies[1],
            isExpense: false
          }
        ]
      };
      
      // 실제 데이터 로드 시도
      const saved = localStorage.getItem('expense-app-data');
      if (saved) {
        setTransactions(JSON.parse(saved));
      } else {
        // 예시 데이터 사용
        setTransactions(mockTransactions);
        localStorage.setItem('expense-app-data', JSON.stringify(mockTransactions));
      }
      
      // 예시 태그 데이터
      const mockExpensePersons = ['김철수', '이영희', '박지민'];
      const mockIncomePersons = ['호텔환전소', '현지은행', '김철수'];
      const mockExpenseCategories = ['식사', '숙박', '교통', '쇼핑'];
      const mockIncomeCategories = ['환전', '환불', '정산'];
      
      // 지출자 로드
      const savedExpensePersonsList = localStorage.getItem('expense-app-expense-persons');
      if (savedExpensePersonsList) {
        setSavedExpensePersons(JSON.parse(savedExpensePersonsList));
      } else {
        setSavedExpensePersons(mockExpensePersons);
        localStorage.setItem('expense-app-expense-persons', JSON.stringify(mockExpensePersons));
      }
      
      // 수입자 로드
      const savedIncomePersonsList = localStorage.getItem('expense-app-income-persons');
      if (savedIncomePersonsList) {
        setSavedIncomePersons(JSON.parse(savedIncomePersonsList));
      } else {
        setSavedIncomePersons(mockIncomePersons);
        localStorage.setItem('expense-app-income-persons', JSON.stringify(mockIncomePersons));
      }
      
      // 지출 항목 로드
      const savedExpenseCategoriesList = localStorage.getItem('expense-app-expense-categories');
      if (savedExpenseCategoriesList) {
        setSavedExpenseCategories(JSON.parse(savedExpenseCategoriesList));
      } else {
        setSavedExpenseCategories(mockExpenseCategories);
        localStorage.setItem('expense-app-expense-categories', JSON.stringify(mockExpenseCategories));
      }
      
      // 수입 항목 로드
      const savedIncomeCategoriesList = localStorage.getItem('expense-app-income-categories');
      if (savedIncomeCategoriesList) {
        setSavedIncomeCategories(JSON.parse(savedIncomeCategoriesList));
      } else {
        setSavedIncomeCategories(mockIncomeCategories);
        localStorage.setItem('expense-app-income-categories', JSON.stringify(mockIncomeCategories));
      }
      
      // 기존 호환성을 위한 전체 태그 데이터 설정
      setSavedPersons([...mockExpensePersons, ...mockIncomePersons]);
      setSavedCategories([...mockExpenseCategories, ...mockIncomeCategories]);
      
      // 마지막 지출자
      const lastPerson = localStorage.getItem('expense-app-last-person');
      if (lastPerson) {
        setPerson(lastPerson);
      } else {
        setPerson(mockExpensePersons[0]);
      }
      
      // 마지막 통화
      const lastCurrency = localStorage.getItem('expense-app-last-currency');
      if (lastCurrency) {
        const parsed = JSON.parse(lastCurrency);
        const found = currencies.find(c => c.code === parsed.code);
        if (found) {
          setCurrency(found);
        }
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    }
  };
  
  // 마감 상태 확인
  const checkLockStatus = () => {
    try {
      const locked = JSON.parse(localStorage.getItem('expense-app-locked') || '{}');
      setIsLocked(locked[formatDate(selectedDate)] === true);
    } catch (error) {
      console.error('마감 상태 확인 오류:', error);
    }
  };
  
  // 날짜 변경
  const changeDate = (offset) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };
  
  // 지출자 선택
  const selectPerson = (selectedPerson) => {
    setPerson(selectedPerson);
    saveNewPerson(selectedPerson);
  };
  
  // 항목 선택
  const selectCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    saveNewCategory(selectedCategory);
  };
  
  // 통화 선택
  const selectCurrency = (selected) => {
    setCurrency(selected);
    localStorage.setItem('expense-app-last-currency', JSON.stringify(selected));
    setShowCurrency(false);
  };
  
  // 새 지출자 저장
  const saveNewPerson = (name) => {
    if (!name) return;
    
    // 기존 호환성을 위한 저장
    const filteredAll = savedPersons.filter(p => p !== name);
    const updatedAll = [name, ...filteredAll];
    setSavedPersons(updatedAll);
    localStorage.setItem('expense-app-persons', JSON.stringify(updatedAll));
    
    // 지출/수입 구분하여 저장
    if (isExpense) {
      const filteredExpense = savedExpensePersons.filter(p => p !== name);
      const updatedExpense = [name, ...filteredExpense];
      setSavedExpensePersons(updatedExpense);
      localStorage.setItem('expense-app-expense-persons', JSON.stringify(updatedExpense));
    } else {
      const filteredIncome = savedIncomePersons.filter(p => p !== name);
      const updatedIncome = [name, ...filteredIncome];
      setSavedIncomePersons(updatedIncome);
      localStorage.setItem('expense-app-income-persons', JSON.stringify(updatedIncome));
    }
    
    localStorage.setItem('expense-app-last-person', name);
  };
  
  // 새 항목 저장
  const saveNewCategory = (name) => {
    if (!name) return;
    
    // 기존 호환성을 위한 저장
    const filteredAll = savedCategories.filter(c => c !== name);
    const updatedAll = [name, ...filteredAll]; 
    setSavedCategories(updatedAll);
    localStorage.setItem('expense-app-categories', JSON.stringify(updatedAll));
    
    // 지출/수입 구분하여 저장
    if (isExpense) {
      const filteredExpense = savedExpenseCategories.filter(c => c !== name);
      const updatedExpense = [name, ...filteredExpense];
      setSavedExpenseCategories(updatedExpense);
      localStorage.setItem('expense-app-expense-categories', JSON.stringify(updatedExpense));
    } else {
      const filteredIncome = savedIncomeCategories.filter(c => c !== name);
      const updatedIncome = [name, ...filteredIncome];
      setSavedIncomeCategories(updatedIncome);
      localStorage.setItem('expense-app-income-categories', JSON.stringify(updatedIncome));
    }
  };
  
  // 지출자 삭제
  const deletePerson = (name, e) => {
    e.stopPropagation();
    
    // 기존 호환성
    const updatedAll = savedPersons.filter(p => p !== name);
    setSavedPersons(updatedAll);
    localStorage.setItem('expense-app-persons', JSON.stringify(updatedAll));
    
    // 지출/수입 구분
    if (isExpense) {
      const updatedExpense = savedExpensePersons.filter(p => p !== name);
      setSavedExpensePersons(updatedExpense);
      localStorage.setItem('expense-app-expense-persons', JSON.stringify(updatedExpense));
    } else {
      const updatedIncome = savedIncomePersons.filter(p => p !== name);
      setSavedIncomePersons(updatedIncome);
      localStorage.setItem('expense-app-income-persons', JSON.stringify(updatedIncome));
    }
    
    if (person === name) {
      setPerson('');
    }
  };
  
  // 항목 삭제
  const deleteCategory = (name, e) => {
    e.stopPropagation();
    
    // 기존 호환성
    const updatedAll = savedCategories.filter(c => c !== name);
    setSavedCategories(updatedAll);
    localStorage.setItem('expense-app-categories', JSON.stringify(updatedAll));
    
    // 지출/수입 구분
    if (isExpense) {
      const updatedExpense = savedExpenseCategories.filter(c => c !== name);
      setSavedExpenseCategories(updatedExpense);
      localStorage.setItem('expense-app-expense-categories', JSON.stringify(updatedExpense));
    } else {
      const updatedIncome = savedIncomeCategories.filter(c => c !== name);
      setSavedIncomeCategories(updatedIncome);
      localStorage.setItem('expense-app-income-categories', JSON.stringify(updatedIncome));
    }
    
    if (category === name) {
      setCategory('');
    }
  };
  
  // 거래 추가
  const addTransaction = () => {
    if (isLocked) {
      alert('이미 마감된 날짜입니다.');
      return;
    }
    
    if (!person || !amount || !category) {
      alert('모든 항목을 입력해주세요.');
      return;
    }
    
    const numAmount = parseInt(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('유효한 금액을 입력해주세요.');
      return;
    }
    
    // 새 지출자/항목 저장
    saveNewPerson(person);
    saveNewCategory(category);
    
    // 새 거래 추가
    const item = {
      id: Date.now(),
      date: formatDate(selectedDate),
      person,
      amount: numAmount,
      category,
      currency,
      isExpense
    };
    
    const dateKey = formatDate(selectedDate);
    const updated = { ...transactions };
    
    if (!updated[dateKey]) {
      updated[dateKey] = [];
    }
    
    updated[dateKey] = [item, ...updated[dateKey]];
    
    setTransactions(updated);
    localStorage.setItem('expense-app-data', JSON.stringify(updated));
    
    // 입력 초기화 (지출자 제외)
    setAmount('');
    setDisplayAmount('');
    setAmountText('');
    setCategory('');
  };
  
  // 거래 삭제
  const deleteTransaction = (id) => {
    if (isLocked) {
      alert('이미 마감된 날짜입니다.');
      return;
    }
    
    const dateKey = formatDate(selectedDate);
    const updated = { ...transactions };
    
    if (updated[dateKey]) {
      updated[dateKey] = updated[dateKey].filter(item => item.id !== id);
      setTransactions(updated);
      localStorage.setItem('expense-app-data', JSON.stringify(updated));
    }
  };
  
  // 마감 토글
  const toggleLock = () => {
    const dateKey = formatDate(selectedDate);
    let locked = {};
    
    try {
      locked = JSON.parse(localStorage.getItem('expense-app-locked') || '{}');
    } catch (error) {
      console.error('마감 데이터 로드 오류:', error);
    }
    
    if (isLocked) {
      delete locked[dateKey];
    } else {
      locked[dateKey] = true;
    }
    
    localStorage.setItem('expense-app-locked', JSON.stringify(locked));
    setIsLocked(!isLocked);
  };
  
  // 금액 입력 처리
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^\d,]/g, '');
    setAmount(value);
  };

  // 수입/지출 모드 전환
  const toggleExpenseMode = (newMode) => {
    if (isExpense !== newMode) {
      setIsExpense(newMode);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-4 bg-gray-100 min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">간편 지출 관리</h1>
      </div>
      
      {/* 날짜 선택 */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex items-center justify-between">
        <button 
          className="p-2 text-blue-500 hover:text-blue-700"
          onClick={() => changeDate(-1)}
        >
          &larr;
        </button>
        
        <div className="flex-1 text-center font-bold">
          {formatDateDisplay(selectedDate)}
          {formatDate(selectedDate) === formatDate(currentDate) && ' (오늘)'}
        </div>
        
        <button 
          className="p-2 text-blue-500 hover:text-blue-700"
          onClick={() => changeDate(1)}
        >
          &rarr;
        </button>
      </div>
      
      {/* 요약 */}
      <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md mb-4">
        {Object.keys(totals).length > 0 || spenderTotals.length > 0 ? (
          <div className="space-y-3">
            {/* 이번 여행 전체 및 오늘 탭 */}
            <div className="flex border-b border-blue-400 pb-1">
              <button 
                className={`mr-4 px-2 py-1 font-bold ${activeTab === 'today' ? 'border-b-2 border-white' : 'opacity-75'}`}
                onClick={() => setActiveTab('today')}
              >
                오늘
              </button>
              <button 
                className={`px-2 py-1 font-bold ${activeTab === 'total' ? 'border-b-2 border-white' : 'opacity-75'}`}
                onClick={() => setActiveTab('total')}
              >
                이번 여행 전체
              </button>
            </div>
            
            {/* 탭 내용 */}
            <div>
              {/* 오늘 탭 내용 */}
              {activeTab === 'today' && (
                <div>
                  {/* 요약 및 지출자별 요약 탭 */}
                  <div className="flex mb-2">
                    <button 
                      className={`mr-2 px-2 py-1 text-sm ${todaySubTab === 'summary' ? 'bg-blue-600 rounded' : 'opacity-80'}`}
                      onClick={() => setTodaySubTab('summary')}
                    >
                      통화별
                    </button>
                    <button 
                      className={`px-2 py-1 text-sm ${todaySubTab === 'byPerson' ? 'bg-blue-600 rounded' : 'opacity-80'}`}
                      onClick={() => setTodaySubTab('byPerson')}
                    >
                      지출자별
                    </button>
                  </div>
                  
                  {/* 하위 탭 내용 */}
                  {todaySubTab === 'summary' ? (
                    <div className="max-h-32 overflow-y-auto pr-1">
                      {Object.entries(totals).length > 0 ? (
                        Object.entries(totals).map(([code, data], index) => (
                          <div key={index} className="mb-2 pb-1 border-b border-blue-400 last:border-0">
                            <div className="font-bold text-sm">
                              {data.name} ({data.symbol})
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>지출: {data.symbol} {formatNumber(data.expense)}</span>
                              <span className="text-red-300">
                                {code !== 'KRW' && `₩ ${formatNumber(Math.round(data.expense * data.rate))}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>수입: {data.symbol} {formatNumber(data.income)}</span>
                              <span className="text-green-300">
                                {code !== 'KRW' && `₩ ${formatNumber(Math.round(data.income * data.rate))}`}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                              <span>잔액: {data.symbol} {formatNumber(data.income - data.expense)}</span>
                              <span className={data.income > data.expense ? "text-green-300" : "text-red-300"}>
                                {code !== 'KRW' && `₩ ${formatNumber(Math.round((data.income - data.expense) * data.rate))}`}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm">오늘의 거래 내역이 없습니다.</div>
                      )}
                    </div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto pr-1">
                      {dailySpenderTotals.length > 0 ? (
                        dailySpenderTotals.map((item, index) => (
                          <div key={`daily-spender-${index}`} className="flex justify-between items-center text-sm mb-1">
                            <div>{item.person}:</div>
                            <div className="text-red-300">
                              ₩ {formatNumber(Math.round(item.amount))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm">오늘의 지출 내역이 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* 이번 여행 전체 탭 내용 */}
              {activeTab === 'total' && (
                <div>
                  {/* 요약 및 지출자별 요약 탭 */}
                  <div className="flex mb-2">
                    <button 
                      className={`mr-2 px-2 py-1 text-sm ${totalSubTab === 'summary' ? 'bg-blue-600 rounded' : 'opacity-80'}`}
                      onClick={() => setTotalSubTab('summary')}
                    >
                      요약
                    </button>
                    <button 
                      className={`px-2 py-1 text-sm ${totalSubTab === 'byPerson' ? 'bg-blue-600 rounded' : 'opacity-80'}`}
                      onClick={() => setTotalSubTab('byPerson')}
                    >
                      지출자별
                    </button>
                  </div>
                  
                  {/* 하위 탭 내용 */}
                  {totalSubTab === 'summary' ? (
                    <div className="flex flex-col space-y-2">
                      {/* 총 예산(수입) */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm">총 예산(수입):</div>
                        <div className="text-green-300">
                          ₩ {formatNumber(Math.round(tripTotals.income))}
                        </div>
                      </div>
                      
                      {/* 총 지출 */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm">총 지출:</div>
                        <div className="text-red-300">
                          ₩ {formatNumber(Math.round(tripTotals.expense))}
                        </div>
                      </div>
                      
                      {/* 잔액 */}
                      <div className="flex justify-between items-center font-bold">
                        <div className="text-sm">잔액:</div>
                        <div className={tripTotals.income > tripTotals.expense ? "text-green-300" : "text-red-300"}>
                          ₩ {formatNumber(Math.round(tripTotals.income - tripTotals.expense))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto pr-1">
                      {spenderTotals.length > 0 ? (
                        spenderTotals.map((item, index) => (
                          <div key={`spender-${index}`} className="flex justify-between items-center text-sm mb-1">
                            <div>{item.person}:</div>
                            <div className="text-red-300">
                              ₩ {formatNumber(Math.round(item.amount))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm">지출 내역이 없습니다.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-2">지출/수입 내역이 없습니다</div>
        )}
        
        {/* 환율 정보 */}
        <div className="mt-3 pt-2 border-t border-blue-400 text-xs opacity-70">
          환율: 1바트=42원, 1달러=1,350원, 1유로=1,450원
        </div>
      </div>
      
      {/* 마감 메시지 */}
      {isLocked && (
        <div className="bg-yellow-500 text-white p-3 rounded-lg mb-4 text-center font-bold">
          오늘의 기록이 마감되었습니다.
        </div>
      )}
      
      {/* 입력 폼 */}
      {!isLocked && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          {/* 지출/수입 토글 */}
          <div className="flex border rounded mb-4 overflow-hidden">
            <button
              className={`flex-1 py-2 ${isExpense ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
              onClick={() => toggleExpenseMode(true)}
            >
              지출
            </button>
            <button
              className={`flex-1 py-2 ${!isExpense ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
              onClick={() => toggleExpenseMode(false)}
            >
              수입
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              {isExpense ? "지출자" : "수입자"}
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder={isExpense ? "누가 지출했나요?" : "누가 수입을 얻었나요?"}
              value={person}
              onChange={(e) => setPerson(e.target.value)}
            />
            
            {/* 태그 목록 (가로 스크롤) */}
            {(isExpense ? savedExpensePersons : savedIncomePersons).length > 0 && (
              <div className="mt-2 overflow-x-auto whitespace-nowrap pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="inline-flex gap-2 pb-1">
                  {(isExpense ? savedExpensePersons : savedIncomePersons).map((saved, index) => (
                    <div key={`person-${index}`} className="relative flex-shrink-0 inline-block">
                      <button
                        className={`px-3 py-1 pr-7 rounded-full text-sm ${person === saved ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => selectPerson(saved)}
                      >
                        {saved}
                      </button>
                      <button
                        className="absolute right-1 top-1 text-xs rounded-full w-5 h-5 flex items-center justify-center bg-gray-400 text-white hover:bg-red-500"
                        onClick={(e) => deletePerson(saved, e)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">금액</label>
            <div className="relative">
              <div className="absolute left-2 top-2 text-gray-500">
                {currency.symbol}
              </div>
              <input
                type="text"
                className="w-full p-2 pl-8 border rounded"
                placeholder={isExpense ? "얼마를 지출했나요?" : "얼마를 벌었나요?"}
                value={displayAmount}
                onChange={handleAmountChange}
              />
              <button
                className="absolute right-2 top-2 flex items-center text-blue-500 hover:text-blue-700"
                onClick={() => setShowCurrency(!showCurrency)}
              >
                {currency.code} ▼
              </button>
            </div>
            
            {/* 한글 금액 */}
            {amountText && (
              <div className="mt-1 text-sm text-gray-500">
                {amountText}
                {currency.code !== 'KRW' && displayAmount && (
                  <span className="ml-2">
                    (약 {formatNumber(Math.round(parseInt(amount.replace(/,/g, '')) * currency.rate))}원)
                  </span>
                )}
              </div>
            )}
            
            {/* 통화 선택 */}
            {showCurrency && (
              <div className="mt-2 bg-white border rounded shadow-lg z-10">
                {currencies.map((curr, index) => (
                  <div 
                    key={`currency-${index}`}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${currency.code === curr.code ? 'bg-blue-100' : ''}`}
                    onClick={() => selectCurrency(curr)}
                  >
                    <span className="mr-2">{curr.symbol}</span>
                    <span className="font-medium">{curr.code}</span>
                    <span className="ml-2 text-gray-500">({curr.name})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              {isExpense ? "지출 항목" : "수입 항목"}
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder={isExpense ? "어디에 지출했나요?" : "어디서 수입이 발생했나요?"}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            
            {/* 태그 목록 (가로 스크롤) */}
            {(isExpense ? savedExpenseCategories : savedIncomeCategories).length > 0 && (
              <div 
                className="mt-2 overflow-x-auto whitespace-nowrap pb-2"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="inline-flex gap-2 pb-1">
                  {(isExpense ? savedExpenseCategories : savedIncomeCategories).map((saved, index) => (
                    <div key={`category-${index}`} className="relative flex-shrink-0 inline-block">
                      <button
                        className={`px-3 py-1 pr-7 rounded-full text-sm ${category === saved ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => selectCategory(saved)}
                      >
                        {saved}
                      </button>
                      <button
                        className="absolute right-1 top-1 text-xs rounded-full w-5 h-5 flex items-center justify-center bg-gray-400 text-white hover:bg-red-500"
                        onClick={(e) => deleteCategory(saved, e)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button
              className={`text-white px-4 py-2 rounded ${isExpense ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              onClick={addTransaction}
            >
              {isExpense ? '지출 추가' : '수입 추가'}
            </button>
            
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              onClick={toggleLock}
            >
              마감하기
            </button>
          </div>
        </div>
      )}
      
      {/* 마감 해제 버튼 */}
      {isLocked && (
        <div className="mb-4 text-center">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={toggleLock}
          >
            마감 풀기
          </button>
        </div>
      )}
      
      {/* 거래 내역 목록 */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">거래 내역</h2>
          <span className="text-sm text-gray-500">{currentItems.length}건</span>
        </div>
        
        {currentItems.length === 0 ? (
          <div className="text-gray-500 text-center p-4">거래 내역이 없습니다.</div>
        ) : (
          <div>
            {currentItems.map((item) => (
              <div key={item.id} className="border-b py-3 flex justify-between items-center">
                <div>
                  <div className="font-bold">{item.person}</div>
                  <div className="text-gray-600 text-sm">{item.category}</div>
                </div>
                <div className="flex items-center">
                  <div className="text-right">
                    <div className={`font-bold ${item.isExpense ? 'text-red-500' : 'text-green-500'}`}>
                      {!item.isExpense && '+'}{item.currency?.symbol || '₩'} {formatNumber(item.amount)}
                    </div>
                    {item.currency?.code !== 'KRW' && (
                      <div className="text-xs text-gray-500">
                        (₩ {formatNumber(Math.round(item.amount * (item.currency?.rate || 1)))})
                      </div>
                    )}
                  </div>
                  {!isLocked && (
                    <button
                      className="text-red-500 hover:text-red-700 ml-2"
                      onClick={() => deleteTransaction(item.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseApp;