import { Phone, Share2 } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { ThemeToggle } from './ThemeToggle';
import logo from '@/assets/logo.jpg';
import whatsappIcon from '@/assets/whatsapp-icon.webp';

export function Header() {
  const { data: settings } = useSettings();
  const phoneNumber = settings?.phone_number || '+254 795 625 851';
  const whatsappNumber = settings?.whatsapp_number || '254795625851';

  return (
    <header className="sticky top-0 z-50 gradient-hero border-b border-border/50 shadow-soft">
      <div className="container py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 shadow-md">
              <img 
                src={logo} 
                alt="Twin Rivers Resort Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-primary leading-tight">
                Twin Rivers Resort
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Tigoni</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={`tel:${phoneNumber.replace(/\s/g, '')}`}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Call us"
            >
              <Phone className="w-5 h-5" />
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden"
              aria-label="WhatsApp"
            >
              <img src={whatsappIcon} alt="WhatsApp" className="w-10 h-10" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
