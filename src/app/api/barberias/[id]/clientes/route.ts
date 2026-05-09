import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getFirestore();
    
    const clientesSnap = await db
      .collection('usuarios')
      .where('barberia_id', '==', id)
      .where('role', '==', 'usuario')
      .get();

    const clientes = clientesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ clientes });
  } catch (error: any) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
