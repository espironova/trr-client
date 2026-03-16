import { useState } from 'react';
import { Star, MessageSquare, Loader2, Download } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFeedback, useUpdateFeedback } from '@/hooks/useFeedback';
import { exportToCSV } from '@/lib/csv-export';
import { format } from 'date-fns';

function Stars({ count }: { count: number | null }) {
  if (!count) return <span className="text-xs text-muted-foreground">No rating</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`w-4 h-4 ${s <= count ? 'fill-[hsl(var(--accent))] text-[hsl(var(--accent))]' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function AdminFeedback() {
  const { toast } = useToast();
  const { data: feedback = [], isLoading } = useFeedback();
  const updateFeedback = useUpdateFeedback();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = feedback.filter(f => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (filterType !== 'all' && f.feedback_type !== filterType) return false;
    return true;
  });

  const handleExpand = (id: string, existingComment: string | null) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setComment(existingComment || '');
  };

  const handleUpdate = async (id: string, status: string) => {
    try {
      await updateFeedback.mutateAsync({ id, status, admin_comment: comment || undefined });
      toast({ title: 'Feedback updated' });
      setExpandedId(null);
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleExportCSV = () => {
    const data = filtered.map(f => ({
      name: f.name,
      phone: f.phone,
      feedback_type: f.feedback_type,
      rating: f.rating,
      message: f.message,
      status: f.status,
      admin_comment: f.admin_comment,
      created_at: f.created_at,
    }));
    exportToCSV(data as any, 'feedback');
    toast({ title: 'CSV exported' });
  };

  const unreviewed = feedback.filter(f => f.status === 'not_reviewed').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Feedback</h1>
            {unreviewed > 0 && (
              <p className="text-sm text-muted-foreground">{unreviewed} unreviewed</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_reviewed">Not Reviewed</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Compliment">Compliment</SelectItem>
                <SelectItem value="Suggestion">Suggestion</SelectItem>
                <SelectItem value="Complaint">Complaint</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No feedback found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="cursor-pointer" onClick={() => handleExpand(item.id, item.admin_comment)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{item.name}</span>
                          <Badge variant={item.status === 'reviewed' ? 'default' : 'secondary'} className="text-xs">
                            {item.status === 'reviewed' ? 'Reviewed' : 'Not Reviewed'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{item.feedback_type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <Stars count={item.rating} />
                          {item.phone && <span className="text-xs text-muted-foreground">{item.phone}</span>}
                        </div>
                        {item.message && <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>}
                        {item.admin_comment && (
                          <p className="mt-2 text-xs text-primary italic border-l-2 border-primary pl-2">
                            Staff: {item.admin_comment}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(item.created_at), 'dd MMM yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  {expandedId === item.id && (
                    <div className="mt-4 pt-3 border-t border-border space-y-3">
                      <Textarea placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={500} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(item.id, 'reviewed')} disabled={updateFeedback.isPending}>Mark Reviewed</Button>
                        {item.status === 'reviewed' && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdate(item.id, 'not_reviewed')} disabled={updateFeedback.isPending}>Unmark</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setExpandedId(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
