import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PinEntry } from '@/components/auth/PinEntry';

const PIN_SESSION_KEY = 'cifraa_pin_verified';
const PIN_SKIPPED_KEY = 'cifraa_pin_skipped';

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [pinVerified, setPinVerified] = useState(() => {
    return sessionStorage.getItem(PIN_SESSION_KEY) === 'true';
  });
  const [showPinCreate, setShowPinCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !profile) return;
    console.log('[PinGate] Profile loaded:', { pin_set: profile.pin_set, onboarding_completed: profile.onboarding_completed });
    if (profile.pin_set && !sessionStorage.getItem(PIN_SESSION_KEY)) {
      console.log('[PinGate] PIN set, needs verification');
      setPinVerified(false);
    } else if (!profile.pin_set) {
      console.log('[PinGate] PIN not set, auto-verifying');
      setPinVerified(true);
    }
  }, [user, profile]);

  useEffect(() => {
    if (profile && profile.onboarding_completed && !profile.pin_set && user) {
      const skipped = localStorage.getItem(PIN_SKIPPED_KEY) === 'true';
      console.log('[PinGate] Checking PIN create screen:', { onboarding_completed: profile.onboarding_completed, pin_set: profile.pin_set, skipped });
      if (!skipped) {
        console.log('[PinGate] Showing PIN create screen');
        setShowPinCreate(true);
      } else {
        console.log('[PinGate] PIN was skipped, bypassing');
      }
    }
  }, [profile, user]);

  const handleVerifyPin = async (_pin: string) => {
    console.log('[PinGate] PIN verified in session');
    sessionStorage.setItem(PIN_SESSION_KEY, 'true');
    setPinVerified(true);
  };

  const handleCreatePin = async (_pin: string) => {
    setIsLoading(true);
    setError('');
    try {
      console.log('[PinGate] Saving PIN to profile');
      const { error: saveError } = await updateProfile({ pin_set: true } as any);
      if (saveError) {
        console.error('[PinGate] Failed to save PIN:', saveError);
        setError('Failed to save PIN. Please try again or skip.');
        setIsLoading(false);
        return;
      }
      await refreshProfile();
      console.log('[PinGate] PIN saved, navigating');
      setShowPinCreate(false);
      sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      setPinVerified(true);
    } catch (err) {
      console.error('[PinGate] PIN save error:', err);
      setError('Something went wrong. Please try again or skip.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipPin = () => {
    console.log('[PinGate] Skip PIN clicked');
    try {
      localStorage.setItem(PIN_SKIPPED_KEY, 'true');
      sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      setShowPinCreate(false);
      setPinVerified(true);
      console.log('[PinGate] PIN skipped, onboarding status:', profile?.onboarding_completed);
    } catch (err) {
      console.error('[PinGate] Skip save error:', err);
      sessionStorage.setItem(PIN_SESSION_KEY, 'true');
      setShowPinCreate(false);
      setPinVerified(true);
    }
  };

  if (!user || !profile) {
    console.log('[PinGate] No user or profile, showing children');
    return <>{children}</>;
  }

  if (profile.pin_set && !pinVerified) {
    console.log('[PinGate] Rendering PIN verify screen');
    return (
      <PinEntry
        mode="verify"
        onSubmit={handleVerifyPin}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  if (showPinCreate) {
    console.log('[PinGate] Rendering PIN create screen');
    return (
      <>
        {children}
        <PinEntry
          mode="create"
          onSubmit={handleCreatePin}
          onSkip={handleSkipPin}
          isLoading={isLoading}
          error={error}
        />
      </>
    );
  }

  console.log('[PinGate] All checks passed, showing children');
  return <>{children}</>;
}
