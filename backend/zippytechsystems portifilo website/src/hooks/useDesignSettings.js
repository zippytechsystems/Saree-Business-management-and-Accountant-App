import { useState, useEffect, useCallback } from 'react';
import { getDesignSettingsApi, updateDesignSettingsApi, DEFAULT_DESIGN_SETTINGS } from '../lib/api';

export function useDesignSettings() {
  const [designSettings, setDesignSettings] = useState(DEFAULT_DESIGN_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getDesignSettingsApi();
      setDesignSettings(data);
    } catch (e) {
      console.warn('useDesignSettings fetch error:', e);
      setDesignSettings(DEFAULT_DESIGN_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates) => {
    const res = await updateDesignSettingsApi(updates);
    if (res.success && res.data) {
      setDesignSettings(res.data);
    }
    return res;
  };

  return {
    designSettings,
    loading,
    updateSettings,
    refreshSettings: fetchSettings
  };
}

export default useDesignSettings;
