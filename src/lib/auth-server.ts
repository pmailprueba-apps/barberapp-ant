import { getAdminAuth } from "./firebase-admin";
import { NextRequest } from "next/server";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role?: string;
  barberia_id?: string;
  barbero_id?: string;
}

/**
 * Verifica el token de autorización en los headers de una solicitud.
 * Retorna los datos del usuario si es válido, o lanza un error.
 */
export async function verifyAuth(request: Request | NextRequest): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No se proporcionó un token de autorización válido");
  }

  const token = authHeader.split("Bearer ")[1];
  
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role as string,
      barberia_id: decodedToken.barberia_id as string,
      barbero_id: decodedToken.barbero_id as string,
    };
  } catch (error) {
    console.error("Error al verificar token:", error);
    throw new Error("Token de autorización inválido o expirado");
  }
}

/**
 * Verifica si el usuario tiene un rol específico.
 */
export async function authorizeRole(request: Request | NextRequest, allowedRoles: string[]) {
  const user = await verifyAuth(request);
  
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new Error("No tienes permisos para realizar esta acción");
  }
  
  return user;
}
