import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { useEntry } from '@/context/EntryContext';
import { Entry, EntryType, Currency } from '@/types';
import CategoryForm from './CategoryForm';
import { useForm, Controller } from 'react-hook-form';
import { useCurrency } from '@/context/CurrencyContext';
import WalletForm from './WalletForm';
import { DialogFooter } from '@/components/ui/dialog';

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

interface EditEntryFormProps {
  entry: Entry;
  onClose: () => void;
}

export const EditEntryForm: React.FC<EditEntryFormProps> = ({ entry, onClose }) => {
  const { editEntry, categories, wallets } = useEntry();
  const { selectedCurrency, availableCurrencies } = useCurrency();
  const [date, setDate] = useState<Date>(new Date(entry.date));
  const [dateOpen, setDateOpen] = useState(false);
  
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<EntryFormValues>({
    defaultValues: {
      amount: entry.amount.toString(),
      description: entry.description || '',
      categoryId: entry.categoryId || '',
      type: entry.type,
      date: new Date(entry.date),
      currency: entry.currency as Currency,
      walletId: entry.walletId,
      toWalletId: entry.toWalletId || '',
      receivedAmount: entry.receivedAmount?.toString() || '',
      receivedCurrency: entry.receivedCurrency as Currency || entry.currency as Currency,
    }
  });
  
  const currentType = watch('type');
  const currentWalletId = watch('walletId');
  
  // Filter categories based on the selected type
  const filteredCategories = categories.filter(
    category => (currentType === 'income' || currentType === 'expense') && category.type === currentType
  );

  // Filter wallets for "to wallet" selection (exclude the "from wallet")
  const filteredWallets = wallets.filter(wallet => wallet.id !== currentWalletId);
  
  const onSubmit = (data: EntryFormValues) => {
    const entryData = {
      amount: Number(data.amount),
      currency: data.currency,
      description: data.description,
      date: data.date.toISOString(),
      categoryId: data.categoryId,
      type: data.type,
      walletId: data.walletId,
      toWalletId: data.toWalletId,
      receivedAmount: data.receivedAmount ? Number(data.receivedAmount) : undefined,
      receivedCurrency: data.receivedCurrency,
    };

    editEntry(entry.id as any, entryData);
    onClose();
  };

  // Handle auto-fill for received amount when currency is the same
  useEffect(() => {
    const sentCurrency = watch('currency');
    const receivedCurrency = watch('receivedCurrency');
    const amount = watch('amount');
    
    // Only auto-update received amount if:
    // 1. The currencies match AND
    // 2. The user hasn't already set a received amount OR the currencies just changed
    const isInitialLoad = entry.receivedAmount === undefined;
    const didCurrenciesChange = sentCurrency === receivedCurrency && 
                               (entry.currency !== sentCurrency || entry.receivedCurrency !== receivedCurrency);
    
    if (currentType === 'transfer' && amount && sentCurrency === receivedCurrency && (isInitialLoad || didCurrenciesChange)) {
      setValue('receivedAmount', amount);
    }
  }, [watch('amount'), watch('currency'), watch('receivedCurrency'), currentType, setValue, watch, entry]);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-6 py-6">
        {/* Type Selection */}
        <div className="grid gap-3">
          <Label>Type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <RadioGroup 
                value={field.value} 
                onValueChange={field.onChange}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="cursor-pointer text-green-500">Income</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="cursor-pointer text-red-500">Expense</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="cursor-pointer text-purple-500">Transfer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="topup" id="topup" />
                  <Label htmlFor="topup" className="cursor-pointer text-blue-500">Topup</Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>

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
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PP") : <span>Pick a date</span>}
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
                    onSelect={(date) => {
                      field.onChange(date);
                      setDate(date || new Date());
                      setDateOpen(false);
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
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}; 