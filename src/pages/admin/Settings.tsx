import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSettings, useUpdateSetting } from '@/hooks/useSettings';

export default function AdminSettings() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  
  const [formData, setFormData] = useState({
    phone_number: '',
    whatsapp_number: '',
  });
  
  useEffect(() => {
    if (settings) {
      setFormData({
        phone_number: settings.phone_number || '+254 795 625 851',
        whatsapp_number: settings.whatsapp_number || '254795625851',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'phone_number', value: formData.phone_number }),
        updateSetting.mutateAsync({ key: 'whatsapp_number', value: formData.whatsapp_number }),
      ]);
      
      toast({ title: 'Settings saved' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+254 xxx xxx xxx"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Displayed on the guest menu for the call button
              </p>
            </div>
            
            <div>
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                placeholder="254xxxxxxxxx"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Without + or spaces (e.g., 254795625851)
              </p>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={updateSetting.isPending}
              className="mt-4"
            >
              {updateSetting.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
