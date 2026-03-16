import { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '@/hooks/useCategories';
import type { Category } from '@/lib/supabase-types';

export default function AdminCategories() {
  const { toast } = useToast();
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [dragItem, setDragItem] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true,
  });

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', display_order: categories.length, is_active: true });
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  const handleDrop = async (targetId: string) => {
    if (!dragItem || dragItem === targetId) return;
    const items = [...categories];
    const fromIdx = items.findIndex(c => c.id === dragItem);
    const toIdx = items.findIndex(c => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].display_order !== i) {
        await updateCategory.mutateAsync({ id: items[i].id, display_order: i });
      }
    }
    setDragItem(null);
    toast({ title: 'Order updated' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a category name.', variant: 'destructive' });
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, ...formData, description: formData.description || null });
        toast({ title: 'Category updated' });
      } else {
        await createCategory.mutateAsync({ ...formData, description: formData.description || null });
        toast({ title: 'Category created' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save category.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      toast({ title: 'Category deleted' });
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete category. Make sure it has no activities.', variant: 'destructive' });
    }
  };

  const isSaving = createCategory.isPending || updateCategory.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Categories</h1>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground mb-4">No categories yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first category
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border divide-y divide-border">
            {categories.map((category) => (
              <div 
                key={category.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                draggable
                onDragStart={() => setDragItem(category.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(category.id)}
              >
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{category.name}</h3>
                    {!category.is_active && (
                      <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground truncate">{category.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setDeletingCategory(category); setDeleteDialogOpen(true); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Activities & Games" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Optional description" className="mt-1" rows={3} />
            </div>
            <div>
              <Label htmlFor="order">Display Order</Label>
              <Input id="order" type="number" value={formData.display_order} onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))} className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Show to guests</Label>
              <Switch id="active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingCategory?.name}" and all its activities. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
