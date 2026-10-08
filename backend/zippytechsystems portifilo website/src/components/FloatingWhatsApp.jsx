import React from 'react';
import { MessageCircle } from 'lucide-react';
import { content } from '../data/content';
import { useData } from '../context/DataContext';

export default function FloatingWhatsApp() {
  const { settingsData } = useData() || {};
  const rawWa = settingsData?.whatsappNumber || content.founder.whatsappNumber || '6302690251';
  const cleanWa = String(rawWa).replace(/[^0-9]/g, '');
  const activeWa = cleanWa.startsWith('91') ? cleanWa : `91${cleanWa}`;

  const whatsappUrl = `https://wa.me/${activeWa}?text=${encodeURIComponent(
    `Hello Lingaswamy! I am visiting the ${content.company.name} website and would like to ask a quick question.`
  )}`;

  const activePhone = settingsData?.phone || content.founder.phone || '6302690251';

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
        aria-label={`Direct WhatsApp chat with founder Lingaswamy at ${activePhone}`}
      >
        <MessageCircle size={30} fill="currentColor" strokeWidth={1.5} />
      </a>
    </div>
  );
}
