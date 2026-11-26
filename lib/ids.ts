import { createClient } from '@supabase/supabase-js'
import catalog from './catalog.json'

export type Entry = (typeof catalog)[number]

export async function getEntries(): Promise<Entry[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url && !key) return catalog
  if (!url || !key) throw new Error('Set both Supabase environment variables.')
  const { data, error } = await createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).from('id_guides').select('slug,name,agency,category,summary,bring,apply,source').eq('published', true).order('position')
  if (error) throw new Error('Could not load the ID directory.', { cause: error })
  return data
}
