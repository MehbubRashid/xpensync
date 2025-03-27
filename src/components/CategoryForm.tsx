
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEntry } from '@/context/EntryContext';
import { EntryType } from '@/types';
import { useForm } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';

export interface CategoryFormProps {
  onCategoryAdded?: (categoryId: string) => void;
  defaultType?: EntryType;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onCategoryAdded, defaultType = 'expense' }) => {
  const { addCategory } = useEntry();
  const [open, setOpen] = React.useState(false);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      type: defaultType,
    }
  });
  
  const currentType = watch('type');
  
  const onSubmit = (data: { name: string; type: EntryType }) => {
    const newCategory = addCategory({
      name: data.name,
      type: data.type,
    });
    
    reset();
    setOpen(false);
    
    if (onCategoryAdded) {
      onCategoryAdded(newCategory.id);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>New Category</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create a New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your finances.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-8 py-8">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Category name"
                {...register('name', { required: 'Category name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="grid gap-3">
              <Label>Type</Label>
              <RadioGroup 
                value={currentType} 
                onValueChange={(value) => setValue('type', value as EntryType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="cursor-pointer">Income</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="cursor-pointer">Expense</Label>
                </div>
              </RadioGroup>
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
            <Button type="submit">Create Category</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryForm;
