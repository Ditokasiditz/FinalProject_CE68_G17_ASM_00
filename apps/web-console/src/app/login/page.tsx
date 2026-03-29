'use client';

import { useState } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { API_BASE } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        login(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred while logging in');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#050B35] via-[#0B1247] to-[#1a237e]">
      {/* Decorative blurred orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 bg-[#0A1040]/50 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.15)] rounded-2xl overflow-hidden p-2 text-white">
        <CardHeader className="space-y-1 items-center justify-center text-center pb-6 pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="App Logo" className="w-20 h-20 object-contain mb-1 drop-shadow-lg" />
          <CardTitle className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</CardTitle>
          <CardDescription className="text-blue-200/60 font-medium">Enter your credentials to access the console</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6 pb-6">
            {error && (
              <div className="p-3 text-sm text-red-100 bg-red-900/40 border border-red-500/30 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none text-white/90">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                placeholder="admin"
                required
                disabled={isLoading}
                className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium leading-none text-white/90">Password</label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
          <CardFooter className="px-6 pb-6 pt-2">
            <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] h-12 px-4 py-2 w-full" 
                type="submit" 
                disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in to Dashboard'}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
