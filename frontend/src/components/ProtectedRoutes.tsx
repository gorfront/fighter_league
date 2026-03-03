import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const ProtectedRoutes = () => {
  const { token, isAuthLoading, logout } = useAuthStore();
  const [showTimeoutError, setShowTimeoutError] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isAuthLoading) {
      timeoutId = setTimeout(() => {
        setShowTimeoutError(true);
      }, 5000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthLoading]);

  if (isAuthLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Verifying session...</p>
        {showTimeoutError && (
          <div className="flex flex-col items-center gap-2 mt-4 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm text-red-500 max-w-xs text-center">
              Verification is taking longer than expected. Please check your connection or try logging in again.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
            >
              Return to Login
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;
