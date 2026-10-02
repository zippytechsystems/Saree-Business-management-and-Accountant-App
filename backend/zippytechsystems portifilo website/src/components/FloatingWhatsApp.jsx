import React from 'react';
import { MessageCircle } from 'lucide-react';
import { content, buildWhatsAppUrl } from '../data/content';

export default function FloatingWhatsApp() {
  const whatsappUrl = buildWhatsAppUrl(
    `Hello Lingaswamy! I am visiting the ${content.company.name} website and would like to ask a quick question.`
  );

  return (
    <div className="floating-whatsapp-container" role="complementary" aria-label="WhatsApp Contact">
      <div className="floating-whatsapp-tooltip" aria-hidden="true">
        Chat with Lingaswamy
      </div>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp-btn animate-whatsapp-pulse"
        aria-label="Direct WhatsApp chat with founder Lingaswamy at 9542439498"
      >
        <MessageCircle size={30} fill="currentColor" strokeWidth={1.5} />
      </a>
    </div>
  );
}
