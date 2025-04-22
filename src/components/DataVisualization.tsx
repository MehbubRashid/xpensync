import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useEntry } from '@/context/EntryContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChartData, TimeGrouping, EntryType, ChartFilters } from '@/types';
import { Label } from '@/components/ui/label';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { formatDate } from '@/lib/date';
import { useTheme } from '@/context/ThemeContext';


const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-2 border rounded shadow">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value} {entry.payload.currency}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DataVisualization: React.FC = () => {
  const { getChartData, chartFilters, setChartFilters, categories, entries, wallets } = useEntry();
  const { selectedCurrency, convertAmount } = useCurrency();
  const chartData = getChartData();
  const { theme } = useTheme();

  // Convert chart data to selected currency
  const convertedChartData = useMemo(() => {
    return chartData.map(entry => {
      const convertedIncome = convertAmount(entry.income, entry.currency);
      const convertedExpense = convertAmount(entry.expense, entry.currency);

      return {
        ...entry,
        income: convertedIncome,
        expense: convertedExpense,
        // balance is already calculated correctly in getChartData()
        balance: entry.balance,
        currency: selectedCurrency
      };
    });
  }, [chartData, selectedCurrency, convertAmount]);

  // Filter data based on selected entry type and category
  const filteredData = useMemo(() => {
    let filtered = convertedChartData;
    
    // Filter by entry type
    if (chartFilters.entryType !== 'balance') {
      filtered = filtered.map(entry => ({
        ...entry,
        income: chartFilters.entryType === 'income' ? entry.income : 0,
        expense: chartFilters.entryType === 'expense' ? entry.expense : 0,
      }));
    }

    // Filter by category if selected
    if (chartFilters.categoryId && chartFilters.categoryId !== 'all') {
      const selectedCategory = categories.find(cat => cat.id === chartFilters.categoryId);
      if (selectedCategory) {
        filtered = filtered.map(entry => ({
          ...entry,
          income: entry.income * (selectedCategory.type === 'income' ? 1 : 0),
          expense: entry.expense * (selectedCategory.type === 'expense' ? 1 : 0),
        }));
      }
    }

    return filtered;
  }, [convertedChartData, chartFilters.entryType, chartFilters.categoryId, categories]);

  // Prepare data for the chart
  const chartDataForChart = useMemo(() => {
    let data;
    if (chartFilters.entryType === 'balance') {
      data = filteredData.map(entry => ({
        date: entry.date,
        balance: entry.balance,
        currency: entry.currency
      }));
    } else {
      data = filteredData.map(entry => ({
        date: entry.date,
        income: entry.income,
        expense: entry.expense,
        currency: entry.currency
      }));
    }
    
    // Only show the last 100 data points
    return data.slice(-100);
  }, [filteredData, chartFilters.entryType]);

  // Filter categories based on entry type
  const filteredCategories = useMemo(() => {
    if (!chartFilters.entryType) return [];
    return categories.filter(category => category.type === chartFilters.entryType);
  }, [categories, chartFilters.entryType]);

  const handleTimeGroupingChange = (value: string) => {
    setChartFilters(prev => ({ ...prev, timeGrouping: value as ChartFilters['timeGrouping'] }));
  };

  const handleEntryTypeChange = (value: string) => {
    setChartFilters(prev => ({ ...prev, entryType: value as ChartFilters['entryType'] }));
  };

  const handleCategoryChange = (value: string) => {
    setChartFilters(prev => ({ ...prev, categoryId: value === 'all' ? undefined : value }));
  };

  const handleWalletChange = (value: string) => {
    setChartFilters(prev => ({ ...prev, walletId: value === 'all' ? undefined : value }));
  };

  // If no data, show empty state
  if (!convertedChartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle></CardTitle>
          <CardDescription>No data available to display</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle></CardTitle>
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={chartFilters.timeGrouping}
                onValueChange={handleTimeGroupingChange}
              >
                <SelectTrigger className="gap-2 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={chartFilters.walletId || 'all'}
                onValueChange={handleWalletChange}
              >
                <SelectTrigger className="gap-2 min-w-0">
                  <SelectValue placeholder="All Wallets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  {wallets.map(wallet => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={chartFilters.entryType}
                onValueChange={handleEntryTypeChange}
              >
                <SelectTrigger className="gap-2 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filteredCategories.length > 0 && (
              <div className="flex items-center gap-2 flex-1">
                <Select
                  value={chartFilters.categoryId || 'all'}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="gap-2 min-w-0">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {filteredCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartDataForChart} className=''>
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="5" 
                strokeWidth={theme === 'dark' ? 0.3 : 0.8} 
                syncWithTicks={true}
                strokeOpacity={theme === 'dark' ? 0.4 : 0.8}
              />
              <XAxis 
                dataKey="date" 
                axisLine={{ stroke: theme === 'dark' ? '#444444' : '#dddddd', strokeWidth: 0.8 }} 
                tick={{ fill: '#71717a', fontSize: 12 }} 
                tickCount={11}
              />
              <YAxis
                domain={['dataMin', 'dataMax']}
                width={0}
              />
              <Tooltip content={<CustomTooltip />} />
              {chartFilters.entryType === 'income' && (
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  name="Income"
                  dot={false}
                />
              )}
              {chartFilters.entryType === 'expense' && (
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  name="Expenses"
                  dot={false}
                />
              )}
              {chartFilters.entryType === 'balance' && (
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  name="Balance"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
