'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/axios';
import {
  Users, MessageSquare, FileText, DollarSign, PenSquare,
  Tag, CreditCard, Settings, Bell, HelpCircle, Trash2,
  ChevronLeft, ChevronRight, Plus, Search, Check, X, ExternalLink,
  Loader2, Repeat, Package
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────

interface AnalyticStat {
  _id: string;
  count: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minAmount?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface BlogPost {
  _id: string;
  title: string;
  author: string;
  published: boolean;
  createdAt: string;
}

interface FaqEntry {
  _id: string;
  question: string;
  category: string;
  order: number;
  published: boolean;
}

interface Testimonial {
  _id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  published: boolean;
  order: number;
}

interface Notification {
  _id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  subject: string;
  userId: { _id: string; name: string; email: string };
  status: string;
  priority: string;
  createdAt: string;
}

interface WebsiteSettings {
  name: string;
  description: string;
  contactEmail: string;
  socialLinks?: Record<string, string>;
}

interface LandingSettings {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  ctaLink: string;
}

// ─── Helpers ──────────────────────────────────────────

const formatDate = (d: string) => new Date(d).toLocaleDateString();
const statusColor = (s: string) => {
  const map: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600',
    inactive: 'bg-muted text-muted-foreground',
    open: 'bg-blue-500/10 text-blue-600',
    closed: 'bg-muted text-muted-foreground',
    pending: 'bg-yellow-500/10 text-yellow-600',
    low: 'bg-green-500/10 text-green-600',
    medium: 'bg-yellow-500/10 text-yellow-600',
    high: 'bg-red-500/10 text-red-600',
    user: 'bg-blue-500/10 text-blue-600',
    admin: 'bg-purple-500/10 text-purple-600',
    info: 'bg-blue-500/10 text-blue-600',
    warning: 'bg-yellow-500/10 text-yellow-600',
    error: 'bg-red-500/10 text-red-600',
  };
  return map[s?.toLowerCase()] || 'bg-muted text-muted-foreground';
};

// ─── Confirmation Dialog ──────────────────────────────

function ConfirmDialog({ open, title, message, onConfirm, onCancel }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button variant="destructive" onClick={onConfirm}>Confirm</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Modal Wrapper ────────────────────────────────────

function Modal({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-20">
      <Card className="w-full max-w-lg mb-20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────

function StatCard({ icon: Icon, label, value, loading }: {
  icon: React.ElementType; label: string; value: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-lg bg-primary/10 p-3"><Icon className="h-6 w-6 text-primary" /></div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Overview Tab ─────────────────────────────────────

function OverviewTab() {
  const [dashboard, setDashboard] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/dashboard');
        const d = res.data.data || res.data;
        setDashboard(d);
        setRecentUsers(d.recentUsers || []);
        setRecentPayments(d.recentPayments || []);
        setRecentChats(d.recentChats || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const statCards = [
    { icon: Users, label: 'Total Users', value: String(dashboard.totalUsers ?? '—') },
    { icon: Users, label: "Today's Users", value: String(dashboard.todayUsers ?? '—') },
    { icon: Users, label: 'Active Users (7d)', value: String(dashboard.activeUsers ?? '—') },
    { icon: MessageSquare, label: 'Chats', value: String(dashboard.totalChats ?? '—') },
    { icon: FileText, label: 'Documents', value: String(dashboard.totalDocuments ?? '—') },
    { icon: DollarSign, label: 'Revenue', value: dashboard.revenue ? `$${(dashboard.revenue.total / 100).toLocaleString()}` : '—' },
    { icon: Tag, label: 'Coupons', value: String(dashboard.totalCoupons ?? '—') },
    { icon: Repeat, label: 'Subscriptions', value: String(dashboard.totalSubscriptions ?? '—') },
    { icon: Package, label: 'Packages', value: String(dashboard.totalPackages ?? '—') },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} loading={loading} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Users</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u: any) => (
                  <div key={u._id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${statusColor(u.role)}`}>{u.role}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">${(p.amount / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                    </div>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${statusColor(p.status)}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Chats</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : recentChats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chats yet.</p>
            ) : (
              <div className="space-y-3">
                {recentChats.map((c: any) => (
                  <div key={c._id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium truncate max-w-[160px]">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.user?.name || 'Unknown'} · {formatDate(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=20&search=${search}`);
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const changeRole = async (id: string, role: string) => {
    try {
      await api.patch(`/admin/users/${id}`, { role });
      fetchUsers();
    } catch {}
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchUsers();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b last:border-0">
                      <td className="py-3">{u.name}</td>
                      <td className="py-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3">
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u._id, e.target.value)}
                          className="rounded border bg-transparent px-2 py-1 text-xs"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="py-3">
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(u)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={deleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Coupons Tab ──────────────────────────────────────

const emptyCoupon = {
  code: '', description: '', discountType: 'percentage', discountValue: 0,
  minAmount: 0, maxUses: 0, expiresAt: '',
};

function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyCoupon);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data.data || res.data.coupons || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyCoupon); setShowForm(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, description: c.description || '',
      discountType: c.discountType, discountValue: c.discountValue,
      minAmount: c.minAmount || 0, maxUses: c.maxUses || 0,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const saveCoupon = async () => {
    try {
      if (editing) {
        await api.patch(`/admin/coupons/${editing._id}`, form);
      } else {
        await api.post('/admin/coupons', form);
      }
      setShowForm(false);
      fetchCoupons();
    } catch {}
  };

  const deleteCoupon = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/coupons/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchCoupons();
    } catch {}
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await api.patch(`/admin/coupons/${c._id}`, { isActive: !c.isActive });
      fetchCoupons();
    } catch {}
  };

  const seedDefaults = async () => {
    try {
      await api.post('/admin/coupons/seed');
      fetchCoupons();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Create Coupon</Button>
        <Button variant="outline" onClick={seedDefaults}>Seed Defaults</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : coupons.length === 0 ? (
            <p className="text-muted-foreground">No coupons yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Discount</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Uses</th>
                    <th className="pb-3 font-medium">Expires</th>
                    <th className="pb-3 font-medium">Active</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c._id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs">{c.code}</td>
                      <td className="py-3">{c.discountValue}{c.discountType === 'percentage' ? '%' : '$'}</td>
                      <td className="py-3 capitalize text-xs">{c.discountType}</td>
                      <td className="py-3 text-muted-foreground">{c.usedCount}/{c.maxUses || '∞'}</td>
                      <td className="py-3 text-muted-foreground">{c.expiresAt ? formatDate(c.expiresAt) : '—'}</td>
                      <td className="py-3">
                        <button onClick={() => toggleActive(c)}>
                          {c.isActive ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="py-3 flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showForm} title={editing ? 'Edit Coupon' : 'Create Coupon'} onClose={() => setShowForm(false)}>
        <div className="space-y-3">
          <Input placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
          <Input type="number" placeholder="Discount Value" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
          <Input type="number" placeholder="Min Amount (0 = none)" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })} />
          <Input type="number" placeholder="Max Uses (0 = unlimited)" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} />
          <Input type="datetime-local" placeholder="Expires At" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          <Button className="w-full" onClick={saveCoupon}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`Delete coupon "${deleteTarget?.code}"? This cannot be undone.`}
        onConfirm={deleteCoupon}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────

function PaymentsTab() {
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/stripe/admin/transactions?page=1&limit=5');
        setTxns(res.data.data || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Latest Transactions</CardTitle>
        <a href="/admin/payments">
          <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1" /> View All</Button>
        </a>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : txns.length === 0 ? (
          <p className="text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((tx: any) => (
                  <tr key={tx._id} className="border-b last:border-0">
                    <td className="py-3">{formatDate(tx.createdAt)}</td>
                    <td className="py-3 font-medium">{tx.currency?.toUpperCase() || '$'} {(tx.amount / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Content Tab ──────────────────────────────────────

// Blog
function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', author: '', tags: '', published: false });
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/blog');
      setPosts(res.data.data || res.data.posts || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', slug: '', content: '', excerpt: '', author: '', tags: '', published: false }); setShowForm(true); };
  const openEdit = (p: BlogPost) => { setEditing(p); setShowForm(true); };

  const save = async () => {
    try {
      const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (editing) {
        await api.patch(`/admin/blog/${editing._id}`, payload);
      } else {
        await api.post('/admin/blog', payload);
      }
      setShowForm(false);
      fetchPosts();
    } catch {}
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/admin/blog/${deleteTarget._id}`); setDeleteTarget(null); fetchPosts(); } catch {}
  };

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Post</Button>
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-muted-foreground">Loading...</p> : posts.length === 0 ? (
            <p className="text-muted-foreground">No blog posts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Author</th>
                    <th className="pb-3 font-medium">Published</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p._id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{p.title}</td>
                      <td className="py-3 text-muted-foreground">{p.author}</td>
                      <td className="py-3">{p.published ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                      <td className="py-3 flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(p)}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showForm} title={editing ? 'Edit Post' : 'New Post'} onClose={() => setShowForm(false)}>
        <div className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <textarea
            placeholder="Content (markdown)"
            rows={6}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
          <Input placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          <Input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          <Input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Published
          </label>
          <Button className="w-full" onClick={save}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Post" message={`Delete "${deleteTarget?.title}"?`} onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

// FAQ
function FaqSection() {
  const [items, setItems] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FaqEntry | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', category: '', order: 0, published: false });
  const [deleteTarget, setDeleteTarget] = useState<FaqEntry | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/faq'); setItems(res.data.data || res.data.faq || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setEditing(null); setForm({ question: '', answer: '', category: '', order: 0, published: false }); setShowForm(true); };
  const openEdit = (f: FaqEntry) => { setEditing(f); setForm({ question: f.question, answer: '', category: f.category, order: f.order, published: f.published }); setShowForm(true); };

  const save = async () => {
    try {
      if (editing) { await api.patch(`/admin/faq/${editing._id}`, form); } else { await api.post('/admin/faq', form); }
      setShowForm(false); fetchItems();
    } catch {}
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/admin/faq/${deleteTarget._id}`); setDeleteTarget(null); fetchItems(); } catch {}
  };

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New FAQ</Button>
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
            <p className="text-muted-foreground">No FAQ entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Question</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Published</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f._id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{f.question}</td>
                      <td className="py-3 text-muted-foreground capitalize">{f.category}</td>
                      <td className="py-3 text-muted-foreground">{f.order}</td>
                      <td className="py-3">{f.published ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</td>
                      <td className="py-3 flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(f)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(f)}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showForm} title={editing ? 'Edit FAQ' : 'New FAQ'} onClose={() => setShowForm(false)}>
        <div className="space-y-3">
          <Input placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          <textarea
            placeholder="Answer"
            rows={4}
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Published
          </label>
          <Button className="w-full" onClick={save}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete FAQ" message={`Delete this FAQ entry?`} onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

// Testimonials
function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ name: '', role: '', content: '', rating: 5, published: false, order: 0 });
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/testimonials'); setItems(res.data.data || res.data.testimonials || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', role: '', content: '', rating: 5, published: false, order: 0 }); setShowForm(true); };
  const openEdit = (t: Testimonial) => { setEditing(t); setForm({ name: t.name, role: t.role, content: t.content, rating: t.rating, published: t.published, order: t.order }); setShowForm(true); };

  const save = async () => {
    try {
      if (editing) { await api.patch(`/admin/testimonials/${editing._id}`, form); } else { await api.post('/admin/testimonials', form); }
      setShowForm(false); fetchItems();
    } catch {}
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/admin/testimonials/${deleteTarget._id}`); setDeleteTarget(null); fetchItems(); } catch {}
  };

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Testimonial</Button>
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-muted-foreground">Loading...</p> : items.length === 0 ? (
            <p className="text-muted-foreground">No testimonials yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Rating</th>
                    <th className="pb-3 font-medium">Published</th>
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t._id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{t.name}</td>
                      <td className="py-3 text-muted-foreground">{t.role}</td>
                      <td className="py-3">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</td>
                      <td className="py-3">{t.published ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</td>
                      <td className="py-3 text-muted-foreground">{t.order}</td>
                      <td className="py-3 flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(t)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(t)}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showForm} title={editing ? 'Edit Testimonial' : 'New Testimonial'} onClose={() => setShowForm(false)}>
        <div className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <textarea
            placeholder="Content"
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2 text-sm">
            <span>Rating:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} className={n <= form.rating ? 'text-yellow-500' : 'text-muted-foreground'}>
                ★
              </button>
            ))}
          </div>
          <Input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Published
          </label>
          <Button className="w-full" onClick={save}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Testimonial" message={`Delete this testimonial?`} onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function ContentTab() {
  const [contentTab, setContentTab] = useState('blog');

  return (
    <Tabs value={contentTab} onValueChange={setContentTab}>
      <TabsList>
        <TabsTrigger value="blog">Blog</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
      </TabsList>
      <TabsContent value="blog" className="mt-4"><BlogSection /></TabsContent>
      <TabsContent value="faq" className="mt-4"><FaqSection /></TabsContent>
      <TabsContent value="testimonials" className="mt-4"><TestimonialsSection /></TabsContent>
    </Tabs>
  );
}

// ─── Settings Tab ─────────────────────────────────────

function SettingsTab() {
  const [ws, setWs] = useState<WebsiteSettings>({ name: '', description: '', contactEmail: '', socialLinks: {} });
  const [ls, setLs] = useState<LandingSettings>({ heroTitle: '', heroSubtitle: '', ctaText: '', ctaLink: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'website' | 'landing' | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [wRes, lRes] = await Promise.all([
          api.get('/admin/settings/website'),
          api.get('/admin/settings/landing'),
        ]);
        setWs(wRes.data.data || wRes.data);
        setLs(lRes.data.data || lRes.data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveWebsite = async () => {
    setSaving('website');
    try { await api.put('/admin/settings/website', ws); } catch {}
    setSaving(null);
  };

  const saveLanding = async () => {
    setSaving('landing');
    try { await api.put('/admin/settings/landing', ls); } catch {}
    setSaving(null);
  };

  if (loading) return <p className="text-muted-foreground">Loading settings...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Website Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Site Name" value={ws.name} onChange={(e) => setWs({ ...ws, name: e.target.value })} />
          <Input placeholder="Description" value={ws.description} onChange={(e) => setWs({ ...ws, description: e.target.value })} />
          <Input placeholder="Contact Email" type="email" value={ws.contactEmail} onChange={(e) => setWs({ ...ws, contactEmail: e.target.value })} />
          <Input placeholder="Twitter URL" value={ws.socialLinks?.twitter || ''} onChange={(e) => setWs({ ...ws, socialLinks: { ...ws.socialLinks, twitter: e.target.value } })} />
          <Input placeholder="GitHub URL" value={ws.socialLinks?.github || ''} onChange={(e) => setWs({ ...ws, socialLinks: { ...ws.socialLinks, github: e.target.value } })} />
          <Button onClick={saveWebsite} disabled={saving === 'website'}>
            {saving === 'website' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Save Website Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Landing Page Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Hero Title" value={ls.heroTitle} onChange={(e) => setLs({ ...ls, heroTitle: e.target.value })} />
          <Input placeholder="Hero Subtitle" value={ls.heroSubtitle} onChange={(e) => setLs({ ...ls, heroSubtitle: e.target.value })} />
          <Input placeholder="CTA Text" value={ls.ctaText} onChange={(e) => setLs({ ...ls, ctaText: e.target.value })} />
          <Input placeholder="CTA Link" value={ls.ctaLink} onChange={(e) => setLs({ ...ls, ctaLink: e.target.value })} />
          <Button onClick={saveLanding} disabled={saving === 'landing'}>
            {saving === 'landing' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Save Landing Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────

function NotificationsTab() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', title: '', message: '', type: 'info' });
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);

  const fetchNotifs = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/notifications'); setNotifs(res.data.data || res.data.notifications || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifs(); }, []);

  const createNotif = async () => {
    try {
      const payload = { ...form };
      if (!payload.userId) delete (payload as any).userId;
      await api.post('/admin/notifications', payload);
      setShowForm(false);
      setForm({ userId: '', title: '', message: '', type: 'info' });
      fetchNotifs();
    } catch {}
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/admin/notifications/${deleteTarget._id}`); setDeleteTarget(null); fetchNotifs(); } catch {}
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Create Notification</Button>
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-muted-foreground">Loading...</p> : notifs.length === 0 ? (
            <p className="text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium">Message</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Read</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifs.map((n) => (
                    <tr key={n._id} className="border-b last:border-0">
                      <td className="py-3 font-mono text-xs text-muted-foreground">{n.userId ? `${n.userId.substring(0, 8)}...` : 'All'}</td>
                      <td className="py-3 font-medium">{n.title}</td>
                      <td className="py-3 text-muted-foreground max-w-xs truncate">{n.message}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(n.type)}`}>{n.type}</span>
                      </td>
                      <td className="py-3">{n.read ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground" />}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(n.createdAt)}</td>
                      <td className="py-3">
                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(n)}><Trash2 className="h-3 w-3" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={showForm} title="Create Notification" onClose={() => setShowForm(false)}>
        <div className="space-y-3">
          <Input placeholder="User ID (leave empty for all)" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea
            placeholder="Message"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <Button className="w-full" onClick={createNotif}>Send</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Notification" message={`Delete this notification?`} onConfirm={remove} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

// ─── Support Tab ──────────────────────────────────────

function SupportTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyTarget, setReplyTarget] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try { const res = await api.get('/admin/support'); setTickets(res.data.data || res.data.tickets || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try { await api.patch(`/admin/support/${id}`, { status }); fetchTickets(); } catch {}
  };

  const sendReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    try {
      await api.post(`/admin/support/${replyTarget}/reply`, { message: replyText });
      setReplyTarget(null);
      setReplyText('');
      fetchTickets();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-muted-foreground">Loading...</p> : tickets.length === 0 ? (
            <p className="text-muted-foreground">No support tickets.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t._id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{t.subject}</td>
                      <td className="py-3 text-muted-foreground">{t.userId?.name || t.userId?.email || 'Unknown'}</td>
                      <td className="py-3">
                        <select
                          value={t.status}
                          onChange={(e) => updateStatus(t._id, e.target.value)}
                          className="rounded border bg-transparent px-2 py-1 text-xs"
                        >
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                      <td className="py-3">
                        <Button variant="outline" size="sm" onClick={() => setReplyTarget(replyTarget === t._id ? null : t._id)}>
                          Reply
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {replyTarget && (
        <Card>
          <CardHeader><CardTitle>Reply to Ticket</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <textarea
              placeholder="Write your reply..."
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={sendReply}>Send Reply</Button>
              <Button variant="outline" onClick={() => { setReplyTarget(null); setReplyText(''); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────

const tabs = [
  { id: 'overview', label: 'Overview', icon: Users },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'coupons', label: 'Coupons', icon: Tag },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'content', label: 'Content', icon: PenSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'support', label: 'Support', icon: HelpCircle },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [adminCheck, setAdminCheck] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    api.get('/users/me').then((res) => {
      const role = res.data?.data?.role;
      if (role === 'admin') setAdminCheck('granted');
      else setAdminCheck('denied');
    }).catch(() => setAdminCheck('denied'));
  }, []);

  if (adminCheck === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (adminCheck === 'denied') {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">You do not have permission to access this page. Admin privileges are required.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="h-auto flex-nowrap gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 whitespace-nowrap">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
        <TabsContent value="coupons" className="mt-6"><CouponsTab /></TabsContent>
        <TabsContent value="payments" className="mt-6"><PaymentsTab /></TabsContent>
        <TabsContent value="content" className="mt-6"><ContentTab /></TabsContent>
        <TabsContent value="settings" className="mt-6"><SettingsTab /></TabsContent>
        <TabsContent value="notifications" className="mt-6"><NotificationsTab /></TabsContent>
        <TabsContent value="support" className="mt-6"><SupportTab /></TabsContent>
      </Tabs>
    </div>
  );
}
