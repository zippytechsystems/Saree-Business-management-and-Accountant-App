import { useState, useEffect, useCallback } from 'react';
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
  }, [fetchSteps]);

  return { processSteps, loading, refreshSteps: fetchSteps };
}

export default useProcessSteps;
