'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  parseJwt,
  getToken as getStoredToken,
} from '@/lib/auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

interface User {
  id: string;
  email: string;
  role:
    | 'CLIENT'
    | 'CONTRACTOR'
    | 'INSPECTION_TEAM'
    | 'INSPECTOR'
    | 'ADMIN';
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const router = useRouter();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = getStoredToken();

        if (!savedToken) {
          setLoading(false);
          return;
        }

        const payload = parseJwt(savedToken);

        if (!payload) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          return;
        }

        const role = payload.role;

        let profileRes: Response | null = null;

        if (
          role === 'INSPECTION_TEAM' ||
          role === 'INSPECTOR'
        ) {
          profileRes = await fetch(
            `${API_BASE}/inspection/profile`,
            {
              headers: {
                Authorization: `Bearer ${savedToken}`,
              },
            }
          );

          if (!profileRes.ok) {
            profileRes = await fetch(
              `${API_BASE}/inspection/dashboard`,
              {
                headers: {
                  Authorization: `Bearer ${savedToken}`,
                },
              }
            );
          }
        } else {
          profileRes = await fetch(
            `${API_BASE}/auth/profile`,
            {
              headers: {
                Authorization: `Bearer ${savedToken}`,
              },
            }
          );
        }

        if (profileRes && profileRes.ok) {
          const profileJson =
            await profileRes.json();

          const builtUser: User = {
            id:
              payload.id ||
              profileJson.id ||
              payload.userId,
            email:
              profileJson.email ||
              payload.email,
            role,
            profile: profileJson,
          };

          setToken(savedToken);
          setUser(builtUser);

          localStorage.setItem(
            'user',
            JSON.stringify(builtUser)
          );
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.warn(
          'Auth restore failed',
          error
        );

        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (
    newToken: string
  ) => {
    console.log("LOGIN FUNCTION CALLED");
    localStorage.setItem(
      'token',
      newToken
    );
    console.log("TOKEN SAVED:", localStorage.getItem("token"));

    setToken(newToken);

    const payload =
      parseJwt(newToken);

    console.log(
      'TOKEN:',
      newToken
    );

    console.log(
      'PAYLOAD:',
      payload
    );

    console.log(
      'ROLE:',
      payload?.role
    );

    if (!payload) {
      logout();
      return;
    }

    try {
      const role = payload.role;

      let profileRes: Response | null =
        null;

      // Inspection Team / Inspector
      if (
        role === 'INSPECTION_TEAM' ||
        role === 'INSPECTOR'
      ) {
        profileRes = await fetch(
          `${API_BASE}/inspection/profile`,
          {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          }
        );

        if (!profileRes.ok) {
          profileRes = await fetch(
            `${API_BASE}/inspection/dashboard`,
            {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            }
          );
        }
      }

      // Contractor
      else if (
        role === 'CONTRACTOR'
      ) {
        profileRes = await fetch(
          `${API_BASE}/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          }
        );
      }

      // Client
      else if (
        role === 'CLIENT'
      ) {
        profileRes = await fetch(
          `${API_BASE}/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          }
        );
      }

      // Admin
      else if (
        role === 'ADMIN'
      ) {
        profileRes = await fetch(
          `${API_BASE}/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          }
        );
      }

      if (!profileRes) {
        throw new Error(
          `Unsupported role: ${role}`
        );
      }

      if (!profileRes.ok) {
        console.log(
          'STATUS:',
          profileRes.status
        );

        const text =
          await profileRes.text();

        console.log(
          'BODY:',
          text
        );

        throw new Error(
          'Failed to fetch profile'
        );
      }

      const profileJson =
        await profileRes.json();

      const builtUser: User = {
        id:
          payload.id ||
          profileJson.id ||
          payload.userId,

        email:
          profileJson.email ||
          payload.email,

        role,

        profile: profileJson,
      };

      setUser(builtUser);

      localStorage.setItem(
        'user',
        JSON.stringify(builtUser)
      );

      // Redirect
      if (
        builtUser.role === 'CLIENT'
      ) {
        router.push(
          '/client/dashboard'
        );
      } else if (
        builtUser.role ===
        'CONTRACTOR'
      ) {
        router.push(
          '/contractor/dashboard'
        );
      } else if (
        builtUser.role ===
          'INSPECTION_TEAM' ||
        builtUser.role ===
          'INSPECTOR'
      ) {
        router.push(
          '/inspection/dashboard'
        );
      } else if (
        builtUser.role ===
        'ADMIN'
      ) {
        router.push(
          '/admin/dashboard'
        );
      }
    } catch (error) {
      console.error(
        'Login failed:',
        error
      );

      logout();
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    console.log("LOGOUT CALLED");

    localStorage.removeItem(
      'token'
    );

    localStorage.removeItem(
      'user'
    );

    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}