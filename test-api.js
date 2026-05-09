const fetch = require('node-fetch');

async function testApi() {
  const ids = ['barberia_prueba_01', 'gZNJJmwp57L7ZLOhRqlG'];
  
  for (const barberiaId of ids) {
    console.log(`\n========================================`);
    console.log(`TESTING BARBERIA: ${barberiaId}`);
    console.log(`========================================`);

    console.log(`Testing Stats API...`);
    const resStats = await fetch(`http://localhost:3000/api/barberias/${barberiaId}/stats`);
    const dataStats = await resStats.json();
    console.log('Stats:', JSON.stringify(dataStats, null, 2));

    console.log(`\nTesting Metricas API (All)...`);
    const resMetricas = await fetch(`http://localhost:3000/api/barberias/${barberiaId}/metricas`);
    const dataMetricas = await resMetricas.json();
    console.log('Metricas All:', JSON.stringify(dataMetricas, null, 2));
  }
}

testApi();
