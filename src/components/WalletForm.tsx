import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEntry } from '@/context/EntryContext';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';

export interface WalletFormProps {
  onWalletAdded?: (walletId: string) => void;
}

const WalletForm: React.FC<WalletFormProps> = ({ onWalletAdded }) => {
  const { addWallet } = useEntry();
  const [open, setOpen] = React.useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
    }
  });
  
  const onSubmit = (data: { name: string }) => {
    const newWallet = addWallet({
      name: data.name,
    });
    
    reset();
    setOpen(false);
    
    if (onWalletAdded) {
      onWalletAdded(newWallet.id);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>New Wallet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create a New Wallet</DialogTitle>
            <DialogDescription>
              Add a new wallet to track your finances.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-8">
            <div className="grid gap-2">
              <Label htmlFor="name">Wallet Name</Label>
              <Input
                id="name"
                placeholder="Wallet name"
                {...register('name', { required: 'Wallet name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Wallet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WalletForm; 