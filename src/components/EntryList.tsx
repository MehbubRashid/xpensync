import React, { useState } from 'react';
import { useEntry } from '@/context/EntryContext';
import { useCurrency } from '@/context/CurrencyContext';
import { format } from 'date-fns';
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
import { formatDate } from '@/lib/date';
import { EntryForm } from './EntryForm';
import { EditEntryForm } from './EditEntryForm';
import { EntryId, CategoryId, WalletId } from '@/evolu/schema';

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
						<h4 className='mt-[30px] text-muted-foreground'>{formatDate(date)}</h4>
						<div className="divide-y divide-border rounded-md border bg-card text-card-foreground shadow-sm">
							{entries.map((entry) => {
								const category = getCategoryById(entry.categoryId as CategoryId);
								const wallet = getWalletById(entry.walletId as WalletId);
								const convertedAmount = convertAmount(entry.amount, entry.currency as Currency);
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
												{
													entry?.description ? (
														<p className="text-sm font-medium leading-none">{entry.description}</p>
													) : (
														<></>
													)
												}
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

export const EntryList: React.FC = () => {
	return (
		<div className="!mt-[90px]">
			<Tabs defaultValue="transactions" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger className='data-[state=active]:bg-card data-[state=active]:shadow-sm' value="transactions">Transactions</TabsTrigger>
					<TabsTrigger className='data-[state=active]:bg-card data-[state=active]:shadow-sm' value="categories">Categories</TabsTrigger>
					<TabsTrigger className='data-[state=active]:bg-card data-[state=active]:shadow-sm' value="wallets">Wallets</TabsTrigger>
				</TabsList>
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
