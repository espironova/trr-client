import { useState } from 'react';
import { Phone, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { useCreateInquiry } from '@/hooks/useInquiries';
import whatsappIcon from '@/assets/whatsapp-icon.webp';

export function ContactSection() {
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const createInquiry = useCreateInquiry();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const phoneNumber = settings?.phone_number || '+254 795 625 851';
  const whatsappNumber = settings?.whatsapp_number || '254795625851';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.message.trim()) {
      toast({
        title: 'Required fields missing',
        description: 'Please enter your name and message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createInquiry.mutateAsync({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        message: formData.message,
      });
      
      toast({
        title: 'Message sent!',
        description: 'We\'ll get back to you soon.',
      });
      
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="py-8 bg-card border-t border-border">
      <div className="container">
        <h2 className="font-display text-2xl font-bold text-center text-foreground mb-6">
          Contact Us
        </h2>
        
        {/* Quick Contact Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <a
            href={`tel:${phoneNumber.replace(/\s/g, '')}`}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-soft"
          >
            <Phone className="w-5 h-5" />
            <span>Call Now</span>
          </a>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-medium hover:bg-[#20BD5A] transition-colors shadow-soft"
          >
            <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
            <span>WhatsApp</span>
          </a>
        </div>
        
        {/* Inquiry Form */}
        <div className="max-w-md mx-auto">
          <p className="text-center text-muted-foreground mb-4">
            Or send us a message
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Your Name *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-background"
            />
            <Input
              type="email"
              placeholder="Email (optional)"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-background"
            />
            <Input
              type="tel"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-background"
            />
            <Textarea
              placeholder="Your Message *"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="bg-background resize-none"
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={createInquiry.isPending}
            >
              {createInquiry.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Message
            </Button>
          </form>
        </div>
        
        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Prices subject to review without notice
        </p>
      </div>
    </section>
  );
}
