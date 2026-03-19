'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute, useAuth, User } from '@/providers/auth-provider';
import { LayoutDashboard, ShieldCheck, ShieldAlert, Activity, Users as UsersIcon, Settings, Trash2, UserPlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [isCreating, setIsCreating] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/users', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('Could not load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (res.ok) {
        setUsers([...users, data]);
        setUsername('');
        setPassword('');
        setRole('USER');
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  const navigations = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Score Factor", href: "/score-factor", icon: ShieldCheck },
    { title: "Issues portfolio", href: "/issues", icon: ShieldAlert },
    { title: "Digital Footprint", href: "/digital-footprint", icon: Activity },
    { title: "User Management", href: "/admin/users", icon: UsersIcon, isActive: true },
    { title: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar navigations={navigations} />

        <main className="flex-1 overflow-y-auto p-8 bg-muted/10">
          <div className="mx-auto max-w-5xl space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage administrator and normal user accounts.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Add User Form */}
              <div className="md:col-span-1 border rounded-xl bg-card p-6 shadow-sm h-fit">
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  Add New User
                </h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
                    <input
                      id="username"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value)}
                      className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isCreating} 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full mt-4 bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isCreating ? 'Creating...' : 'Create Account'}
                  </button>
                </form>
              </div>

              {/* Users List */}
              <div className="md:col-span-2 border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b bg-muted/20">
                  <h2 className="text-xl font-semibold">Active Users</h2>
                </div>
                
                <div className="p-0 overflow-x-auto">
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse">Loading users...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Username</TableHead>
                          <TableHead className="font-semibold">Role</TableHead>
                          <TableHead className="font-semibold px-4 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium text-foreground">
                              {user.username}
                              {currentUser?.id === user.id && (
                                <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                  You
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 flex w-fit items-center text-xs font-semibold rounded-md ${
                                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {user.role === 'ADMIN' ? (
                                  <>
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                    Admin
                                  </>
                                ) : (
                                  <>
                                    <UsersIcon className="w-3 h-3 mr-1" />
                                    User
                                  </>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={currentUser?.id === user.id}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {users.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                              No users found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
