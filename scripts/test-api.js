/**
 * Simple API test script
 * Tests the lead creation endpoint
 */

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testLeadCreation() {
  console.log('🧪 Testing Lead Creation API...\n');

  const testLead = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    vehicleInterest: '2024 Toyota Camry',
    budget: '$30k-$50k',
    timeline: 'This month',
    preferredContact: 'phone',
    source: 'website',
  };

  try {
    console.log('📤 Sending test lead:', testLead);
    const response = await fetch(`${API_URL}/api/leads/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLead),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Lead created successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return data.lead.id;
    } else {
      console.log('❌ Error creating lead:');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure the dev server is running: npm run dev');
    }
    return null;
  }
}

async function testGetLead(leadId) {
  if (!leadId) return;

  console.log('\n🧪 Testing Get Lead API...\n');

  try {
    const response = await fetch(`${API_URL}/api/leads/${leadId}`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Lead retrieved successfully!');
      console.log('Lead:', JSON.stringify(data.lead, null, 2));
    } else {
      console.log('❌ Error retrieving lead:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testListLeads() {
  console.log('\n🧪 Testing List Leads API...\n');

  try {
    const response = await fetch(`${API_URL}/api/leads/list`);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ Leads retrieved successfully!');
      console.log(`Total leads: ${data.count}`);
      if (data.leads.length > 0) {
        console.log('Sample lead:', JSON.stringify(data.leads[0], null, 2));
      }
    } else {
      console.log('❌ Error retrieving leads:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests\n');
  console.log(`API URL: ${API_URL}\n`);

  const leadId = await testLeadCreation();
  await testGetLead(leadId);
  await testListLeads();

  console.log('\n✨ Tests completed!');
}

// Use native fetch if available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ fetch is not available. Please use Node.js 18+ or install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
