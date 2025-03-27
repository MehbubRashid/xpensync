import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEvolu } from '@/evolu/EvoluContext';
import { toast } from 'sonner';
import { Mnemonic } from '@evolu/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useCurrency } from '@/context/CurrencyContext';
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Settings: React.FC = () => {
  const [currentMnemonic, setCurrentMnemonic] = useState('');
  const [restoreMnemonic, setRestoreMnemonic] = useState('');
  const evolu = useEvolu();
  const { 
    allCurrencies, 
    availableCurrencies, 
    setEnabledCurrencies, 
    exchangeRates,
    customCurrencies,
    setCustomCurrencies 
  } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [editingCustom, setEditingCustom] = useState<{ currencyName: string; rate: number } | null>(null);
  const [newCustomCurrency, setNewCustomCurrency] = useState({ currencyName: '', rate: 0 });

  useEffect(() => {
    const owner = evolu.getOwner();
    if (owner) {
      setCurrentMnemonic(owner.mnemonic);
    }
  }, [evolu]);

  const handleRestore = () => {
    try {
      evolu.restoreOwner(restoreMnemonic as Mnemonic);
      toast.success('Data restored successfully');
    } catch (error) {
      toast.error('Failed to restore data');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMnemonic);
      toast.success('Private key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy private key');
    }
  };

  const handleAddCustomCurrency = () => {
    if (!newCustomCurrency.currencyName || !newCustomCurrency.rate) {
      toast.error('Please fill in all fields');
      return;
    }

    const updatedCurrencies = [
      ...customCurrencies,
      newCustomCurrency
    ];
    setCustomCurrencies(updatedCurrencies);
    setIsAddingCustom(false);
    setNewCustomCurrency({ currencyName: '', rate: 0 });
    toast.success('Custom currency added successfully');
  };

  const handleEditCustomCurrency = () => {
    if (!editingCustom) return;

    const updatedCurrencies = customCurrencies.map(curr => 
      curr.currencyName === editingCustom.currencyName ? editingCustom : curr
    );
    setCustomCurrencies(updatedCurrencies);
    setEditingCustom(null);
    toast.success('Custom currency updated successfully');
  };

  const handleDeleteCustomCurrency = (currencyName: string) => {
    const updatedCurrencies = customCurrencies.filter(curr => curr.currencyName !== currencyName);
    setCustomCurrencies(updatedCurrencies);
    toast.success('Custom currency deleted successfully');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="private-key" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="private-key">Private Key</TabsTrigger>
            <TabsTrigger value="currencies">Currencies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="private-key" className="space-y-10 pt-10">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Current Private Key</h3>
              <p className="text-sm text-muted-foreground">
                Store this private key somewhere safe. You can use this private key to restore your data in another device.
              </p>
              <Textarea
                value={currentMnemonic}
                readOnly
                className="font-mono"
                rows={3}
              />
              <Button onClick={handleCopy} className="w-full">
                Copy Private Key
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Restore from Private Key</h3>
              <Textarea
                value={restoreMnemonic}
                onChange={(e) => setRestoreMnemonic(e.target.value)}
                className="font-mono"
                rows={3}
                placeholder="Enter your private key here..."
              />
              <Button onClick={handleRestore} className="w-full">
                Restore Data
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="currencies" className='pt-10'>
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search currencies..."
                    className="pl-8 leading-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="rounded-md border">
                  <div className="divide-y max-h-[200px] overflow-y-auto">
                    {allCurrencies
                      .filter(currency => 
                        currency.toLowerCase().includes(searchQuery.toLowerCase()) &&
                        !customCurrencies.some(c => c.currencyName === currency)
                      )
                      .map((currency) => (
                        <div key={currency} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <p className="text-sm font-medium">{currency}</p>
                              <p className="text-xs text-muted-foreground">
                                {currency === 'USD' ? 'Base currency' : `1 USD = ${exchangeRates[currency]} ${currency}`}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={availableCurrencies.includes(currency)}
                            onCheckedChange={(checked) => {
                              const newCurrencies = checked
                                ? [...availableCurrencies, currency]
                                : availableCurrencies.filter(c => c !== currency);
                              setEnabledCurrencies(newCurrencies);
                            }}
                            disabled={currency === 'USD'}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Custom Currencies</h3>
                  </div>
                  <Button onClick={() => setIsAddingCustom(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search custom currencies..."
                    className="pl-8 leading-none"
                    value={customSearchQuery}
                    onChange={(e) => setCustomSearchQuery(e.target.value)}
                  />
                </div>
                <div className="rounded-md border">
                  <div className="divide-y max-h-[300px] overflow-y-auto">
                    {customCurrencies
                      .filter(currency => 
                        currency.currencyName.toLowerCase().includes(customSearchQuery.toLowerCase())
                      )
                      .map((currency) => (
                        <div key={currency.currencyName} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <p className="text-sm font-medium">{currency.currencyName}</p>
                              <p className="text-xs text-muted-foreground">
                                1 USD = {currency.rate} {currency.currencyName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingCustom(currency)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCustomCurrency(currency.currencyName)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <Dialog open={isAddingCustom} onOpenChange={setIsAddingCustom}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Currency</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="currencyName">Currency Code</Label>
                    <Input
                      id="currencyName"
                      value={newCustomCurrency.currencyName}
                      onChange={(e) => setNewCustomCurrency(prev => ({
                        ...prev,
                        currencyName: e.target.value.toUpperCase()
                      }))}
                      placeholder="e.g., BTC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Exchange Rate (1 USD = ?)</Label>
                    <Input
                      id="rate"
                      type="number"
                      value={newCustomCurrency.rate}
                      onChange={(e) => setNewCustomCurrency(prev => ({
                        ...prev,
                        rate: parseFloat(e.target.value)
                      }))}
                      placeholder="e.g., 0.000025"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingCustom(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCustomCurrency}>
                    Add Currency
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={!!editingCustom} onOpenChange={(open) => !open && setEditingCustom(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Custom Currency</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editCurrencyName">Currency Code</Label>
                    <Input
                      id="editCurrencyName"
                      value={editingCustom?.currencyName || ''}
                      onChange={(e) => setEditingCustom(prev => prev ? {
                        ...prev,
                        currencyName: e.target.value.toUpperCase()
                      } : null)}
                      placeholder="e.g., BTC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRate">Exchange Rate (1 USD = ?)</Label>
                    <Input
                      id="editRate"
                      type="number"
                      value={editingCustom?.rate || 0}
                      onChange={(e) => setEditingCustom(prev => prev ? {
                        ...prev,
                        rate: parseFloat(e.target.value)
                      } : null)}
                      placeholder="e.g., 0.000025"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingCustom(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditCustomCurrency}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 