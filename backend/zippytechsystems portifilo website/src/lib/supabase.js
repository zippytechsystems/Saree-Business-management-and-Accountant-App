import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cdrwrbmabcyhxngvyrxh.supabase.co';
// Use environment variable, with user-provided key
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_G1oB1splS3Wb92LbNZ90pA_NAxOUXpC';
const legacyAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcndyYm1hYmN5aHhuZ3Z5cnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzQ4ODQsImV4cCI6MjEwNjUxMDg4NH0.Z35CemddNDASSu3gbOHXeOGLFskj06ZW8Q__ujBZ4fc';

let client = null;

try {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
} catch (e) {
  console.warn('Publishable key initialization failed, falling back to legacy JWT anon key:', e);
  try {
    client = createClient(supabaseUrl, legacyAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export const supabase = client;

export const isSupabaseConfigured = Boolean(
  supabase &&
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co'
);
