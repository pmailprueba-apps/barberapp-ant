"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  updateProfile,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Role } from "@/types/roles";

interface AuthUser extends User {
  role?: Role;
  barberia_id?: string;
  barberia_nombre?: string;
  barbero_id?: string;
  nombre?: string;
  telefono?: string;
  foto_url?: string;
  puntos?: number;
  activo?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithPhone: (phone: string, captchaVerifier: unknown) => Promise<ConfirmationResult>;
  verifyPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const token = idTokenResult.token;
        
        // Set cookie for middleware
        document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`;

        // Guardar claims en el objeto de usuario de forma que mantenga los métodos (como getIdToken)
        const extendedUser = firebaseUser as AuthUser;
        const claims = idTokenResult.claims;
        extendedUser.role = (claims.role as Role) || "cliente";
        extendedUser.barberia_id = (claims.barberia_id as string);
        extendedUser.barbero_id = (claims.barbero_id as string) || (claims.role === "barbero" ? firebaseUser.uid : undefined);
        extendedUser.nombre = (claims.nombre as string) || firebaseUser.displayName || "";
        extendedUser.puntos = (claims.puntos as number) || 0;
        extendedUser.activo = (claims.activo as boolean) ?? true;

        // Fetch barberia name if it exists in claims but we want to be sure
        if (extendedUser.barberia_id && !extendedUser.barberia_nombre) {
          try {
            const { doc, getDoc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            const bDoc = await getDoc(doc(db, "barberias", extendedUser.barberia_id));
            if (bDoc.exists()) {
              extendedUser.barberia_nombre = bDoc.data().nombre;
            }
          } catch (e) {
            console.error("Error fetching barberia name:", e);
          }
        }

        // Fallback: Si no tiene barberia_id o role en claims, intentar buscar en Firestore
        if (!extendedUser.barberia_id || !extendedUser.role) {
          try {
            const { doc, getDoc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            const userDoc = await getDoc(doc(db, "usuarios", firebaseUser.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              if (data.barberia_id) {
                extendedUser.barberia_id = data.barberia_id;
                
                // Fetch barberia name
                const barberiaDoc = await getDoc(doc(db, "barberias", data.barberia_id));
                if (barberiaDoc.exists()) {
                  extendedUser.barberia_nombre = barberiaDoc.data().nombre;
                }
              }
              if (data.barbero_id) {
                extendedUser.barbero_id = data.barbero_id;
              } else if (data.role === "barbero") {
                extendedUser.barbero_id = firebaseUser.uid;
              }
              
              if (!extendedUser.role && data.role) {
                extendedUser.role = data.role as Role;
              }
              if (data.nombre) {
                extendedUser.nombre = data.nombre;
              }
            }
          } catch (e) {
            console.error("Error fetching user fallback data:", e);
          }
        }

        setUser(extendedUser);
      } else {
        // Remove cookie
        document.cookie = "firebase-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const idTokenResult = await result.user.getIdTokenResult();
    const extendedUser = result.user as AuthUser;
    extendedUser.role = idTokenResult.claims.role as Role;
    extendedUser.barberia_id = idTokenResult.claims.barberia_id as string;
    extendedUser.barbero_id = idTokenResult.claims.barbero_id as string;
    extendedUser.activo = idTokenResult.claims.activo as boolean;
    setUser(extendedUser);
  };

  const register = async (email: string, password: string, nombre: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: nombre });
    const extendedUser = result.user as AuthUser;
    extendedUser.nombre = nombre;
    setUser(extendedUser);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idTokenResult = await result.user.getIdTokenResult();
    const extendedUser = result.user as AuthUser;
    extendedUser.role = idTokenResult.claims.role as Role;
    extendedUser.barberia_id = idTokenResult.claims.barberia_id as string;
    extendedUser.barbero_id = idTokenResult.claims.barbero_id as string;
    extendedUser.activo = idTokenResult.claims.activo as boolean;
    setUser(extendedUser);
  };

  const loginWithPhone = async (phone: string, captchaVerifier: unknown) => {
    return signInWithPhoneNumber(auth, phone, captchaVerifier as Parameters<typeof signInWithPhoneNumber>[2]);
  };

  const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string) => {
    const result = await confirmationResult.confirm(code);
    setUser(result.user as AuthUser);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const refreshUserClaims = async () => {
    if (auth.currentUser) {
      const idTokenResult = await auth.currentUser.getIdTokenResult(true);
      const extendedUser = auth.currentUser as AuthUser;
      extendedUser.role = idTokenResult.claims.role as Role;
      extendedUser.barberia_id = idTokenResult.claims.barberia_id as string;
      extendedUser.barbero_id = idTokenResult.claims.barbero_id as string;
      extendedUser.activo = idTokenResult.claims.activo as boolean;
      setUser(extendedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithPhone,
        verifyPhoneCode,
        logout,
        refreshUserClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
