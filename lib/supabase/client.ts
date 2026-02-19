import { createBrowserClient } from '@supabase/ssr';
import { createMockClient } from './mock';

export function createClient(): any {
  if (process.env.DEMO_MODE === 'true') {
    return createMockClient();
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
