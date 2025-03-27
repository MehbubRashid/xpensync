import React, { useState } from 'react';
import { useEntry } from '@/context/EntryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { EntryType } from '@/types';
import CategoryForm from './CategoryForm';

interface EditCategoryDialogProps {
  categoryId: string;
  initialName: string;
  initialType: EntryType;
  onClose: () => void;
}

const EditCategoryDialog: React.FC<EditCategoryDialogProps> = ({
  categoryId,
  initialName,
  initialType,
  onClose
}) => {
  const { editCategory } = useEntry();
  const [name, setName] = useState(initialName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editCategory(categoryId, { name });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogDescription>
          Make changes to your category name here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
          />
        </div>
      </div>
      <DialogFooter className='gap-2 sm:gap-0'>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
};

export const CategoriesList: React.FC = () => {
  const { categories, deleteCategory } = useEntry();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div></div>
        <CategoryForm />
      </div>

      <div className="divide-y divide-border rounded-md border bg-card text-card-foreground shadow-sm">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm text-muted-foreground">No categories yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a category to get started</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex justify-between items-center p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">{category.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{category.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={editingCategory === category.id} onOpenChange={(open) => !open && setEditingCategory(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingCategory(category.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card">
                    {editingCategory === category.id && (
                      <EditCategoryDialog
                        categoryId={category.id}
                        initialName={category.name}
                        initialType={category.type}
                        onClose={() => setEditingCategory(null)}
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
                      <DialogTitle>Delete Category</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this category? This action cannot be undone and will affect all transactions using this category.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='gap-2 sm:gap-0'>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 