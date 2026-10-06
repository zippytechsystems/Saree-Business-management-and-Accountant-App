import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getClientsApi } from '../lib/api';

export function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      const data = await getClientsApi();
      setClients(data);
    } catch (e) {
      console.warn('useClients fetch error:', e);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();

    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime_clients')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => fetchClients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchClients]);

  return { clients, loading, refreshClients: fetchClients };
}

export default useClients;
