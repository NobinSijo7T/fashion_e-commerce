import { useEffect } from "react";
import { useRouter } from "next/router";

import { useAdminAuth } from "./useAdminAuth";

/** Redirect to /admin/login if not authenticated or not admin. Skip on login page. */
export function useRequireAdmin() {
  const router = useRouter();
  const { loading, session, isAdmin } = useAdminAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      void router.replace("/admin/login");
      return;
    }
    if (!isAdmin) {
      void router.replace("/admin/login?error=forbidden");
    }
  }, [loading, session, isAdmin, router]);

  return { loading, ready: !loading && !!session && isAdmin };
}
