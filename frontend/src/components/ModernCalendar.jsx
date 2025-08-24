import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FiCalendar, FiDollarSign, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// 格式化日期为YYYY-MM-DD格式（使用本地时间）
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ModernCalendar = ({ 
  dailyStats, 
  t, 
  fetchDailyStatsForMonth, 
  onDateClick, 
  selectedDateTransactions,
  selectedDate,
  categoryIconMap 
}) => {
  const [date, setDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 同步外部传入的selectedDate到内部状态
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  // 创建日期到交易数据的映射
  const dateToStats = {};
  if (dailyStats) {
    dailyStats.forEach(stat => {
      const dateKey = stat.date;
      dateToStats[dateKey] = stat;
    });
  }

  // 处理月份切换
  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
    
    // 如果传入了获取数据的函数，调用它
    if (fetchDailyStatsForMonth) {
      fetchDailyStatsForMonth(newMonth.getFullYear(), newMonth.getMonth() + 1);
    }
  };

  // 处理日期选择
  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);
    if (onDateClick) {
      onDateClick(selectedDate);
    }
  };

  // 自定义日期渲染
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = formatDateLocal(date);
      const stats = dateToStats[dateStr];
      
      if (stats && (stats.income > 0 || stats.expense > 0)) {
        return (
          <div className="calendar-tile-content">
            {stats.income > 0 && (
              <div className="calendar-income-amount" title={`收入: ¥${stats.income.toFixed(2)}`}>
                +{stats.income >= 1000 ? (stats.income/1000).toFixed(1) + 'k' : stats.income.toFixed(0)}
              </div>
            )}
            {stats.expense > 0 && (
              <div className="calendar-expense-amount" title={`支出: ¥${stats.expense.toFixed(2)}`}>
                -{stats.expense >= 1000 ? (stats.expense/1000).toFixed(1) + 'k' : stats.expense.toFixed(0)}
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // 获取选中日期的统计数据
  const selectedDateStr = formatDateLocal(date);
  const selectedStats = dateToStats[selectedDateStr];

  return (
    <div className="modern-calendar-container">
      <div className="calendar-header">
        <FiCalendar className="calendar-icon" />
        <h3>交易日历</h3>
      </div>
      
      {/* 自定义月份导航 */}
      <div className="calendar-navigation">
        <button 
          className="nav-button"
          onClick={() => handleMonthChange('prev')}
        >
          <FiChevronLeft />
        </button>
        <span className="current-month">
          {currentMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </span>
        <button 
          className="nav-button"
          onClick={() => handleMonthChange('next')}
        >
          <FiChevronRight />
        </button>
      </div>
      
      <div className="calendar-wrapper">
        <Calendar
          onChange={handleDateChange}
          value={date}
          activeStartDate={currentMonth}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) {
              setCurrentMonth(activeStartDate);
            }
          }}
          tileContent={tileContent}
          locale="zh-CN"
          next2Label={null}
          prev2Label={null}
          nextLabel={null}
          prevLabel={null}
          showNeighboringMonth={false}
          formatShortWeekday={(locale, date) => {
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            return weekdays[date.getDay()];
          }}
        />
      </div>

      {/* 选中日期的交易明细 */}
      {selectedDate && (
        <div className="calendar-selected-info">
          <h4>
            {selectedDate.toLocaleDateString('zh-CN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          
          {selectedDateTransactions && selectedDateTransactions.length > 0 ? (
            <div className="calendar-transaction-list">
              {selectedDateTransactions.map((transaction) => (
                <div key={transaction.id} className="calendar-transaction-item">
                  <span className={`transaction-dot ${transaction.type === 'income' ? 'green' : 'red'}`}></span>
                  <div className="transaction-details">
                    <span className="transaction-category">
                      <span className="category-icon" style={{ marginRight: '4px' }}>
                        {categoryIconMap?.get(transaction.categoryKey) || '📝'}
                      </span>
                      {transaction.categoryKey ? t(transaction.categoryKey) : '未分类'}
                    </span>
                    {transaction.description && (
                      <span className="transaction-desc">{transaction.description}</span>
                    )}
                  </div>
                  <span className="transaction-amount">
                    {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              
              {/* 显示当日汇总 */}
              <div className="calendar-day-summary">
                <div className="summary-item">
                  <span>收入: ¥{selectedDateTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span>支出: ¥{selectedDateTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="calendar-no-data">
              当日无交易记录
            </div>
          )}
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-income-sample">+100</span>
          <span>收入金额</span>
        </div>
        <div className="legend-item">
          <span className="legend-expense-sample">-100</span>
          <span>支出金额</span>
        </div>
        <div className="legend-note">
          <span>※ 大于1000时显示为k格式（如1.5k）</span>
        </div>
      </div>
    </div>
  );
};

export default ModernCalendar;
