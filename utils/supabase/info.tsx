const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!publicAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

let projectId = '';

try {
  projectId = new URL(supabaseUrl).hostname.split('.')[0] || '';
} catch {
  throw new Error('Invalid VITE_SUPABASE_URL environment variable');
}

if (!projectId) {
  throw new Error('Could not derive projectId from VITE_SUPABASE_URL');
}

export { projectId, publicAnonKey };