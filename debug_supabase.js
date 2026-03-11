import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

console.log('--- Supabase Connection Test ---')
console.log('URL:', url)
console.log('Key (partial):', key ? key.substring(0, 20) + '...' : 'MISSING')

if (!url || !url.includes('supabase.co')) {
    console.error('ERROR: Invalid Supabase URL in .env.local')
    process.exit(1)
}

if (!key || !key.startsWith('eyJ')) {
    console.error('ERROR: Invalid Supabase Anon Key. It should start with "eyJ".')
    console.error('It currently looks like a Stripe key (starts with "sb_").')
    process.exit(1)
}

const supabase = createClient(url, key)

async function test() {
    console.log('Testing connection to "campaigns" table...')
    const { data, error } = await supabase.from('campaigns').select('count', { count: 'exact', head: true })

    if (error) {
        console.error('CONNECTION FAILED:', error.message)
    } else {
        console.log('SUCCESS: Successfully connected to Supabase!')
        console.log('Total campaigns in DB:', data?.length || 0)
    }
}

test()
