import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking columns for 'brands' table...");
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching brands:", error.message);
        if (error.message.includes("column") && error.message.includes("does not exist")) {
            console.log("SUGGESTION: A column is missing. Check if 'layout_pattern' or 'tagline' exists.");
        }
    } else {
        console.log("Successfully connected. columns available in first row keys:", data.length > 0 ? Object.keys(data[0]) : "No data yet");
    }
}

checkColumns();
