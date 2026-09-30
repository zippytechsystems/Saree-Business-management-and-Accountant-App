import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ type = 'success', message, onClose }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`alert-toast ${isSuccess ? 'alert-success' : 'alert-error'}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
