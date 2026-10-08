import { useState, useEffect, useCallback } from 'react';
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
  }, [fetchClients]);

  return { clients, loading, refreshClients: fetchClients };
}

export default useClients;
