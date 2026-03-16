import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, ImagePlus, Layers, Download, GripVertical, Check } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { 
  useActivities, 
  useCreateActivity, 
  useUpdateActivity, 
  useDeleteActivity 
} from '@/hooks/useActivities';
import { useImageUploadOptimized } from '@/hooks/useImageUploadOptimized';
import { PricingTiersEditor } from '@/components/admin/PricingTiersEditor';
import { exportToCSV } from '@/lib/csv-export';
import type { Activity } from '@/lib/supabase-types';

export default function AdminActivities() {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const { data: activities = [], isLoading } = useActivities();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();
  const { uploadImage, uploading } = useImageUploadOptimized();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tiersDialogOpen, setTiersDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [tiersActivity, setTiersActivity] = useState<Activity | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkPriceAdjust, setBulkPriceAdjust] = useState('');
  const [dragItem, setDragItem] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    price_weekday: '',
    price_weekend: '',
    price_nonres: '',
    price_weekday_nonres: '',
    price_weekend_nonres: '',
    price_note: '',
    image_url: '',
    display_order: 0,
    is_active: true,
    operating_hours: '',
  });

  const filteredActivities = filterCategory === 'all' 
    ? activities 
    : activities.filter(a => a.category_id === filterCategory);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkActivate = async (activate: boolean) => {
    for (const id of selectedIds) {
      await updateActivity.mutateAsync({ id, is_active: activate });
    }
    setSelectedIds(new Set());
    toast({ title: `${selectedIds.size} activities ${activate ? 'activated' : 'deactivated'}` });
  };

  const handleBulkPriceAdjust = async () => {
    const pct = parseFloat(bulkPriceAdjust);
    if (isNaN(pct)) return;
    const multiplier = 1 + pct / 100;
    
    for (const id of selectedIds) {
      const act = activities.find(a => a.id === id);
      if (!act) continue;
      const updates: Partial<Activity> & { id: string } = { id };
      if (act.price !== null) updates.price = Math.round(act.price * multiplier);
      if (act.price_weekday !== null) updates.price_weekday = Math.round(act.price_weekday * multiplier);
      if (act.price_weekend !== null) updates.price_weekend = Math.round(act.price_weekend * multiplier);
      if (act.price_nonres !== null) updates.price_nonres = Math.round(act.price_nonres * multiplier);
      if (act.price_weekday_nonres !== null) updates.price_weekday_nonres = Math.round(act.price_weekday_nonres * multiplier);
      if (act.price_weekend_nonres !== null) updates.price_weekend_nonres = Math.round(act.price_weekend_nonres * multiplier);
      await updateActivity.mutateAsync(updates);
    }
    setSelectedIds(new Set());
    setBulkDialogOpen(false);
    setBulkPriceAdjust('');
    toast({ title: `Prices adjusted by ${pct}%` });
  };

  const handleDragStart = (id: string) => setDragItem(id);
  const handleDrop = async (targetId: string) => {
    if (!dragItem || dragItem === targetId) return;
    const items = [...filteredActivities];
    const fromIdx = items.findIndex(a => a.id === dragItem);
    const toIdx = items.findIndex(a => a.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].display_order !== i) {
        await updateActivity.mutateAsync({ id: items[i].id, display_order: i });
      }
    }
    setDragItem(null);
  };

  const handleExportCSV = () => {
    const data = filteredActivities.map(a => ({
      name: a.name,
      category: (a as any).categories?.name || '',
      price: a.price,
      price_weekday: a.price_weekday,
      price_weekend: a.price_weekend,
      price_nonres: a.price_nonres,
      price_weekday_nonres: a.price_weekday_nonres,
      price_weekend_nonres: a.price_weekend_nonres,
      price_note: a.price_note,
      operating_hours: (a as any).operating_hours,
      is_active: a.is_active,
    }));
    exportToCSV(data as any, 'activities');
    toast({ title: 'CSV exported' });
  };

  const openCreateDialog = () => {
    setEditingActivity(null);
    setFormData({
      category_id: categories[0]?.id || '',
      name: '',
      description: '',
      price: '',
      price_weekday: '',
      price_weekend: '',
      price_nonres: '',
      price_weekday_nonres: '',
      price_weekend_nonres: '',
      price_note: '',
      image_url: '',
      display_order: activities.length,
      is_active: true,
      operating_hours: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      category_id: activity.category_id,
      name: activity.name,
      description: activity.description || '',
      price: activity.price?.toString() || '',
      price_weekday: activity.price_weekday?.toString() || '',
      price_weekend: activity.price_weekend?.toString() || '',
      price_nonres: activity.price_nonres?.toString() || '',
      price_weekday_nonres: activity.price_weekday_nonres?.toString() || '',
      price_weekend_nonres: activity.price_weekend_nonres?.toString() || '',
      price_note: activity.price_note || '',
      image_url: activity.image_url || '',
      display_order: activity.display_order,
      is_active: activity.is_active,
      operating_hours: (activity as any).operating_hours || '',
    });
    setDialogOpen(true);
  };

  const openTiersDialog = (activity: Activity) => {
    setTiersActivity(activity);
    setTiersDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImage(file);
    if (url) {
      setFormData(prev => ({ ...prev, image_url: url }));
      toast({ title: 'Image uploaded' });
    } else {
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category_id) {
      toast({ title: 'Required fields missing', description: 'Please enter a name and select a category.', variant: 'destructive' });
      return;
    }

    const activityData: any = {
      category_id: formData.category_id,
      name: formData.name,
      description: formData.description || null,
      price: formData.price ? parseFloat(formData.price) : null,
      price_weekday: formData.price_weekday ? parseFloat(formData.price_weekday) : null,
      price_weekend: formData.price_weekend ? parseFloat(formData.price_weekend) : null,
      price_nonres: formData.price_nonres ? parseFloat(formData.price_nonres) : null,
      price_weekday_nonres: formData.price_weekday_nonres ? parseFloat(formData.price_weekday_nonres) : null,
      price_weekend_nonres: formData.price_weekend_nonres ? parseFloat(formData.price_weekend_nonres) : null,
      price_note: formData.price_note || null,
      image_url: formData.image_url || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
      operating_hours: formData.operating_hours || null,
    };

    try {
      if (editingActivity) {
        await updateActivity.mutateAsync({ id: editingActivity.id, ...activityData });
        toast({ title: 'Activity updated' });
      } else {
        await createActivity.mutateAsync(activityData);
        toast({ title: 'Activity created' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save activity.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingActivity) return;
    try {
      await deleteActivity.mutateAsync(deletingActivity.id);
      toast({ title: 'Activity deleted' });
      setDeleteDialogOpen(false);
      setDeletingActivity(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete activity.', variant: 'destructive' });
    }
  };

  const isSaving = createActivity.isPending || updateActivity.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Activities</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </div>
        </div>

        {/* Bulk actions toolbar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
            <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => handleBulkActivate(true)}>Activate</Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkActivate(false)}>Deactivate</Button>
            <Button size="sm" variant="outline" onClick={() => setBulkDialogOpen(true)}>Adjust Prices</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground mb-4">
              {activities.length === 0 ? 'No activities yet' : 'No activities in this category'}
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((activity) => (
              <div 
                key={activity.id}
                className="bg-card rounded-lg border border-border overflow-hidden"
                draggable
                onDragStart={() => handleDragStart(activity.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(activity.id)}
              >
                {activity.image_url ? (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={activity.image_url} 
                      alt={activity.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedIds.has(activity.id)}
                        onCheckedChange={() => toggleSelect(activity.id)}
                        className="mt-1"
                      />
                      <div>
                        <h3 className="font-medium text-foreground">{activity.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {(activity as any).categories?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      {!activity.is_active && (
                        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-secondary font-medium">
                    {activity.price !== null && `KES ${activity.price.toLocaleString()}`}
                    {activity.price_weekday !== null && ` Weekday: KES ${activity.price_weekday.toLocaleString()}`}
                    {activity.price_weekend !== null && ` Weekend: KES ${activity.price_weekend.toLocaleString()}`}
                    {activity.price === null && activity.price_weekday === null && (
                      <span className="text-muted-foreground italic">
                        {activity.price_note || 'Not set'}
                      </span>
                    )}
                  </div>

                  {(activity as any).operating_hours && (
                    <p className="mt-1 text-xs text-muted-foreground">🕐 {(activity as any).operating_hours}</p>
                  )}
                  
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                    <Button variant="ghost" size="sm" onClick={() => openTiersDialog(activity)} title="Manage pricing tiers">
                      <Layers className="w-4 h-4 mr-1" />
                      Tiers
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(activity)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setDeletingActivity(activity); setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingActivity ? 'Edit Activity' : 'New Activity'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Ziplining" className="mt-1" />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Activity description" className="mt-1" rows={2} />
            </div>
            
            {/* Resident Pricing */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Resident Pricing (KES)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="price">Simple</Label>
                  <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="price_weekday">Weekday</Label>
                  <Input id="price_weekday" type="number" value={formData.price_weekday} onChange={(e) => setFormData(prev => ({ ...prev, price_weekday: e.target.value }))} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="price_weekend">Weekend</Label>
                  <Input id="price_weekend" type="number" value={formData.price_weekend} onChange={(e) => setFormData(prev => ({ ...prev, price_weekend: e.target.value }))} placeholder="0" className="mt-1" />
                </div>
              </div>
            </div>
            
            {/* Non-Resident Pricing */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Non-Resident Pricing ($)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="price_nonres">Simple</Label>
                  <Input id="price_nonres" type="number" value={formData.price_nonres} onChange={(e) => setFormData(prev => ({ ...prev, price_nonres: e.target.value }))} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="price_weekday_nonres">Weekday</Label>
                  <Input id="price_weekday_nonres" type="number" value={formData.price_weekday_nonres} onChange={(e) => setFormData(prev => ({ ...prev, price_weekday_nonres: e.target.value }))} placeholder="0" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="price_weekend_nonres">Weekend</Label>
                  <Input id="price_weekend_nonres" type="number" value={formData.price_weekend_nonres} onChange={(e) => setFormData(prev => ({ ...prev, price_weekend_nonres: e.target.value }))} placeholder="0" className="mt-1" />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="price_note">Price Note / Display Text</Label>
              <Input id="price_note" value={formData.price_note} onChange={(e) => setFormData(prev => ({ ...prev, price_note: e.target.value }))} placeholder='e.g., "Free", "Prices upon request"' className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Shown on the guest page when no numeric price is set.</p>
            </div>

            <div>
              <Label htmlFor="operating_hours">Operating Hours</Label>
              <Input id="operating_hours" value={formData.operating_hours} onChange={(e) => setFormData(prev => ({ ...prev, operating_hours: e.target.value }))} placeholder='e.g., "9:00 AM - 5:00 PM"' className="mt-1" />
            </div>
            
            <div>
              <Label>Image</Label>
              <div className="mt-1 flex items-center gap-4">
                {formData.image_url ? (
                  <div className="relative w-20 h-20">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs">×</button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full" />
                  {uploading && <p className="text-xs text-muted-foreground mt-1">Compressing & uploading...</p>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Show to guests</Label>
              <Switch id="active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving || uploading}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingActivity ? 'Save Changes' : 'Create Activity'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingActivity?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Price Adjust Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Adjust all prices for {selectedIds.size} selected activities by a percentage.</p>
            <div>
              <Label htmlFor="pctAdjust">Percentage (%)</Label>
              <Input id="pctAdjust" type="number" value={bulkPriceAdjust} onChange={(e) => setBulkPriceAdjust(e.target.value)} placeholder="e.g., 10 or -5" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Use positive to increase, negative to decrease.</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkPriceAdjust} disabled={updateActivity.isPending}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Tiers Editor */}
      {tiersActivity && (
        <PricingTiersEditor
          activityId={tiersActivity.id}
          activityName={tiersActivity.name}
          open={tiersDialogOpen}
          onOpenChange={(open) => {
            setTiersDialogOpen(open);
            if (!open) setTiersActivity(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
