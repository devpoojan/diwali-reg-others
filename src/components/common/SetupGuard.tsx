import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isSetupCompleted } from '@/services/eventSettingsService';

interface SetupGuardProps {
  children: React.ReactNode;
}

/**
 * SetupGuard automatically checks if the event setup wizard has been completed.
 * If not completed, it routes the user directly to /setup.
 */
export const SetupGuard: React.FC<SetupGuardProps> = ({ children }) => {
  const [checking, setChecking] = useState<boolean>(true);
  const [completed, setCompleted] = useState<boolean>(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      // Don't guard setup or login routes
      if (
        location.pathname === '/setup' || 
        location.pathname === '/admin/setup-wizard' || 
        location.pathname === '/login'
      ) {
        if (mounted) setChecking(false);
        return;
      }

      try {
        const isDone = await isSetupCompleted();
        if (mounted) {
          setCompleted(isDone);
          setChecking(false);
        }
      } catch {
        if (mounted) {
          setCompleted(true); // Don't block on network error
          setChecking(false);
        }
      }
    };

    check();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (checking) {
    return null; // Silent load
  }

  if (!completed && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
};
