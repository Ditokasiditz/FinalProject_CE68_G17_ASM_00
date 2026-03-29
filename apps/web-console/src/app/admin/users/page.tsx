'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ProtectedRoute, useAuth, User } from '@/providers/auth-provider';
import {
  LayoutDashboard, ShieldCheck, ShieldAlert, Activity,
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
      if (!res.ok) throw new Error('Failed to fetch users');
      setUsers(await res.json());
    } catch (err) {
      setError('Could not load users');
      console.error(err);
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
        credentials: 'include',
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
        credentials: 'include',
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

  const navigations = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Score Factor', href: '/score-factor', icon: ShieldCheck },
    { title: 'Issues portfolio', href: '/issues', icon: ShieldAlert },
    { title: 'Digital Footprint', href: '/digital-footprint', icon: Activity },
    { title: 'User Management', href: '/admin/users', icon: UsersIcon, isActive: true },
    { title: 'Settings', href: '/settings', icon: Settings },
  ];

  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const userCount = users.length - adminCount;

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar navigations={navigations} />

        <main className="flex-1 overflow-y-auto p-8 bg-white text-gray-900 relative">
          <div className="mx-auto max-w-6xl space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-6">
              <UsersIcon className="w-7 h-7 text-gray-800" strokeWidth={2.5} />
              <h1 className="text-2xl font-extrabold tracking-tight">User Management</h1>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
                <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Summary Cards + Add Button */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between mb-8">
              <div className="flex gap-4 flex-1">
                {/* Total Card */}
                <div className="flex-1 border border-gray-300 rounded-xl p-5 flex flex-col justify-between max-w-[200px]">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-extrabold text-gray-900">Total</h2>
                    <div className="flex items-center font-bold text-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-black mr-2"></span>
                      {users.length}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 font-medium mt-3 leading-tight">
                    <p>All accounts</p>
                  </div>
                </div>

                {/* Admin Card */}
                <div className="flex-1 border border-gray-300 rounded-xl p-5 flex flex-col justify-between max-w-[200px]">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-extrabold text-gray-900">Admin</h2>
                    <div className="flex items-center font-bold text-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                      {adminCount}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 font-medium mt-3 leading-tight">
                    <p>Account manager</p>
                    <p>Full access</p>
                  </div>
                </div>

                {/* User Card */}
                <div className="flex-1 border border-gray-300 rounded-xl p-5 flex flex-col justify-between max-w-[200px]">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-extrabold text-gray-900">User</h2>
                    <div className="flex items-center font-bold text-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                      {userCount}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 font-medium mt-3 leading-tight">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
                <span className="text-sm text-gray-400 font-medium pl-2">
                  {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-[#d4d4d8] bg-card overflow-hidden">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-[#f9f9fb] border-b-[#d4d4d8] hover:bg-[#f9f9fb]">
                    <TableHead className="font-semibold w-[280px]">User</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Create Date</TableHead>
                    <TableHead className="font-semibold">Last Updated</TableHead>
                    <TableHead className="font-semibold text-center w-[100px]">Actions</TableHead>
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
                      <TableRow key={user.id} className="hover:bg-muted/30 border-b-[#d4d4d8]">
                        <TableCell className="py-4 font-medium">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.username}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              {/* Fallback avatar if error or no avatar */}
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 font-bold flex items-center justify-center border-2 border-white shadow-sm shrink-0 text-sm ${user.avatar ? 'hidden' : ''}`}>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              {currentUser?.id === user.id && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"></span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-semibold">{user.username.charAt(0).toUpperCase() + user.username.slice(1)}</span>
                                {currentUser?.id === user.id && (
                                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
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
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            {user.role === 'ADMIN' ? 'Admin' : 'User'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-[14px] font-medium text-gray-700">
                            <span>{new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="text-gray-500 text-[12px]">{new Date(user.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-[14px] font-medium text-gray-700">
                            <span>{new Date(user.updatedAt || user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span className="text-gray-500 text-[12px]">{new Date(user.updatedAt || user.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
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
                              className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                              title="Edit User"
                            >
                              <MoreVertical className="w-5 h-5" strokeWidth={2} />
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => confirmDelete(user)}
                              disabled={currentUser?.id === user.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
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
        </main>

        {/* ── Add User Modal ───────────────────────────────────── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B35]/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Add New User
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="modal-username" className="text-sm font-semibold text-gray-700 block">Username</label>
                  <input id="modal-username" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="modal-password" className="text-sm font-semibold text-gray-700 block">Password</label>
                  <input id="modal-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="modal-role" className="text-sm font-semibold text-gray-700 block">Role</label>
                  <div className="relative">
                    <select id="modal-role" value={role} onChange={e => setRole(e.target.value)}
                      className="flex h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 cursor-pointer">
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 px-6 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B35]/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Edit User
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="edit-username" className="text-sm font-semibold text-gray-700 block">Username</label>
                  <input id="edit-username" value={editUsername} onChange={e => setEditUsername(e.target.value)} required
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-password" className="text-sm font-semibold text-gray-700 block">
                    New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                  </label>
                  <input id="edit-password" type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Enter new password"
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-role" className="text-sm font-semibold text-gray-700 block">Role</label>
                  <div className="relative">
                    <select id="edit-role" value={editRole} onChange={e => setEditRole(e.target.value)} disabled={currentUser?.id === editingUser.id}
                      className="flex h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                  {currentUser?.id === editingUser.id && (
                    <p className="text-xs text-orange-500 mt-1">You cannot change your own role.</p>
                  )}
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="h-11 px-6 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B35]/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Delete Account</h2>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-gray-800">{deletingUser.username}</span>?
                    <br />This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setDeletingUser(null); }}
                    className="flex-1 h-11 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
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
    </ProtectedRoute>
  );
}
