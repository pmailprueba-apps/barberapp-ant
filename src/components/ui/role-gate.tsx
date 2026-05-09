"use client";

import { useAuth } from "@/hooks/useAuth";
import { Role, hasRole } from "@/types/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGateProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirect?: boolean;
}

export function RoleGate({ allowedRoles, children, fallback, redirect = true }: RoleGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const redirectMap: Record<Role, string> = {
    superadmin: "/superadmin",
    admin: "/admin",
    barbero: "/barbero",
    cliente: "/usuario",
    usuario: "/usuario",
  };

  const userRole: Role = user?.role || "cliente";
  const userClaims = { role: userRole, barberia_id: user?.barberia_id };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && !hasRole(userClaims, ...allowedRoles)) {
      if (redirect) {
        router.push(redirectMap[userRole]);
      }
    }
  }, [user, loading, allowedRoles, redirect, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !hasRole(userClaims, ...allowedRoles)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
