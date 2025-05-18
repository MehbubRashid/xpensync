import React, { useState, useMemo } from 'react';
import { useEntry } from '@/context/EntryContext';
import { useCurrency } from '@/context/CurrencyContext';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Entry, EntryType, Currency } from '@/types';
import { Trash2, ArrowDownCircle, ArrowUpCircle, Plus, ArrowUpDown, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoriesList } from './CategoriesList';
import { WalletsList } from './WalletsList';
import { formatDate, formatDateOnly, formatTimeOnly } from '@/lib/date';
import { EntryForm } from './EntryForm';
import { EditEntryForm } from './EditEntryForm';
import { EntryId, CategoryId, WalletId } from '@/evolu/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTheme } from '@/context/ThemeContext';

const TransactionsList: React.FC = () => {
	const { getEntriesByDate, getCategoryById, getWalletById, filters, setFilters, categories, wallets, deleteEntry, editEntry } = useEntry();
	const { selectedCurrency, convertAmount } = useCurrency();
	const entriesByDate = getEntriesByDate();
	const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

	const handleTypeChange = (value: string) => {
		setFilters(prev => ({
			...prev,
			type: value as EntryType | 'all',
			// Reset category selection when changing type
			categoryId: null
		}));
	};

	const handleCategoryChange = (value: string) => {
		setFilters(prev => ({
			...prev,
			categoryId: value === 'all' ? null : value
		}));
	};

	const handleWalletChange = (value: string) => {
		setFilters(prev => ({
			...prev,
			walletId: value === 'all' ? null : value
		}));
	};

	// Filter categories based on selected type
	const filteredCategories = categories.filter(
		category => filters.type === 'all' || category.type === filters.type
	);

	const handleDeleteEntry = (id: EntryId) => {
		deleteEntry(id);
	};

	const handleEditEntry = (entry: Entry) => {
		setEditingEntry(entry);
	};

	return (
		<div className="space-y-4 animate-fade-in">
			<Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Edit Transaction</DialogTitle>
						<DialogDescription>
							Make changes to your transaction here. Click save when you're done.
						</DialogDescription>
					</DialogHeader>
					{editingEntry && (
						<EditEntryForm 
							entry={editingEntry} 
							onClose={() => setEditingEntry(null)} 
						/>
					)}
				</DialogContent>
			</Dialog>
			<div className="flex flex-col sm:flex-row gap-2 mb-4 justify-end">
				<div className="inline">
					<Select
						value={filters.walletId || 'all'}
						onValueChange={handleWalletChange}
						disabled={wallets.length === 0}
					>
						<SelectTrigger id="wallet-filter" className='bg-card gap-2'>
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

				<div className="inline">
					<Select
						value={filters.type}
						onValueChange={handleTypeChange}
					>
						<SelectTrigger id="type-filter" className='bg-card gap-2'>
							<SelectValue placeholder="All Types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value="income">Income</SelectItem>
							<SelectItem value="expense">Expense</SelectItem>
							<SelectItem value="topup">Topup</SelectItem>
							<SelectItem value="transfer">Transfer</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="inline">
					<Select
						value={filters.categoryId || 'all'}
						onValueChange={handleCategoryChange}
						disabled={filteredCategories.length === 0}
					>
						<SelectTrigger id="category-filter" className='bg-card gap-2'>
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
			</div>

			{/* If there are no entries to display, show an empty state */}
			{Object.keys(entriesByDate).length === 0 ? (
				<div className="divide-y divide-border rounded-md border bg-card text-card-foreground shadow-sm">
					<div className="flex flex-col items-center justify-center p-8 text-center">
						<p className="text-sm text-muted-foreground">No transactions yet</p>
						<p className="text-xs text-muted-foreground mt-1">Add a transaction to get started</p>
						{(filters.type !== 'all' || filters.categoryId || filters.walletId) && (
							<Button variant="outline" size="sm" className="mt-4" onClick={() => setFilters({ type: 'all', categoryId: null, walletId: null })}>
								Clear Filters
							</Button>
						)}
					</div>
				</div>
			) : (
				Object.entries(entriesByDate).map(([date, entries]) => (
					<div key={date} className="space-y-2">
						<h4 className='mt-[30px] text-muted-foreground'>{formatDateOnly(date)}</h4>
						<div className="divide-y divide-border rounded-md border bg-card text-card-foreground shadow-sm">
							{entries.map((entry) => {
								const category = getCategoryById(entry.categoryId as CategoryId);
								const wallet = getWalletById(entry.walletId as WalletId);
								const convertedAmount = convertAmount(entry.amount, entry.currency as Currency);
								const entryTime = formatTimeOnly(entry.date);
								return (
									<div key={entry.id} className="block sm:flex justify-between items-center p-4">
										<div className="flex items-center gap-3">
											{entry.type === 'income' ? (
												<ArrowUpCircle className="h-5 w-5 text-green-500" />
											) : entry.type === 'expense' ? (
												<ArrowDownCircle className="h-5 w-5 text-red-500" />
											) : entry.type === 'topup' ? (
												<Plus className="h-5 w-5 text-blue-500" />
											) : (
												<ArrowUpDown className="h-5 w-5 text-purple-500" />
											)}
											<div className="flex flex-col gap-1">
												<div className="flex items-center gap-2">
													{entry?.description ? (
														<p className="text-sm font-medium leading-none">{entry.description}</p>
													) : (
														<></>
													)}
													<span className="text-xs text-muted-foreground">{entryTime}</span>
												</div>
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<span>
														{entry.type === 'transfer'
															? `Transfer to ${getWalletById(entry.toWalletId as WalletId)?.name || 'Unknown'}`
															: entry.type === 'topup'
																? 'Topup'
																: category
																	? category.name
																	: 'Unknown Category'
														}
													</span>
													<span>•</span>
													<span>{wallet ? wallet.name : 'Unknown Wallet'}</span>
													{entry.type === 'transfer' && entry.receivedAmount && entry.receivedCurrency && (
														<>
															<span>•</span>
															<span>Received: {entry.receivedAmount.toFixed(2)} {entry.receivedCurrency}</span>
														</>
													)}
												</div>
											</div>
										</div>
										<div className="flex items-center gap-2 mt-4 sm:mt-0 justify-end sm:justify-normal">
											<span className={`font-medium ${entry.type === 'income' ? 'text-green-500' :
												entry.type === 'expense' ? 'text-red-500' :
													entry.type === 'topup' ? 'text-blue-500' :
														'text-purple-500'  // Transfer type
												}`}>
												{entry.type === 'expense' ? '-' : '+'}
												{convertedAmount.toFixed(2)} {selectedCurrency}
											</span>
											<p className="text-sm text-gray-500">
												{entry.amount.toFixed(2)} {entry.currency}
											</p>
											<Button 
												variant="ghost" 
												size="icon" 
												className="h-8 w-8 text-muted-foreground hover:text-primary"
												onClick={() => handleEditEntry(entry as Entry)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Dialog>
												<DialogTrigger asChild>
													<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
														<Trash2 className="h-4 w-4" />
													</Button>
												</DialogTrigger>
												<DialogContent className="bg-card">
													<DialogHeader>
														<DialogTitle>Delete Transaction</DialogTitle>
														<DialogDescription>
															Are you sure you want to delete this transaction? This action cannot be undone.
														</DialogDescription>
													</DialogHeader>
													<DialogFooter>
														<DialogClose asChild>
															<Button variant="outline">Cancel</Button>
														</DialogClose>
														<Button
															variant="destructive"
															onClick={() => handleDeleteEntry(entry.id as EntryId)}
														>
															Delete
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				))
			)}
		</div>
	);
};

// Custom tooltip for the pie chart
const CustomTooltip = ({ active, payload }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-card p-2 border rounded shadow">
				<p className="font-medium">{payload[0].name}</p>
				<p style={{ color: payload[0].color }}>
					{payload[0].value.toFixed(2)} ({payload[0].payload.percentage.toFixed(2)}%)
				</p>
			</div>
		);
	}
	return null;
};

// Colors for the pie chart
const COLORS = ['#22c55e', '#ef4444', '#eab308', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#14b8a6', '#8b5cf6'];

const BreakdownView: React.FC = () => {
	const { entries, categories, getCategoryById } = useEntry();
	const { convertAmount, selectedCurrency } = useCurrency();
	const { theme } = useTheme();
	
	// Get current month and year
	const currentDate = new Date();
	const currentMonthKey = format(currentDate, 'yyyy-MM');
	
	// State for filters
	const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
	const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
	
	// Generate month options (from earliest transaction to current month)
	const monthOptions = useMemo(() => {
		const months = new Set<string>();
		
		// Add the current month first
		months.add(currentMonthKey);
		
		// Add all months with transactions
		entries.forEach(entry => {
			const entryDate = new Date(entry.date);
			const monthKey = format(entryDate, 'yyyy-MM');
			months.add(monthKey);
		});
		
		// Sort chronologically
		return ['all', ...Array.from(months).sort()];
	}, [entries, currentMonthKey]);
	
	// Filter entries by selected month and type
	const filteredEntries = useMemo(() => {
		return entries.filter(entry => {
			// Filter by entry type
			if (entry.type !== entryType) {
				return false;
			}
			
			// Filter by month if not "all"
			if (selectedMonth !== 'all') {
				const entryDate = new Date(entry.date);
				const entryMonthKey = format(entryDate, 'yyyy-MM');
				if (entryMonthKey !== selectedMonth) {
					return false;
				}
			}
			
			return true;
		});
	}, [entries, entryType, selectedMonth]);
	
	// Group entries by category and calculate totals
	const categoryData = useMemo(() => {
		const categoryTotals = new Map<string, number>();
		
		filteredEntries.forEach(entry => {
			if (!entry.categoryId) return;
			
			const category = getCategoryById(entry.categoryId as CategoryId);
			if (!category) return;
			
			const convertedAmount = convertAmount(entry.amount, entry.currency as Currency);
			
			const currentTotal = categoryTotals.get(category.id) || 0;
			categoryTotals.set(category.id, currentTotal + convertedAmount);
		});
		
		// Calculate the total amount for percentage calculation
		const totalAmount = Array.from(categoryTotals.values()).reduce((sum, amount) => sum + amount, 0);
		
		// Create data for pie chart
		return Array.from(categoryTotals.entries()).map(([categoryId, amount], index) => {
			const category = getCategoryById(categoryId as CategoryId);
			return {
				name: category?.name || 'Unknown',
				value: amount,
				percentage: (amount / totalAmount) * 100,
				color: COLORS[index % COLORS.length]
			};
		}).sort((a, b) => b.value - a.value); // Sort by value (descending)
	}, [filteredEntries, getCategoryById, convertAmount]);
	
	// Format the selected month for display
	const formattedSelectedMonth = useMemo(() => {
		if (selectedMonth === 'all') return 'All Time';
		const [year, month] = selectedMonth.split('-');
		return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy');
	}, [selectedMonth]);
	
	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-4 justify-end">
				<div className="min-w-[150px]">
					<Select
						value={entryType}
						onValueChange={(value) => setEntryType(value as 'income' | 'expense')}
					>
						<SelectTrigger id="entry-type" className="bg-card">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="income">Income</SelectItem>
							<SelectItem value="expense">Expense</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="min-w-[200px]">
					<Select
						value={selectedMonth}
						onValueChange={setSelectedMonth}
					>
						<SelectTrigger id="month-select" className="bg-card">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Time</SelectItem>
							{monthOptions.filter(m => m !== 'all').map(month => {
								const [year, monthNum] = month.split('-');
								const date = new Date(parseInt(year), parseInt(monthNum) - 1);
								return (
									<SelectItem key={month} value={month}>
										{format(date, 'MMMM yyyy')}
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</div>
			</div>
			
			<Card>
				<CardHeader>
					<CardDescription> Total: {categoryData.reduce((sum, category) => sum + category.value, 0).toFixed(2)} {selectedCurrency}</CardDescription>
				</CardHeader>
				<CardContent>
					{categoryData.length === 0 ? (
						<div className="flex h-[300px] items-center justify-center">
							<p className="text-muted-foreground">No data available for the selected filters</p>
						</div>
					) : (
						<div className="h-[500px] sm:h-[400px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={categoryData}
										cx="50%"
										cy="50%"
										labelLine={false}
										outerRadius={130}
										fill="#8884d8"
										dataKey="value"
									>
										{categoryData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip content={<CustomTooltip />} />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					)}
				</CardContent>
			</Card>
			
			{/* Show the data in table format as well */}
			{categoryData.length > 0 && (
				<div className="overflow-hidden rounded-lg border border-border">
					<table className="w-full text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-4 py-3 text-left font-medium">Category</th>
								<th className="px-4 py-3 text-right font-medium">Amount</th>
								<th className="px-4 py-3 text-right font-medium">Percentage</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border bg-card">
							{categoryData.map((category, index) => (
								<tr key={index}>
									<td className="px-4 py-2 flex items-center">
										<div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
										{category.name}
									</td>
									<td className="px-4 py-2 text-right">
										{category.value.toFixed(2)} {selectedCurrency}
									</td>
									<td className="px-4 py-2 text-right">
										{category.percentage.toFixed(2)}%
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
};

export const EntryList: React.FC = () => {
	return (
		<div className="!mt-[90px]">
			<Tabs defaultValue="breakdown" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger className='data-[state=active]:bg-card data-[state=active]:shadow-sm' value="breakdown">Breakdown</TabsTrigger>
					<TabsTrigger className='data-[state=active]:bg-card data-[state=active]:shadow-sm' value="transactions">Transactions</TabsTrigger>
					<TabsTrigger className='data-[state=active]:bg-card data-[state=active]:shadow-sm' value="categories">Categories</TabsTrigger>
					<TabsTrigger className='data-[state=active]:bg-card data-[state=active]:shadow-sm' value="wallets">Wallets</TabsTrigger>
				</TabsList>
				<TabsContent value="breakdown" className="mt-[40px]">
					<BreakdownView />
				</TabsContent>
				<TabsContent value="transactions" className="mt-[40px]">
					<TransactionsList />
				</TabsContent>
				<TabsContent value="categories" className="mt-[40px]">
					<CategoriesList />
				</TabsContent>
				<TabsContent value="wallets" className="mt-[40px]">
					<WalletsList />
				</TabsContent>
			</Tabs>
		</div>
	);
};
