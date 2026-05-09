
import { getAdminDb } from "./src/lib/firebase-admin.js";
import { config } from "dotenv";
import path from "path";

// Load .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

async function test() {
  try {
    console.log("Environment variables:");
    console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
    console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
    console.log("FIREBASE_PRIVATE_KEY exists:", !!process.env.FIREBASE_PRIVATE_KEY);
    
    const db = getAdminDb();
    console.log("Firebase Admin initialized successfully");
    
    const collections = await db.listCollections();
    console.log("Collections found:", collections.length);
    for (const coll of collections) {
      console.log(" -", coll.id);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
