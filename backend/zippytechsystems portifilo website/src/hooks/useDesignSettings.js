import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

    // Setup Supabase Realtime subscription for instant live updates
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime_design_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'design_settings' },
        (payload) => {
          if (payload?.new) {
            setDesignSettings((prev) => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
