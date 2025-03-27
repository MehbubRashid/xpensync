import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { useEntry } from '@/context/EntryContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Entry, Currency } from '@/types';
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDate, isAfter, isBefore, differenceInDays } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle, BarChart3 } from 'lucide-react';

export const FinancialSummary: React.FC = () => {
  const { entries, wallets } = useEntry();
  const { convertAmount, selectedCurrency } = useCurrency();
  
  // Current date info
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const daysInCurrentMonth = getDaysInMonth(today);
  const daysPassed = getDate(today);
  
  // Previous month date info
  const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthStart = startOfMonth(previousMonthDate);
  const previousMonthEnd = endOfMonth(previousMonthDate);
  
  // Filter functions
  const filterByDateRange = (entry: Entry, start: Date, end: Date) => {
    const entryDate = new Date(entry.date);
    return !isBefore(entryDate, start) && !isAfter(entryDate, end);
  };
  
  const isRegularTransaction = (entry: Entry) => {
    return entry.type === 'income' || entry.type === 'expense';
  };
  
  // Calculate current total balance across all wallets
  const totalBalance = wallets.reduce((total, wallet) => {
    const walletEntries = entries.filter(entry => {
      if (entry.type === 'transfer') {
        return entry.walletId === wallet.id || entry.toWalletId === wallet.id;
      }
      return entry.walletId === wallet.id;
    });
    
    const walletBalance = walletEntries.reduce((balance, entry) => {
      const amount = convertAmount(entry.amount, entry.currency as Currency);
      
      if (entry.type === 'income' || entry.type === 'topup') {
        return balance + amount;
      } else if (entry.type === 'expense') {
        return balance - amount;
      } else if (entry.type === 'transfer') {
        if (entry.walletId === wallet.id) {
          // Outgoing transfer
          return balance - amount;
        } else if (entry.toWalletId === wallet.id) {
          // Incoming transfer
          const receivedAmount = entry.receivedAmount 
            ? convertAmount(entry.receivedAmount, (entry.receivedCurrency || entry.currency) as Currency) 
            : amount;
          return balance + receivedAmount;
        }
      }
      return balance;
    }, 0);
    
    return total + walletBalance;
  }, 0);
  
  // Calculate current month income (excluding topups and transfers)
  const currentMonthEntries = entries.filter(entry => 
    filterByDateRange(entry, currentMonthStart, currentMonthEnd) && isRegularTransaction(entry)
  );
  
  const currentMonthIncome = currentMonthEntries
    .filter(entry => entry.type === 'income')
    .reduce((total, entry) => total + convertAmount(entry.amount, entry.currency as Currency), 0);
  
  // Calculate previous month income
  const previousMonthEntries = entries.filter(entry => 
    filterByDateRange(entry, previousMonthStart, previousMonthEnd) && isRegularTransaction(entry)
  );
  
  const previousMonthIncome = previousMonthEntries
    .filter(entry => entry.type === 'income')
    .reduce((total, entry) => total + convertAmount(entry.amount, entry.currency as Currency), 0);
  
  // Calculate income change
  const incomeChange = currentMonthIncome - previousMonthIncome;
  const incomeChangePercentage = previousMonthIncome !== 0 
    ? (incomeChange / previousMonthIncome) * 100 
    : currentMonthIncome !== 0 ? 100 : 0;
  
  // Calculate current month expense
  const currentMonthExpense = currentMonthEntries
    .filter(entry => entry.type === 'expense')
    .reduce((total, entry) => total + convertAmount(entry.amount, entry.currency as Currency), 0);
  
  // Calculate previous month expense
  const previousMonthExpense = previousMonthEntries
    .filter(entry => entry.type === 'expense')
    .reduce((total, entry) => total + convertAmount(entry.amount, entry.currency as Currency), 0);
  
  // Calculate expense change
  const expenseChange = currentMonthExpense - previousMonthExpense;
  const expenseChangePercentage = previousMonthExpense !== 0 
    ? (expenseChange / previousMonthExpense) * 100 
    : currentMonthExpense !== 0 ? 100 : 0;
  
  // Calculate net income (income - expense)
  const currentMonthNetIncome = currentMonthIncome - currentMonthExpense;
  const previousMonthNetIncome = previousMonthIncome - previousMonthExpense;
  
  // Calculate net income change
  const netIncomeChange = currentMonthNetIncome - previousMonthNetIncome;
  const netIncomeChangePercentage = previousMonthNetIncome !== 0 
    ? (netIncomeChange / previousMonthNetIncome) * 100 
    : currentMonthNetIncome !== 0 ? 100 : 0;
  
  // Calculate monthly average income
  // Get all unique months from entries
  const allMonths = entries
    .filter(entry => entry.type === 'income')
    .map(entry => format(new Date(entry.date), 'yyyy-MM'))
    .filter((value, index, self) => self.indexOf(value) === index);
  
  // For current month, project the total based on days passed
  const currentMonthProjectedIncome = daysPassed < daysInCurrentMonth
    ? (currentMonthIncome / daysPassed) * daysInCurrentMonth
    : currentMonthIncome;
  
  // Calculate income for each complete month
  const monthlyIncomes = allMonths
    .filter(month => month !== format(today, 'yyyy-MM')) // Exclude current month
    .map(month => {
      const monthStart = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, 1);
      const monthEnd = endOfMonth(monthStart);
      
      return entries
        .filter(entry => 
          entry.type === 'income' && 
          filterByDateRange(entry, monthStart, monthEnd)
        )
        .reduce((total, entry) => total + convertAmount(entry.amount, entry.currency as Currency), 0);
    });
  
  // Add projected current month income
  const allMonthlyIncomes = [...monthlyIncomes, currentMonthProjectedIncome];
  
  // Calculate monthly average income
  const avgMonthlyIncome = allMonthlyIncomes.length > 0
    ? allMonthlyIncomes.reduce((sum, income) => sum + income, 0) / allMonthlyIncomes.length
    : 0;
  
  // Calculate monthly average expense (same logic as income)
  const allMonthsExpense = entries
    .filter(entry => entry.type === 'expense')
    .map(entry => format(new Date(entry.date), 'yyyy-MM'))
    .filter((value, index, self) => self.indexOf(value) === index);
  
  const currentMonthProjectedExpense = daysPassed < daysInCurrentMonth
    ? (currentMonthExpense / daysPassed) * daysInCurrentMonth
    : currentMonthExpense;
  
  const monthlyExpenses = allMonthsExpense
    .filter(month => month !== format(today, 'yyyy-MM'))
    .map(month => {
      const monthStart = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1, 1);
      const monthEnd = endOfMonth(monthStart);
      
      return entries
        .filter(entry => 
          entry.type === 'expense' && 
          filterByDateRange(entry, monthStart, monthEnd)
        )
        .reduce((total, entry) => total + convertAmount(entry.amount, entry.currency as Currency), 0);
    });
  
  const allMonthlyExpenses = [...monthlyExpenses, currentMonthProjectedExpense];
  
  const avgMonthlyExpense = allMonthlyExpenses.length > 0
    ? allMonthlyExpenses.reduce((sum, expense) => sum + expense, 0) / allMonthlyExpenses.length
    : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Total Balance Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">
            {totalBalance.toFixed(2)} {selectedCurrency}
          </div>
        </CardContent>
      </Card>
      
      {/* Current Month Income Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month's Income</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">
            {currentMonthIncome.toFixed(2)} {selectedCurrency}
          </div>
          <div className={`text-xs flex items-center mt-1 ${incomeChange > 0 ? 'text-green-500' : incomeChange < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {incomeChange > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : incomeChange < 0 ? (
              <TrendingDown className="mr-1 h-3 w-3" />
            ) : null}
            <span>
              {incomeChange === 0 ? 'No change from last month' : 
                `${Math.abs(incomeChange).toFixed(2)} ${selectedCurrency} (${Math.abs(incomeChangePercentage).toFixed(1)}%) ${incomeChange > 0 ? 'increase' : 'decrease'} from last month`}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Current Month Expense Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month's Expenses</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">
            {currentMonthExpense.toFixed(2)} {selectedCurrency}
          </div>
          <div className={`text-xs flex items-center mt-1 ${expenseChange < 0 ? 'text-green-500' : expenseChange > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {expenseChange < 0 ? (
              <TrendingDown className="mr-1 h-3 w-3" />
            ) : expenseChange > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : null}
            <span>
              {expenseChange === 0 ? 'No change from last month' : 
                `${Math.abs(expenseChange).toFixed(2)} ${selectedCurrency} (${Math.abs(expenseChangePercentage).toFixed(1)}%) ${expenseChange < 0 ? 'decrease' : 'increase'} from last month`}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Net Income Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month's Net Income</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className={`text-2xl font-bold ${currentMonthNetIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {currentMonthNetIncome.toFixed(2)} {selectedCurrency}
          </div>
          <div className={`text-xs flex items-center mt-1 ${netIncomeChange > 0 ? 'text-green-500' : netIncomeChange < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {netIncomeChange > 0 ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : netIncomeChange < 0 ? (
              <TrendingDown className="mr-1 h-3 w-3" />
            ) : null}
            <span>
              {netIncomeChange === 0 ? 'No change from last month' : 
                `${Math.abs(netIncomeChange).toFixed(2)} ${selectedCurrency} (${Math.abs(netIncomeChangePercentage).toFixed(1)}%) ${netIncomeChange > 0 ? 'increase' : 'decrease'} from last month`}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Monthly Average Income Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Avg. Income</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">
            {avgMonthlyIncome.toFixed(2)} {selectedCurrency}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on {allMonthlyIncomes.length} month{allMonthlyIncomes.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
      
      {/* Monthly Average Expense Card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Avg. Expense</CardTitle>
            <BarChart3 className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">
            {avgMonthlyExpense.toFixed(2)} {selectedCurrency}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Based on {allMonthlyExpenses.length} month{allMonthlyExpenses.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 