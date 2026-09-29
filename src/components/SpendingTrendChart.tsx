// src/components/SpendingTrendChart.tsx
import React from 'react';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface SpendingTrendChartProps {
  data: MonthlyData[];
  currency: string;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ data, currency }) => {
  if (!data || data.length === 0) {
    return <div className="h-52 flex items-center justify-center text-xs text-slate-400">No trend data available.</div>;
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expenses)), 100);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-emerald-500 rounded-sm" />
          <span className="text-slate-600 dark:text-slate-300">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-indigo-500 rounded-sm" />
          <span className="text-slate-600 dark:text-slate-300">Expenses</span>
        </div>
      </div>

      {/* Bar graph */}
      <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-slate-200 dark:border-slate-800">
        {data.map((item, idx) => {
          const incomeHeight = Math.min(100, Math.round((item.income / maxVal) * 100));
          const expenseHeight = Math.min(100, Math.round((item.expenses / maxVal) * 100));
          
          const [year, monthNum] = item.month.split('-');
          const monthName = new Date(Number(year), Number(monthNum) - 1, 1).toLocaleString('default', { month: 'short' });

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white text-[10px] rounded-lg py-1 px-2.5 pointer-events-none whitespace-nowrap shadow-lg">
                <p>Income: {currency}{item.income.toFixed(0)}</p>
                <p>Expense: {currency}{item.expenses.toFixed(0)}</p>
              </div>

              {/* Bars side by side */}
              <div className="w-full flex items-end justify-center gap-1.5 h-full">
                {/* Income Bar */}
                <div
                  className="w-1/2 max-w-[16px] bg-emerald-400 hover:bg-emerald-500 rounded-t-sm transition-all"
                  style={{ height: `${Math.max(4, incomeHeight)}%` }}
                />
                {/* Expense Bar */}
                <div
                  className="w-1/2 max-w-[16px] bg-indigo-500 hover:bg-indigo-600 rounded-t-sm transition-all"
                  style={{ height: `${Math.max(4, expenseHeight)}%` }}
                />
              </div>

              {/* Label */}
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2">
                {monthName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
