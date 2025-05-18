import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus } from 'lucide-react';
import { useEntry } from '@/context/EntryContext';
import { EntryType, Currency } from '@/types';
import CategoryForm from './CategoryForm';
import { useForm, Controller } from 'react-hook-form';
import { useCurrency } from '@/context/CurrencyContext';
import WalletForm from './WalletForm';

interface EntryFormValues {
  amount: string;
  description: string;
  categoryId: string;
  type: EntryType;
  date: Date;
  currency: Currency;
  walletId: string;
  // Transfer-specific fields
  toWalletId?: string;
  receivedAmount?: string;
  receivedCurrency?: Currency;
}

export const EntryForm: React.FC = () => {
  const { addEntry, categories, wallets } = useEntry();
  const { selectedCurrency, availableCurrencies } = useCurrency();
  const [open, setOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [preSelectedType, setPreSelectedType] = useState<EntryType>('expense');
  
  const { control, register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EntryFormValues>({
    defaultValues: {
      amount: '',
      description: '',
      categoryId: '',
      type: 'expense',
      date: new Date(),
      currency: selectedCurrency,
      walletId: '',
      toWalletId: '',
      receivedAmount: '',
      receivedCurrency: selectedCurrency,
    }
  });

  // Set form type when dialog opens with pre-selected type
  useEffect(() => {
    if (open) {
      setValue('type', preSelectedType);
    }
  }, [open, preSelectedType, setValue]);
  
  const currentType = watch('type');
  const currentWalletId = watch('walletId');
  
  // Filter categories based on the selected type
  const filteredCategories = categories.filter(
    category => (currentType === 'income' || currentType === 'expense') && category.type === currentType
  );

  // Filter wallets for "to wallet" selection (exclude the "from wallet")
  const filteredWallets = wallets.filter(wallet => wallet.id !== currentWalletId);

  // Watch the date field from the form
  const watchedDate = watch('date');

  const handleButtonClick = (type: EntryType) => {
    setPreSelectedType(type);
    setOpen(true);
  };
  
  const onSubmit = (data: EntryFormValues) => {
    if (data.type === 'transfer') {
      // For transfers, create the entry with the transfer-specific fields
      const newEntry = {
        amount: Number(data.amount),
        currency: data.currency,
        description: data.description || `Transfer from ${wallets.find(w => w.id === data.walletId)?.name} to ${wallets.find(w => w.id === data.toWalletId)?.name}`,
        date: data.date.toISOString(),
        categoryId: '',
        type: data.type,
        walletId: data.walletId,
        toWalletId: data.toWalletId,
        receivedAmount: data.receivedAmount ? Number(data.receivedAmount) : Number(data.amount),
        receivedCurrency: data.receivedCurrency || data.currency,
      };
      addEntry(newEntry);
    } else {
      // For regular entries
      const newEntry = {
        amount: Number(data.amount),
        currency: data.currency,
        description: data.description,
        date: data.date.toISOString(),
        categoryId: data.categoryId,
        type: data.type,
        walletId: data.walletId,
      };
      addEntry(newEntry);
    }
    
    reset({
      amount: '',
      description: '',
      categoryId: '',
      type: 'expense',
      date: new Date(),
      currency: selectedCurrency,
      walletId: '',
      toWalletId: '',
      receivedAmount: '',
      receivedCurrency: selectedCurrency,
    });
    
    setOpen(false);
  };
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({
        amount: '',
        description: '',
        categoryId: '',
        type: 'expense',
        date: new Date(),
        currency: selectedCurrency,
        walletId: '',
        toWalletId: '',
        receivedAmount: '',
        receivedCurrency: selectedCurrency,
      });
    }
  }, [open, reset, selectedCurrency]);

  // Handle auto-fill for received amount when currency is the same
  useEffect(() => {
    const sentCurrency = watch('currency');
    const receivedCurrency = watch('receivedCurrency');
    const amount = watch('amount');
    
    if (sentCurrency === receivedCurrency && currentType === 'transfer' && amount) {
      setValue('receivedAmount', amount);
    }
  }, [watch('amount'), watch('currency'), watch('receivedCurrency'), currentType, setValue, watch]);
  
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-[140px] bg-green-500 hover:bg-green-600 text-white border-green-600" 
          onClick={() => handleButtonClick('income')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Income
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-[140px] bg-red-500 hover:bg-red-600 text-white border-red-600" 
          onClick={() => handleButtonClick('expense')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Expense
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-[140px] bg-purple-500 hover:bg-purple-600 text-white border-purple-600" 
          onClick={() => handleButtonClick('transfer')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1 min-w-[140px] bg-blue-500 hover:bg-blue-600 text-white border-blue-600" 
          onClick={() => handleButtonClick('topup')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Topup
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {currentType === 'income' ? 'Add New Income' : 
                 currentType === 'expense' ? 'Add New Expense' : 
                 currentType === 'transfer' ? 'Make New Transfer' : 'New Topup'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              {/* No need to show radio buttons as type is pre-selected */}
              
              {/* From Wallet - for all entry types */}
              <div className="grid gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="wallet">{currentType === 'transfer' ? 'From Wallet' : 'Wallet'}</Label>
                  <WalletForm />
                </div>
                <Controller
                  name="walletId"
                  control={control}
                  rules={{ required: 'Please select a wallet' }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger id="wallet">
                        <SelectValue placeholder="Select a wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.length === 0 ? (
                          <SelectItem value="no-wallets" disabled>
                            No wallets available
                          </SelectItem>
                        ) : (
                          wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.walletId && (
                  <p className="text-sm text-destructive">{errors.walletId.message}</p>
                )}
              </div>
              
              {/* Amount - for all entry types */}
              <div className="grid gap-2">
                <Label htmlFor="amount">{currentType === 'transfer' ? 'Amount Sent' : 'Amount'}</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Controller
                      name="amount"
                      control={control}
                      rules={{ 
                        required: 'Amount is required',
                        validate: {
                          positive: (value) => Number(value) > 0 || 'Amount must be greater than 0'
                        }
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    />
                  </div>
                  <div className="w-32">
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCurrencies.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              {/* Transfer-specific fields */}
              {currentType === 'transfer' && (
                <>
                  {/* To Wallet */}
                  <div className="grid gap-2">
                    <Label htmlFor="toWallet">To Wallet</Label>
                    <Controller
                      name="toWalletId"
                      control={control}
                      rules={{ required: 'Please select a destination wallet' }}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger id="toWallet">
                            <SelectValue placeholder="Select destination wallet" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredWallets.length === 0 ? (
                              <SelectItem value="no-wallets" disabled>
                                No other wallets available
                              </SelectItem>
                            ) : (
                              filteredWallets.map((wallet) => (
                                <SelectItem key={wallet.id} value={wallet.id}>
                                  {wallet.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.toWalletId && (
                      <p className="text-sm text-destructive">{errors.toWalletId.message}</p>
                    )}
                  </div>
                  
                  {/* Amount Received */}
                  <div className="grid gap-2">
                    <Label htmlFor="receivedAmount">Amount Received</Label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Controller
                          name="receivedAmount"
                          control={control}
                          rules={{ 
                            required: 'Received amount is required',
                            validate: {
                              positive: (value) => Number(value) > 0 || 'Amount must be greater than 0'
                            }
                          }}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          )}
                        />
                      </div>
                      <div className="w-32">
                        <Controller
                          name="receivedCurrency"
                          control={control}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCurrencies.map((currency) => (
                                  <SelectItem key={currency} value={currency}>
                                    {currency}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                    {errors.receivedAmount && (
                      <p className="text-sm text-destructive">{errors.receivedAmount.message}</p>
                    )}
                  </div>
                </>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Controller
                  name="description"
                  control={control}
                  rules={{ required: (currentType !== 'transfer' && currentType !== 'topup') ? 'Description is required' : false }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={currentType === 'transfer' ? 'Optional - defaults to "Transfer from X to Y"' : 'Description'}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
              
              {/* Category - only for income and expense */}
              {(currentType === 'income' || currentType === 'expense') && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">Category</Label>
                    <CategoryForm 
                      defaultType={currentType}
                    />
                  </div>
                  <Controller
                    name="categoryId"
                    control={control}
                    rules={{ required: 'Please select a category' }}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredCategories.length === 0 ? (
                            <SelectItem value="no-categories" disabled>
                              No categories available
                            </SelectItem>
                          ) : (
                            filteredCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && (
                    <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                  )}
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal shadow-sm",
                        !watchedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedDate ? format(watchedDate, "PP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 pointer-events-auto" align="start">
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              field.onChange(selectedDate);
                            setDateOpen(false);
                            }
                          }}
                          initialFocus
                        />
                      )}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <DialogFooter>
              <Button className='shadow-sm' type="submit">
                {currentType === 'income' ? 'Add Income' : 
                 currentType === 'expense' ? 'Add Expense' : 
                 currentType === 'transfer' ? 'Add Transfer' : 'Add Topup'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
