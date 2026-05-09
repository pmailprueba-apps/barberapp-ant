const fetch = require('node-fetch');

async function testCitasApi() {
  const barberiaId = 'barberia_prueba_01';
  // Test without date (this triggers orderBy in server)
  const url = `http://localhost:3000/api/barberias/${barberiaId}/citas`;
  console.log(`\nTesting URL (No date): ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    if (!res.ok) {
      console.log('Error Data:', JSON.stringify(data, null, 2));
    } else {
      console.log(`Success! Found ${data.length} appointments.`);
    }
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}

testCitasApi();
