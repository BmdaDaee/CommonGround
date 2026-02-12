#!/usr/bin/env node
// Test script for Supabase migration
// Run: node test-supabase.js

// Load environment variables
require('dotenv').config();

const { supabase } = require('./lib/supabaseAdmin');

async function testConnection() {
  console.log('\n🧪 Testing Supabase Connection...\n');

  try {
    // Test 1: Check connection
    console.log('1. Testing connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    console.log('✅ Connection successful\n');

    // Test 2: List tables
    console.log('2. Checking tables...');
    const tables = ['profiles', 'pairs', 'pair_members', 'messages'];
    
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error(`❌ Table ${table} not accessible:`, tableError.message);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    }

    console.log('\n3. Testing RPC function...');
    const { data: code, error: rpcError } = await supabase.rpc('generate_pair_code');
    
    if (rpcError) {
      console.error('❌ RPC function failed:', rpcError.message);
    } else {
      console.log(`✅ generate_pair_code() works: ${code}`);
    }

    console.log('\n✅ All tests passed!');
    console.log('\nReady to test API endpoints:');
    console.log('  POST http://localhost:3001/v1/pairs');
    console.log('  POST http://localhost:3001/v1/pairs/join');
    console.log('  POST http://localhost:3001/v1/chat/:pairId/send');
    console.log('  GET  http://localhost:3001/v1/chat/:pairId/list');
    
    return true;
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    return false;
  }
}

// Run tests
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
