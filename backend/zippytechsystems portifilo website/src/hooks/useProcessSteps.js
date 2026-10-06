import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getProcessStepsApi } from '../lib/api';

export function useProcessSteps() {
  const [processSteps, setProcessSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSteps = useCallback(async () => {
    try {
      const data = await getProcessStepsApi();
      setProcessSteps(data);
    } catch (e) {
      console.warn('useProcessSteps fetch error:', e);
      setProcessSteps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSteps();

    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime_process_steps')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'process_steps' },
        () => fetchSteps()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSteps]);

  return { processSteps, loading, refreshSteps: fetchSteps };
}

export default useProcessSteps;
