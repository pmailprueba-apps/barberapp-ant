import { getAdminDb } from "./src/lib/firebase-admin";

async function testMetricas() {
  const db = getAdminDb();
  const barberiaId = "barberia_prueba_01";
  
  console.log(`Consultando métricas para: ${barberiaId}`);
  
  try {
    const query = db.collection("barberias").doc(barberiaId).collection("citas")
      .where("estado", "in", ["completada", "confirmada"]);
    
    const snapshot = await query.get();
    console.log(`Total citas encontradas: ${snapshot.size}`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- Cita ${doc.id}: ${data.fecha} ${data.hora}, estado: ${data.estado}, precio: ${data.precio}`);
    });
    
    const totalVentas = snapshot.docs.reduce((acc, doc) => acc + Number(doc.data().precio || 0), 0);
    console.log(`Total ventas: ${totalVentas}`);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testMetricas();
