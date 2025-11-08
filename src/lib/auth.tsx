import React, { createContext, useContext, useState, useEffect } from 'react';

// Simple authentication for a couple (2 users)
// In production, replace with proper backend authentication

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'partner1' | 'partner2';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  partner: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  viewMode: 'individual' | 'joint';
  setViewMode: (mode: 'individual' | 'joint') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded users for demo (replace with backend in production)
const USERS: Record<string, { password: string; user: User }> = {
  'partner1@couple.fin': {
    password: 'demo123', // Change this!
    user: {
      id: 'user1',
      name: 'Partner 1',
      email: 'partner1@couple.fin',
      role: 'partner1',
    },
  },
  'partner2@couple.fin': {
    password: 'demo123', // Change this!
    user: {
      id: 'user2',
      name: 'Partner 2',
      email: 'partner2@couple.fin',
      role: 'partner2',
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'individual' | 'joint'>('joint');

  // Check for stored session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedViewMode = localStorage.getItem('viewMode');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    if (storedViewMode) {
      setViewMode(storedViewMode as 'individual' | 'joint');
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userRecord = USERS[email];
    
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      localStorage.setItem('currentUser', JSON.stringify(userRecord.user));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('viewMode');
  };

  const handleSetViewMode = (mode: 'individual' | 'joint') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

  // Get partner user
  const partner = user
    ? Object.values(USERS)
        .map(record => record.user)
        .find(u => u.id !== user.id) || null
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        isAuthenticated: !!user,
        login,
        logout,
        viewMode,
        setViewMode: handleSetViewMode,
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

// Hook to check if current user has permission
export function usePermission() {
  const { user, viewMode } = useAuth();

  return {
    canEdit: (itemOwnerId?: string) => {
      if (viewMode === 'joint') return true;
      if (!itemOwnerId) return true;
      return user?.id === itemOwnerId;
    },
    canView: (itemOwnerId?: string) => {
      if (viewMode === 'joint') return true;
      if (!itemOwnerId) return true;
      return user?.id === itemOwnerId;
    },
    canDelete: (itemOwnerId?: string) => {
      if (!itemOwnerId) return true;
      return user?.id === itemOwnerId;
    },
  };
}

// Component to protect routes
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

// Login Page Component
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);

    if (!success) {
      setError('Invalid email or password');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Couple Finance</h1>
          <p className="text-gray-600">Secure financial management for two</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center mb-2">Demo Credentials:</p>
          <p className="text-xs text-gray-700 text-center">
            <strong>Partner 1:</strong> partner1@couple.fin / demo123
          </p>
          <p className="text-xs text-gray-700 text-center">
            <strong>Partner 2:</strong> partner2@couple.fin / demo123
          </p>
        </div>
      </div>
    </div>
  );
}
