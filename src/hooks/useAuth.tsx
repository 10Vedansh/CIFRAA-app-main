import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  risk_tolerance: string | null;
  investment_horizon: string | null;
  investment_goal: string | null;
  experience_level: string | null;
  investment_amount: string | null;
  onboarding_completed: boolean;
  pin_set: boolean;
  occupation: string | null;
  income_stability: string | null;
  monthly_emis: number | null;
  dependents: number | null;
  has_insurance: boolean | null;
  existing_investments: string | null;
  risk_capacity_score: number | null;
  phone_number: string | null;
  // Questionnaire fields
  investor_stage: string | null;
  primary_goal: string | null;
  market_reaction: string | null;
  existing_investments_range: string | null;
  emergency_fund: string | null;
  investor_profile: string | null;
  total_score: number | null;
}

interface AuthContextType {
  user: { id: string; email?: string } | null;
  session: unknown;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_KEY = 'cifraa_user_profile';
const AUTH_KEY = 'cifraa_auth';

function loadProfile(): { user: { id: string; email?: string } | null; profile: UserProfile | null } {
  try {
    const authData = localStorage.getItem(AUTH_KEY);
    const profileData = localStorage.getItem(PROFILE_KEY);
    return {
      user: authData ? JSON.parse(authData) : null,
      profile: profileData ? JSON.parse(profileData) : null,
    };
  } catch {
    return { user: null, profile: null };
  }
}

function defaultProfile(userId: string): UserProfile {
  return {
    id: userId,
    user_id: userId,
    email: null,
    full_name: null,
    avatar_url: null,
    risk_tolerance: null,
    investment_horizon: null,
    investment_goal: null,
    experience_level: null,
    investment_amount: null,
    onboarding_completed: false,
    pin_set: false,
    occupation: null,
    income_stability: null,
    monthly_emis: null,
    dependents: null,
    has_insurance: null,
    existing_investments: null,
    risk_capacity_score: null,
    phone_number: null,
    investor_stage: null,
    primary_goal: null,
    market_reaction: null,
    existing_investments_range: null,
    emergency_fund: null,
    investor_profile: null,
    total_score: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { user: u, profile: p } = loadProfile();
    setUser(u);
    setProfile(p);
    setIsLoading(false);
  }, []);

  const saveAuth = (u: { id: string; email?: string } | null, p: UserProfile | null) => {
    if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    else localStorage.removeItem(AUTH_KEY);
    if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_KEY);
    setUser(u);
    setProfile(p);
  };

  const signInWithGoogle = async () => {
    const userId = 'user_' + Date.now();
    const p = defaultProfile(userId);
    p.full_name = 'Demo User';
    p.email = 'demo@example.com';
    saveAuth({ id: userId, email: 'demo@example.com' }, p);
    return { error: null };
  };

  const signInWithEmail = async (email: string, _password: string) => {
    const userId = 'user_' + Date.now();
    const p = defaultProfile(userId);
    p.email = email;
    p.full_name = email.split('@')[0];
    saveAuth({ id: userId, email }, p);
    return { error: null };
  };

  const signUpWithEmail = async (email: string, _password: string, fullName: string) => {
    const userId = 'user_' + Date.now();
    const p = defaultProfile(userId);
    p.email = email;
    p.full_name = fullName;
    saveAuth({ id: userId, email }, p);
    return { error: null };
  };

  const resetPassword = async () => ({ error: null });
  const updatePassword = async () => ({ error: null });

  const signOut = async () => {
    saveAuth(null, null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    const current = profile || defaultProfile(user.id);
    const merged = { ...current, ...updates };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
    setProfile(merged);
    return { error: null };
  };

  const refreshProfile = async () => {
    const { profile: p } = loadProfile();
    if (p) setProfile(p);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        updatePassword,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
