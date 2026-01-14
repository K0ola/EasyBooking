// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing Supabase connection...\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY length:', supabaseKey ? supabaseKey.length : 'undefined');
console.log('SUPABASE_ANON_KEY first 20 chars:', supabaseKey ? supabaseKey.substring(0, 20) : 'undefined');
console.log('SUPABASE_ANON_KEY last 10 chars:', supabaseKey ? supabaseKey.substring(supabaseKey.length - 10) : 'undefined');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ERROR: Missing Supabase environment variables');
  process.exit(1);
}

console.log('\n✅ Environment variables are set');

try {
  console.log('\nCreating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created');

  // Test a simple query
  console.log('\nTesting connection with a simple query...');
  supabase
    .from('rooms')
    .select('count')
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Query failed:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Successfully connected to Supabase!');
        console.log('Number of rooms:', data ? data.length : 0);
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('❌ Connection error:', err.message);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message);
  process.exit(1);
}

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n❌ Connection timeout - Supabase did not respond in 10 seconds');
  console.log('\nThis usually means:');
  console.log('1. The Supabase key is invalid or incomplete');
  console.log('2. The Supabase project is not accessible');
  console.log('3. Network issues preventing connection');
  process.exit(1);
}, 10000);
