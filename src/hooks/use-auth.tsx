import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if user is authenticated by calling the /.auth/me endpoint
      const response = await fetch('/.auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.clientPrincipal) {
          setUser({
            identityProvider: data.clientPrincipal.identityProvider,
            userId: data.clientPrincipal.userId,
            userDetails: data.clientPrincipal.userDetails,
            userRoles: data.clientPrincipal.userRoles || [],
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/.auth/login/aad';
  };

  const logout = () => {
    window.location.href = '/.auth/logout';
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.userRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
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

