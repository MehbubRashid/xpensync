import React, { useState } from 'react';
import { useEntry } from '@/context/EntryContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WalletForm from './WalletForm';
import { Currency } from '@/types';

interface EditWalletDialogProps {
  walletId: string;
  initialName: string;
  onClose: () => void;
}

const EditWalletDialog: React.FC<EditWalletDialogProps> = ({
  walletId,
  initialName,
  onClose
}) => {
  const { editWallet } = useEntry();
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editWallet(walletId, { name });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Wallet</DialogTitle>
        <DialogDescription>
          Make changes to your wallet here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wallet name"
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
};

interface TopupWalletDialogProps {
  walletId: string;
  walletName: string;
  onClose: () => void;
}

const TopupWalletDialog: React.FC<TopupWalletDialogProps> = ({
  walletId,
  walletName,
  onClose
}) => {
  const { addEntry } = useEntry();
  const { selectedCurrency, availableCurrencies } = useCurrency();
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(selectedCurrency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a topup transaction
    addEntry({
      type: 'topup',
      amount: Number(amount),
      currency,
      description: `Topup: ${walletName}`,
      categoryId: '', // No category for topup
      walletId,
      date: new Date().toISOString(),
    });
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Top Up Wallet: {walletName}</DialogTitle>
        <DialogDescription>
          Add funds to your wallet by creating a topup transaction.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Topup Amount</Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1"
              required
            />
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter className='gap-2 sm:gap-0'>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Complete Topup</Button>
      </DialogFooter>
    </form>
  );
};

export const WalletsList: React.FC = () => {
  const { wallets, deleteWallet, entries } = useEntry();
  const { convertAmount, selectedCurrency } = useCurrency();
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [topupWallet, setTopupWallet] = useState<string | null>(null);

  const handleDeleteWallet = (id: string) => {
    deleteWallet(id);
  };

  // Calculate current balance for each wallet
  const calculateWalletBalance = (walletId: string) => {
    // Get all entries for this wallet (either as source or destination for transfers)
    const walletEntries = entries.filter(entry => 
      entry.walletId === walletId || (entry.type === 'transfer' && entry.toWalletId === walletId)
    );
    
    // Calculate income and expense totals
    const totals = walletEntries.reduce((acc, entry) => {
      // Handle different entry types
      if (entry.type === 'transfer') {
        // For transfers, check if this wallet is the source or destination
        if (entry.walletId === walletId) {
          // This wallet is the source (money going out)
          const convertedAmount = convertAmount(entry.amount, entry.currency as Currency);
          acc.expense += convertedAmount;
        } else if (entry.toWalletId === walletId) {
          // This wallet is the destination (money coming in)
          const receivedAmount = entry.receivedAmount || entry.amount;
          const receivedCurrency = entry.receivedCurrency || entry.currency;
          const convertedAmount = convertAmount(receivedAmount, receivedCurrency as Currency);
          acc.income += convertedAmount;
        }
      } else {
        // Handle non-transfer entries
        const convertedAmount = convertAmount(entry.amount, entry.currency as Currency);
        if (entry.type === 'income' || entry.type === 'topup') {
          acc.income += convertedAmount;
        } else if (entry.type === 'expense') {
          acc.expense += convertedAmount;
        }
      }
      return acc;
    }, { income: 0, expense: 0 });
    
    // Current balance = income - expense
    return totals.income - totals.expense;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div></div>
        <WalletForm />
      </div>

      <div className="divide-y divide-border rounded-md border bg-card text-card-foreground shadow-sm">
        {wallets?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-muted-foreground">No wallets yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a wallet to get started</p>
          </div>
        ) : (
          wallets?.map((wallet) => {
            const currentBalance = calculateWalletBalance(wallet.id);
            return (
              <div key={wallet.id} className="flex justify-between items-center p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">{wallet.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Balance: <span className="font-medium">{currentBalance.toFixed(2)} {selectedCurrency}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={topupWallet === wallet.id} onOpenChange={(open) => !open && setTopupWallet(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1 text-primary"
                        onClick={() => setTopupWallet(wallet.id)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Topup</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card">
                      {topupWallet === wallet.id && (
                        <TopupWalletDialog
                          walletId={wallet.id}
                          walletName={wallet.name}
                          onClose={() => setTopupWallet(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  <Dialog open={editingWallet === wallet.id} onOpenChange={(open) => !open && setEditingWallet(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingWallet(wallet.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card">
                      {editingWallet === wallet.id && (
                        <EditWalletDialog
                          walletId={wallet.id}
                          initialName={wallet.name}
                          onClose={() => setEditingWallet(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card">
                      <DialogHeader>
                        <DialogTitle>Delete Wallet</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this wallet? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDeleteWallet(wallet.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}; 