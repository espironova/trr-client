import { useState } from 'react';
import { Send, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateFeedback } from '@/hooks/useFeedback';

const FEEDBACK_TYPES = ['Compliment', 'Suggestion', 'Complaint', 'General'];

function StarRating({ rating, onRate }: { rating: number; onRate: (r: number) => void }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hover || rating)
                ? 'fill-[hsl(var(--accent))] text-[hsl(var(--accent))]'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function FeedbackSection() {
  const { toast } = useToast();
  const createFeedback = useCreateFeedback();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    feedback_type: '',
    rating: 0,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (!formData.feedback_type) {
      toast({ title: 'Please select a feedback type', variant: 'destructive' });
      return;
    }
    if (formData.rating === 0) {
      toast({ title: 'Please rate us', variant: 'destructive' });
      return;
    }

    try {
      await createFeedback.mutateAsync({
        name: formData.name,
        phone: formData.phone || null,
        feedback_type: formData.feedback_type,
        rating: formData.rating,
        message: formData.message || null,
      });

      toast({ title: 'Thank you for your feedback!' });
      setFormData({ name: '', phone: '', feedback_type: '', rating: 0, message: '' });
    } catch {
      toast({ title: 'Failed to submit feedback', variant: 'destructive' });
    }
  };

  return (
    <section className="py-8 bg-card border-t border-border">
      <div className="container">
        <h2 className="font-display text-2xl font-bold text-center text-foreground mb-6">
          Give Us Feedback
        </h2>

        {/* Star Rating */}
        <div className="flex flex-col items-center mb-6">
          <p className="text-sm text-muted-foreground mb-2">Rate your experience</p>
          <StarRating rating={formData.rating} onRate={(r) => setFormData(prev => ({ ...prev, rating: r }))} />
        </div>

        {/* Feedback Form */}
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Your Name *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-background"
              maxLength={100}
            />
            <Input
              type="tel"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-background"
              maxLength={20}
            />
            <Select
              value={formData.feedback_type}
              onValueChange={(v) => setFormData(prev => ({ ...prev, feedback_type: v }))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Type of Feedback *" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Your message (optional)"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="bg-background resize-none"
              maxLength={1000}
            />
            <Button type="submit" className="w-full" disabled={createFeedback.isPending}>
              {createFeedback.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Feedback
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Prices subject to review without notice
        </p>
      </div>
    </section>
  );
}
