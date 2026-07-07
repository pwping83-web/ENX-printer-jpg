const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

let projectId = '';

if (supabaseUrl) {
  try {
    projectId = new URL(supabaseUrl).hostname.split('.')[0] || '';
  } catch {
    console.error('Invalid VITE_SUPABASE_URL:', supabaseUrl);
  }
}

if (!supabaseUrl || !publicAnonKey || !projectId) {
  console.warn(
    'Supabase env vars are missing or invalid. Phone API will use local storage fallback.',
    { hasUrl: !!supabaseUrl, hasKey: !!publicAnonKey, projectId },
  );
}

export { projectId, publicAnonKey };
