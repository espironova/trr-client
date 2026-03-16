import { Loader2, History } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

function useAuditLog() {
  return useQuery({
    queryKey: ['audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as AuditLogEntry[];
    },
    staleTime: 30_000,
  });
}

const actionColors: Record<string, string> = {
  INSERT: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
};

export default function AuditLogPage() {
  const { data: logs = [], isLoading } = useAuditLog();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Audit Log</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <History className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No audit log entries yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const entityName = (log.details as any)?.new?.name || (log.details as any)?.old?.name || log.entity_id?.slice(0, 8);
              return (
                <Card key={log.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <Badge variant={actionColors[log.action] as any || 'outline'}>
                      {log.action}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        <span className="capitalize">{log.entity_type}</span>
                        {entityName && <span className="text-muted-foreground"> — {entityName}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
