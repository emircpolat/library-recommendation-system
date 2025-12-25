import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

// Interface definition including verifyCode and resendCode
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      await fetchAuthSession();
      const currentUser = await getCurrentUser();
      
      setUser({
        id: currentUser.userId,
        email: currentUser.username,
        name: currentUser.username, 
        role: 'user',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.log('User not signed in');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        await checkUser(); 
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email, name },
        },
      });
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  // Verification Logic
  const verifyCode = async (email: string, code: string) => {
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code
      });
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };

  // Resend Code Logic
  const resendCode = async (email: string) => {
    try {
      await resendSignUpCode({ username: email });
    } catch (error) {
      console.error('Resend code failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    // Providing verifyCode and resendCode to the context
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, verifyCode, resendCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
