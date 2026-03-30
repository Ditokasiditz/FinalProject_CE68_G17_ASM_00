'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, User } from '@/providers/auth-provider';
import {
  Users as UsersIcon, Settings, Trash2, UserPlus,
  MoreVertical, ChevronDown, Plus, X, Search, AlertTriangle,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_BASE, apiFetch } from '@/lib/api';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');

  // Create user state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit user state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/users`);
      if (res.status === 401) {
        setError('Not authenticated — please log in again.');
        console.error('fetchUsers: 401 Unauthorized');
        return;
      }
      if (res.status === 403) {
        setError('Access denied — admin privileges required.');
        console.error('fetchUsers: 403 Forbidden');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }
      setUsers(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users');
      console.error('fetchUsers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    try {
      const res = await apiFetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => [...prev, data]);
        setUsername(''); setPassword(''); setRole('USER');
        setIsModalOpen(false);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);
    setError('');
    try {
      const res = await apiFetch(`${API_BASE}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUsername,
          role: editRole,
          password: editPassword.trim() !== '' ? editPassword : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? data : u));
        setIsEditModalOpen(false);
        setEditingUser(null);
        setEditPassword('');
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch {
      setError('An error occurred updating user');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
        setIsDeleteModalOpen(false);
        setDeletingUser(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete user');
        setIsDeleteModalOpen(false);
      }
    } catch {
      setError('An error occurred deleting user');
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const userCount = users.length - adminCount;

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // ── Admin guard ────────────────────────────────────────────────
  // Show the full-page Access Denied card if the user is not an admin.
  // We wait until currentUser is resolved (not null) to avoid a flash.
  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50/50 p-4 font-sans text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">
            You don&apos;t have permission to access this page.<br />
            This area is restricted to administrators only.
          </p>
          <a
            href="/dashboard"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-center"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-muted/10 text-foreground relative">
      <div className="mx-auto max-w-6xl space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <UsersIcon className="w-7 h-7 text-foreground" strokeWidth={2.5} />
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">User Management</h1>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
                <button onClick={() => setError('')} className="ml-auto text-destructive/70 hover:text-destructive"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Summary Cards + Add Button */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between mb-8">
              <div className="flex gap-4 flex-1">
                {/* Total Card */}
                <div className="flex-1 border border-border bg-card rounded-xl p-5 flex flex-col justify-between max-w-[200px]">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-extrabold text-card-foreground">Total</h2>
                    <div className="flex items-center font-bold text-lg text-card-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground mr-2"></span>
                      {users.length}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-3 leading-tight">
                    <p>All accounts</p>
                  </div>
                </div>

                {/* Admin Card */}
                <div className="flex-1 border border-border bg-card rounded-xl p-5 flex flex-col justify-between max-w-[200px]">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-extrabold text-card-foreground">Admin</h2>
                    <div className="flex items-center font-bold text-lg text-card-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                      {adminCount}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-3 leading-tight">
                    <p>Account manager</p>
                    <p>Full access</p>
                  </div>
                </div>

                {/* User Card */}
                <div className="flex-1 border border-border bg-card rounded-xl p-5 flex flex-col justify-between max-w-[200px]">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-extrabold text-card-foreground">User</h2>
                    <div className="flex items-center font-bold text-lg text-card-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                      {userCount}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-3 leading-tight">
                    <p>Standard member</p>
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <div className="flex items-center pl-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#1e2a9b] hover:bg-[#162082] shadow-md shadow-blue-900/20 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 h-fit"
                >
                  <Plus className="w-5 h-5" strokeWidth={3} />
                  Add New
                </button>
              </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                {(['ALL', 'ADMIN', 'USER'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setRoleFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                      roleFilter === f
                        ? 'bg-[#1e2a9b] border-[#1e2a9b] text-white'
                        : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
                <span className="text-sm text-muted-foreground font-medium pl-2">
                  {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="shrink-0 rounded-md border border-[#d4d4d8] dark:border-zinc-700 bg-card shadow-sm overflow-hidden">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-[#f9f9fb] dark:bg-[#27272a] border-b border-[#d4d4d8] dark:border-zinc-700 hover:bg-[#f9f9fb] dark:hover:bg-[#27272a]">
                    <TableHead className="font-semibold w-[280px] text-foreground">User</TableHead>
                    <TableHead className="font-semibold text-foreground">Role</TableHead>
                    <TableHead className="font-semibold text-foreground">Create Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Last Updated</TableHead>
                    <TableHead className="font-semibold text-center w-[100px] text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground animate-pulse font-medium">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-medium">
                        {searchQuery || roleFilter !== 'ALL' ? 'No users match your filters.' : 'No users found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30 border-b border-[#d4d4d8] dark:border-zinc-700">
                        <TableCell className="py-4 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.username}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-sm"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              {/* Fallback avatar if error or no avatar */}
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 font-bold flex items-center justify-center border-2 border-background shadow-sm shrink-0 text-sm ${user.avatar ? 'hidden' : ''}`}>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              {currentUser?.id === user.id && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background bg-green-500"></span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground font-semibold">{user.username.charAt(0).toUpperCase() + user.username.slice(1)}</span>
                                {currentUser?.id === user.id && (
                                  <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 inline-flex items-center text-xs font-bold uppercase tracking-wider rounded-full border ${
                            user.role === 'ADMIN'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300'
                              : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                          }`}>
                            {user.role === 'ADMIN' ? 'Admin' : 'User'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-[14px] font-medium text-foreground">
                            <span>{new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="text-muted-foreground text-[12px]">{new Date(user.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-[14px] font-medium text-foreground">
                            <span>{new Date(user.updatedAt || user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="text-muted-foreground text-[12px]">{new Date(user.updatedAt || user.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit button */}
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setEditUsername(user.username);
                                setEditRole(user.role);
                                setEditPassword('');
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                              title="Edit User"
                            >
                              <MoreVertical className="w-5 h-5" strokeWidth={2} />
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => confirmDelete(user)}
                              disabled={currentUser?.id === user.id}
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                              title="Delete User"
                            >
                              <Trash2 className="w-5 h-5" strokeWidth={2} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
          </div>
        </div>

        {/* ── Add User Modal ───────────────────────────────────── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
              <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/50">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  Add New User
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="modal-username" className="text-sm font-semibold text-foreground block">Username</label>
                  <input id="modal-username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="modal-password" className="text-sm font-semibold text-foreground block">Password</label>
                  <input id="modal-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="modal-role" className="text-sm font-semibold text-foreground block">Role</label>
                  <div className="relative">
                    <select id="modal-role" value={role} onChange={e => setRole(e.target.value)}
                      className="flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 cursor-pointer">
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 px-6 rounded-lg font-semibold text-foreground hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" disabled={isCreating} className="h-11 px-6 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                    {isCreating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Edit User Modal ──────────────────────────────────── */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/50">
                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Settings className="w-5 h-5 text-blue-500" />
                  Edit User
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="edit-username" className="text-sm font-semibold text-foreground block">Username</label>
                  <input id="edit-username" value={editUsername} onChange={e => setEditUsername(e.target.value)} required
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-password" className="text-sm font-semibold text-foreground block">
                    New Password <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>
                  </label>
                  <input id="edit-password" type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Enter new password"
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-role" className="text-sm font-semibold text-foreground block">Role</label>
                  <div className="relative">
                    <select id="edit-role" value={editRole} onChange={e => setEditRole(e.target.value)} disabled={currentUser?.id === editingUser.id}
                      className="flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {currentUser?.id === editingUser.id && (
                    <p className="text-xs text-orange-500 mt-1">You cannot change your own role.</p>
                  )}
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="h-11 px-6 rounded-lg font-semibold text-foreground hover:bg-muted transition-colors">Cancel</button>
                  <button type="submit" disabled={isUpdating} className="h-11 px-6 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px]">
                    {isUpdating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Delete Confirmation Modal ────────────────────────── */}
        {isDeleteModalOpen && deletingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border">
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">Delete Account</h2>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-foreground">{deletingUser.username}</span>?
                    <br />This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setDeletingUser(null); }}
                    className="flex-1 h-11 rounded-lg font-semibold border border-input text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                    className="flex-1 h-11 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
