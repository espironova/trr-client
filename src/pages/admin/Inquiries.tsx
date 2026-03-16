import { formatDistanceToNow } from 'date-fns';
import { Mail, Phone, Eye, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { useInquiries, useMarkInquiryRead } from '@/hooks/useInquiries';

export default function AdminInquiries() {
  const { data: inquiries = [], isLoading } = useInquiries();
  const markRead = useMarkInquiryRead();

  const handleMarkRead = async (id: string) => {
    await markRead.mutateAsync(id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Inquiries</h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No inquiries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div 
                key={inquiry.id}
                className={`bg-card rounded-lg border p-4 ${
                  inquiry.is_read ? 'border-border' : 'border-primary/50 bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground">{inquiry.name}</h3>
                      {!inquiry.is_read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {inquiry.email && (
                        <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1 hover:text-foreground">
                          <Mail className="w-3 h-3" />
                          {inquiry.email}
                        </a>
                      )}
                      {inquiry.phone && (
                        <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1 hover:text-foreground">
                          <Phone className="w-3 h-3" />
                          {inquiry.phone}
                        </a>
                      )}
                    </div>
                    
                    <p className="mt-3 text-foreground whitespace-pre-wrap">{inquiry.message}</p>
                    
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  {!inquiry.is_read && (
                    <button
                      onClick={() => handleMarkRead(inquiry.id)}
                      className="shrink-0 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
