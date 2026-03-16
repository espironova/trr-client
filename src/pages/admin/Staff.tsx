import { useState } from 'react';
import { Plus, Trash2, Loader2, Shield, User } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole, Profile } from '@/lib/supabase-types';

interface StaffMember {
  user_id: string;
  role: 'admin' | 'staff';
  profile: Profile | null;
  email?: string;
}

export default function AdminStaff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    role: 'staff' as 'admin' | 'staff',
  });

  // Fetch all staff with roles
  const { data: staffMembers = [], isLoading } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      // Combine roles with profiles
      return (roles as UserRole[]).map(role => ({
        user_id: role.user_id,
        role: role.role,
        profile: (profiles as Profile[]).find(p => p.user_id === role.user_id) || null,
      }));
    },
  });

  // Add role to existing user by email
  const addStaffRole = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'staff' }) => {
      // First, we need to find the user by email - this is tricky without admin access
      // For now, we'll create a placeholder approach
      toast({
        title: 'Note',
        description: 'The user must first create an account by signing up at /auth',
      });
      throw new Error('User must sign up first, then their role can be assigned via database');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      setDialogOpen(false);
      toast({ title: 'Staff role added' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Info',
        description: error.message,
      });
    },
  });

  // Remove staff role
  const removeStaffRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Staff access removed' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove staff access.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return;
    addStaffRole.mutate(formData);
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;
    await removeStaffRole.mutateAsync(deletingStaff.user_id);
    setDeleteDialogOpen(false);
    setDeletingStaff(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Staff Management</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff
          </Button>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground mb-4">
            <strong>How to add staff:</strong> Have the person sign up at{' '}
            <code className="px-1 py-0.5 bg-muted rounded">/auth</code>, then you can assign 
            them a role directly in the database via the Cloud tab.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No staff members with roles yet</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border divide-y divide-border">
            {staffMembers.map((staff) => (
              <div 
                key={staff.user_id}
                className="flex items-center gap-4 p-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {staff.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-primary" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">
                    {staff.profile?.full_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">{staff.role}</p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setDeletingStaff(staff);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Add Staff Member</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="staff@example.com"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v: 'admin' | 'staff') => setFormData(prev => ({ ...prev, role: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addStaffRole.isPending}>
                {addStaffRole.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Staff
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove staff access for {deletingStaff?.profile?.full_name || 'this user'}. 
              They will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
