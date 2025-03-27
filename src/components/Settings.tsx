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
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useCurrency } from '@/context/CurrencyContext';

export const Settings: React.FC = () => {
  const [currentMnemonic, setCurrentMnemonic] = useState('');
  const [restoreMnemonic, setRestoreMnemonic] = useState('');
  const evolu = useEvolu();
  const { allCurrencies, availableCurrencies, setEnabledCurrencies, exchangeRates } = useCurrency();

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
            <div className="space-y-4">
              <div className="rounded-md border">
                <div className="divide-y">
                  {allCurrencies.map((currency) => (
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
                        disabled={currency === 'USD'} // USD cannot be disabled as it's the base currency
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 