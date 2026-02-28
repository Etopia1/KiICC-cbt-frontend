import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { io } from 'socket.io-client';
import AdminLayout from '../components/AdminLayout';
import {
    Activity, Users, MessageSquare, Shield, Download, Trash2,
    Ban, CheckCircle, RefreshCcw, Search, Filter, Eye, X,
    AlertTriangle, User, MessageCircle, BookOpen, Bell,
    BarChart2, TrendingUp, Clock, Zap, ChevronDown, Globe
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const API = 'https://educbt-pro-backend.onrender.com';

const ACTION_COLORS = {
    USER_LOGIN: '#10b981', USER_LOGOUT: '#6b7280',
    EXAM_STARTED: '#3b82f6', EXAM_ENDED: '#ef4444', EXAM_SUBMIT: '#22c55e', EXAM_VIOLATION: '#dc2626',
    EXAM_SESSION_START: '#a855f7',
    MESSAGE_SENT: '#8b5cf6', GROUP_CREATED: '#f59e0b',
    USER_BLOCKED: '#dc2626', USER_DELETED: '#7f1d1d',
    EXAM_CREATED: '#D4AF37', GRADE_SUBMITTED: '#14b8a6',
    DEFAULT: '#94a3b8'
};

const SEV_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#7f1d1d' };

const ActionBadge = ({ action }) => {
    const color = ACTION_COLORS[action] || ACTION_COLORS.DEFAULT;
    return (
        <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide" style={{ background: color + '15', color, border: `1px solid ${color}30` }}>
            {action.replace(/_/g, ' ')}
        </span>
    );
};

const SevBadge = ({ sev }) => {
    const c = SEV_COLORS[sev] || '#94a3b8';
    return <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase" style={{ background: c + '15', color: c }}>{sev}</span>;
};

const StatCard = ({ label, value, icon: Icon, color = '#D4AF37', sub }) => (
    <div className="bg-white border border-[#ede3d4] rounded-3xl p-6 relative overflow-hidden hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full opacity-40" style={{ background: color }} />
        <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-[#1A120B] flex items-center justify-center mb-4" style={{ border: `1px solid ${color}30` }}>
                <Icon size={17} style={{ color }} />
            </div>
            <p className="text-[#8a7564] text-[9px] font-black uppercase tracking-widest">{label}</p>
            <h3 className="text-3xl font-black text-[#1a150e] tracking-tighter italic mt-1">{value}</h3>
            {sub && <p className="text-[#a89282] text-[9px] font-bold mt-1">{sub}</p>}
        </div>
    </div>
);

const AdminActivityMonitor = () => {
    const { token, user } = useSelector(s => s.auth);
    const { socket } = useSocket();

    // Data
    const [logs, setLogs] = useState([]);
    const [totalLogs, setTotalLogs] = useState(0);
    const [users, setUsers] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [groups, setGroups] = useState([]);
    
    // UI
    const [tab, setTab] = useState('feed'); // 'feed' | 'users' | 'chat' | 'analytics'
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetail, setUserDetail] = useState(null);
    const [liveActivity, setLiveActivity] = useState([]);
    const [livePing, setLivePing] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMessages, setGroupMessages] = useState([]);
    const [chatPage, setChatPage] = useState(1);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterSearch, setFilterSearch] = useState('');
    const [filterFrom, setFilterFrom] = useState('');
    const [page, setPage] = useState(1);

    const headers = { Authorization: `Bearer ${token}` };

    // ── Socket Real-time Feed ──
    useEffect(() => {
        if (!socket) return;
        
        socket.emit('join_admin_monitor', user?.schoolId);

        const handleNewActivity = (log) => {
            setLivePing(true);
            setTimeout(() => setLivePing(false), 800);
            
            setLiveActivity(prev => [log, ...prev].slice(0, 25));
            
            // If we are on the feed tab, we might want to nudge the main log list too
            if (tab === 'feed') {
                setLogs(prev => [log, ...prev].slice(0, 50));
            }

            // Toast for high severity
            if (['high', 'critical'].includes(log.severity)) {
                toast((t) => (
                    <div className="flex items-start gap-4 p-2">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="font-black text-[10px] uppercase text-rose-600 tracking-widest">{log.severity} Alert</p>
                            <p className="text-xs font-bold text-slate-800">{log.userName}: {log.action.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{log.messagePreview || 'Check monitoring for details'}</p>
                        </div>
                    </div>
                ), { duration: 6000, position: 'top-right' });
            }
        };

        socket.on('new_activity', handleNewActivity);
        socket.on('group_activity', (data) => {
            handleNewActivity({
                _id: Date.now(),
                action: 'MESSAGE_SENT',
                userName: data.senderName,
                messagePreview: data.lastMessage?.substring(0, 60),
                metadata: { groupName: data.groupName },
                createdAt: new Date().toISOString(),
                severity: 'low'
            });
        });

        return () => {
            socket.off('new_activity');
            socket.off('group_activity');
        };
    }, [socket, user?.schoolId, tab]);

    // ── Fetch on tab/filter change ──
    useEffect(() => { if (tab === 'feed') fetchLogs(); }, [tab, filterAction, filterRole, filterSearch, page]);
    useEffect(() => { if (tab === 'users') fetchUsers(); }, [tab]);
    useEffect(() => { if (tab === 'analytics') fetchAnalytics(); }, [tab]);
    useEffect(() => { if (tab === 'chat') fetchGroups(); }, [tab]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 50 });
            if (filterAction) params.set('action', filterAction);
            if (filterRole) params.set('role', filterRole);
            if (filterSearch) params.set('search', filterSearch);
            if (filterFrom) params.set('from', filterFrom);
            const res = await axios.get(`${API}/admin/activity?${params}`, { headers });
            setLogs(res.data.logs);
            setTotalLogs(res.data.total);
        } catch { toast.error('Failed to load activity'); }
        finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/users`, { headers });
            setUsers(res.data);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/analytics`, { headers });
            setAnalytics(res.data);
        } catch { toast.error('Failed to load analytics'); }
        finally { setLoading(false); }
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/groups`, { headers });
            setGroups(res.data);
        } catch {}
        finally { setLoading(false); }
    };

    const fetchGroupMessages = async (group) => {
        setSelectedGroup(group);
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/messages?groupId=${group._id}`, { headers });
            setGroupMessages(res.data);
        } catch { toast.error('Failed to load messages'); }
        finally { setLoading(false); }
    };

    const fetchUserDetail = async (u) => {
        setSelectedUser(u);
        try {
            const res = await axios.get(`${API}/admin/users/${u._id}`, { headers });
            setUserDetail(res.data);
        } catch {}
    };

    const toggleBlock = async (u) => {
        try {
            const res = await axios.patch(`${API}/admin/users/${u._id}/toggle-block`, {}, { headers });
            toast.success(res.data.message);
            fetchUsers();
            if (userDetail?.user?._id === u._id) fetchUserDetail(u);
        } catch { toast.error('Action failed'); }
    };

    const deleteUser = async (u) => {
        if (!confirm(`Permanently delete "${u.fullName}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`${API}/admin/users/${u._id}`, { headers });
            toast.success('User deleted');
            setSelectedUser(null);
            fetchUsers();
        } catch { toast.error('Delete failed'); }
    };

    const downloadLogs = async () => {
        try {
            const res = await axios.get(`${API}/admin/activity/download`, { headers, responseType: 'blob' });
            const url = window.URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            toast.success('Downloaded!');
        } catch { toast.error('Download failed'); }
    };

    const tabs = [
        { id: 'feed', label: 'Activity Feed', icon: Activity },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'chat', label: 'Chat Monitor', icon: MessageSquare },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    ];

    const filteredUsers = users.filter(u =>
        u.fullName?.toLowerCase().includes(filterSearch.toLowerCase()) ||
        u.role?.toLowerCase().includes(filterSearch.toLowerCase()) ||
        u.uniqueLoginId?.toLowerCase().includes(filterSearch.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-24 font-outfit">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-white border border-[#ede3d4] rounded-full px-4 py-1.5 shadow-sm">
                            <div className={`w-2 h-2 rounded-full ${livePing ? 'bg-[#D4AF37] animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                            <span className="text-[#a18146] text-[9px] font-black uppercase tracking-widest">Live Monitoring Active</span>
                        </div>
                        <h1 className="text-4xl font-black text-[#1a150e] leading-none tracking-tighter uppercase italic">
                            Admin <span className="text-[#D4AF37]">Monitor</span>
                        </h1>
                        <p className="text-[#8a7564] text-sm">Real-time surveillance of all school activity</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={downloadLogs}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#ede3d4] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#8a7564] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all shadow-sm">
                            <Download size={13} /> Export CSV
                        </button>
                        <button onClick={() => { fetchLogs(); fetchUsers(); }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A120B] text-[#D4AF37] rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#D4AF37]/20 shadow-lg hover:bg-black transition-all">
                            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Live Activity Strip */}
                {liveActivity.length > 0 && (
                    <div className="bg-[#1A120B] border border-[#D4AF37]/20 rounded-3xl px-6 py-4 overflow-hidden">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                            <span className="text-[#D4AF37] text-[9px] font-black uppercase tracking-widest">Live Activity Stream</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {liveActivity.slice(0, 8).map((a, i) => (
                                <div key={a._id} className="bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 flex-shrink-0 min-w-[200px]">
                                    <p className="text-[9px] font-black text-[#D4AF37]/60 uppercase tracking-wide">{a.action?.replace(/_/g,' ')}</p>
                                    <p className="text-white text-xs font-bold mt-0.5 truncate">{a.userName}</p>
                                    {a.messagePreview && <p className="text-white/30 text-[9px] truncate mt-0.5">"{a.messagePreview}"</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-[#ede3d4] rounded-2xl p-1.5 shadow-sm w-fit">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                tab === id ? 'bg-[#1A120B] text-[#D4AF37]' : 'text-[#8a7564] hover:text-[#1A120B] hover:bg-[#f5efea]'
                            }`}>
                            <Icon size={13} /> {label}
                        </button>
                    ))}
                </div>

                {/* ── ACTIVITY FEED TAB ── */}
                {tab === 'feed' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white border border-[#ede3d4] rounded-3xl p-5 flex flex-wrap gap-3 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c4b09a]" />
                                <input type="text" placeholder="Search user or action..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#f5efea] border border-[#ede3d4] rounded-2xl text-sm text-[#1A120B] outline-none focus:border-[#D4AF37]/40" />
                            </div>
                            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                                className="px-4 py-2.5 bg-[#f5efea] border border-[#ede3d4] rounded-2xl text-[11px] font-black text-[#8a7564] uppercase outline-none focus:border-[#D4AF37]/40">
                                <option value="">All Roles</option>
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="school_admin">Admin</option>
                            </select>
                            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
                                className="px-4 py-2.5 bg-[#f5efea] border border-[#ede3d4] rounded-2xl text-[11px] font-black text-[#8a7564] uppercase outline-none focus:border-[#D4AF37]/40">
                                <option value="">All Actions</option>
                                {['USER_LOGIN','EXAM_START','EXAM_SUBMIT','EXAM_VIOLATION','MESSAGE_SENT','GROUP_CREATED','GRADE_SUBMITTED','USER_BLOCKED'].map(a => (
                                    <option key={a} value={a}>{a.replace(/_/g,' ')}</option>
                                ))}
                            </select>
                            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                                className="px-4 py-2.5 bg-[#f5efea] border border-[#ede3d4] rounded-2xl text-[11px] text-[#8a7564] outline-none focus:border-[#D4AF37]/40" />
                            <button onClick={fetchLogs}
                                className="px-5 py-2.5 bg-[#1A120B] text-[#D4AF37] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                                Filter
                            </button>
                        </div>

                        {/* Log Table */}
                        <div className="bg-white border border-[#ede3d4] rounded-3xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-[#f0e8da] flex items-center justify-between">
                                <h3 className="font-black text-[#1A120B] uppercase italic text-sm">Activity Log ({totalLogs.toLocaleString()} events)</h3>
                            </div>
                            <div className="overflow-auto max-h-[500px]">
                                {loading ? (
                                    <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /></div>
                                ) : logs.length === 0 ? (
                                    <div className="py-12 text-center text-[#a89282] text-sm font-bold">No activity logs found</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#f5efea] border-b border-[#ede3d4] sticky top-0">
                                            <tr>
                                                {['Time', 'User', 'Role', 'Action', 'Severity', 'Details'].map(h => (
                                                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-[#8a7564] uppercase tracking-widest">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#f0e8da]">
                                            {logs.map(log => (
                                                <tr key={log._id} className="hover:bg-[#fdf9f4] transition-all">
                                                    <td className="px-5 py-3 text-[10px] font-bold text-[#a89282] whitespace-nowrap">
                                                        {new Date(log.createdAt).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                                    </td>
                                                    <td className="px-5 py-3 font-black text-[#1A120B] text-xs uppercase italic">{log.userName}</td>
                                                    <td className="px-5 py-3">
                                                        <span className="text-[9px] font-black text-[#8a7564] uppercase bg-[#f0e8da] px-2 py-1 rounded-lg">
                                                            {log.userRole?.replace('_',' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3"><ActionBadge action={log.action} /></td>
                                                    <td className="px-5 py-3"><SevBadge sev={log.severity} /></td>
                                                    <td className="px-5 py-3 text-[10px] text-[#a89282] max-w-[200px] truncate">
                                                        {log.messagePreview || JSON.stringify(log.metadata)?.substring(0, 60) || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {/* Pagination */}
                            {totalLogs > 50 && (
                                <div className="px-6 py-3 border-t border-[#f0e8da] flex items-center justify-between">
                                    <span className="text-[10px] text-[#a89282] font-bold">Page {page} of {Math.ceil(totalLogs/50)}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                                            className="px-4 py-1.5 bg-[#f5efea] text-[#6b5a4a] rounded-xl text-[10px] font-black uppercase hover:bg-[#ede3d4] disabled:opacity-30">Prev</button>
                                        <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(totalLogs/50)}
                                            className="px-4 py-1.5 bg-[#1A120B] text-[#D4AF37] rounded-xl text-[10px] font-black uppercase hover:bg-black disabled:opacity-30">Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── USERS TAB ── */}
                {tab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* User List */}
                        <div className={`lg:col-span-${selectedUser ? '2' : '5'} space-y-4`}>
                            <div className="bg-white border border-[#ede3d4] rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-6 py-4 border-b border-[#f0e8da] flex items-center justify-between">
                                    <h3 className="font-black text-[#1A120B] uppercase italic text-sm">All Users ({users.length})</h3>
                                    <div className="relative">
                                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4b09a]" />
                                        <input type="text" placeholder="Search..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                                            className="pl-8 pr-4 py-2 bg-[#f5efea] border border-[#ede3d4] rounded-xl text-xs outline-none focus:border-[#D4AF37]/40 w-48"/>
                                    </div>
                                </div>
                                <div className="divide-y divide-[#f0e8da] max-h-[600px] overflow-y-auto">
                                    {loading ? (
                                        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /></div>
                                    ) : filteredUsers.map(u => (
                                        <div key={u._id}
                                            onClick={() => fetchUserDetail(u)}
                                            className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#fdf9f4] transition-all group ${selectedUser?._id === u._id ? 'bg-[#fdf9f4]' : ''}`}>
                                            <div className="w-10 h-10 rounded-2xl bg-[#1A120B] text-[#D4AF37] flex items-center justify-center font-black text-sm flex-shrink-0">
                                                {u.fullName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-[#1A120B] text-sm uppercase italic truncate">{u.fullName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-black text-[#8a7564] uppercase">{u.role?.replace('_',' ')}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#c4b09a]" />
                                                    <span className={`text-[9px] font-black ${u.status === 'verified' ? 'text-emerald-600' : u.status === 'suspended' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                        {u.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={(e) => { e.stopPropagation(); toggleBlock(u); }}
                                                    className={`p-2 rounded-xl border text-[9px] font-black uppercase transition-all ${u.status === 'suspended' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'}`}
                                                    title={u.status === 'suspended' ? 'Unblock' : 'Block'}>
                                                    {u.status === 'suspended' ? <CheckCircle size={14} /> : <Ban size={14} />}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteUser(u); }}
                                                    className="p-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* User Detail Panel */}
                        {selectedUser && userDetail && (
                            <div className="lg:col-span-3 space-y-4">
                                <div className="bg-white border border-[#ede3d4] rounded-3xl overflow-hidden shadow-sm">
                                    <div className="bg-[#1A120B] px-6 py-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-[#D4AF37]/20 border-2 border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-black text-2xl">
                                                    {userDetail.user.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-black text-lg uppercase italic">{userDetail.user.fullName}</h3>
                                                    <p className="text-[#D4AF37]/60 text-[10px] font-bold uppercase">{userDetail.user.role?.replace('_', ' ')} · {userDetail.user.uniqueLoginId}</p>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg mt-1 inline-block ${userDetail.user.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                        {userDetail.user.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => toggleBlock(userDetail.user)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${userDetail.user.status === 'suspended' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                    {userDetail.user.status === 'suspended' ? 'Unblock' : 'Block'}
                                                </button>
                                                <button onClick={() => deleteUser(userDetail.user)}
                                                    className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase">
                                                    Delete
                                                </button>
                                                <button onClick={() => { setSelectedUser(null); setUserDetail(null); }}
                                                    className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="p-6">
                                        <h4 className="text-sm font-black text-[#1A120B] uppercase italic mb-4">Recent Activity ({userDetail.logs.length})</h4>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {userDetail.logs.slice(0, 20).map(log => (
                                                <div key={log._id} className="flex items-center gap-3 px-4 py-2.5 bg-[#f5efea] rounded-2xl">
                                                    <ActionBadge action={log.action} />
                                                    <p className="text-[10px] text-[#a89282] flex-1 truncate">
                                                        {log.messagePreview || JSON.stringify(log.metadata)?.substring(0, 50)}
                                                    </p>
                                                    <span className="text-[9px] text-[#c4b09a] font-bold flex-shrink-0">
                                                        {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Exam history */}
                                    {userDetail.exams?.length > 0 && (
                                        <div className="px-6 pb-6">
                                            <h4 className="text-sm font-black text-[#1A120B] uppercase italic mb-4">Exam Sessions</h4>
                                            <div className="space-y-2">
                                                {userDetail.exams.slice(0, 5).map(s => (
                                                    <div key={s._id} className="flex items-center justify-between px-4 py-2.5 bg-[#f5efea] rounded-2xl">
                                                        <span className="text-xs font-black text-[#1A120B] uppercase italic">{s.exam?.title || 'Exam'}</span>
                                                        <span className={`text-xs font-black ${Number(s.percentage) >= 50 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                            {(s.percentage || 0).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── CHAT MONITOR TAB ── */}
                {tab === 'chat' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className={`lg:col-span-${selectedGroup ? '2' : '5'} grid grid-cols-1 md:grid-cols-2 gap-4 h-fit`}>
                            {loading && !selectedGroup ? (
                                <div className="col-span-full flex justify-center py-16">
                                    <div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
                                </div>
                            ) : groups.map(g => (
                                <div key={g._id} 
                                    onClick={() => fetchGroupMessages(g)}
                                    className={`bg-white border rounded-3xl p-6 cursor-pointer hover:shadow-md transition-all ${selectedGroup?._id === g._id ? 'border-[#c5a059] bg-[#fdfaf5]' : 'border-[#ede3d4]'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${
                                            g.type === 'general' ? 'bg-emerald-50 border border-emerald-100' :
                                            g.type === 'dm' ? 'bg-blue-50 border border-blue-100' :
                                            'bg-[#1A120B] border border-[#D4AF37]/20'
                                        }`}>
                                            {g.type === 'general' ? '🌐' : g.type === 'dm' ? '💬' : '#'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-black text-[#1A120B] uppercase italic text-sm truncate">{g.name.replace('DM:','').trim()}</h3>
                                            <p className="text-[9px] text-[#8a7564] uppercase font-bold">{g.type} · {g.members?.length || 0} members</p>
                                        </div>
                                    </div>
                                    {g.lastMessage && (
                                        <div className="bg-[#f5efea] rounded-2xl px-4 py-3">
                                            <p className="text-[9px] font-black text-[#c5a059] uppercase">{g.lastMessageBy}</p>
                                            <p className="text-xs text-[#6b5a4a] font-medium mt-0.5 truncate">{g.lastMessage}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {selectedGroup && (
                            <div className="lg:col-span-3 space-y-4">
                                <div className="bg-white border border-[#ede3d4] rounded-3xl overflow-hidden shadow-sm flex flex-col h-[600px]">
                                    <div className="bg-[#1A120B] px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
                                                <MessageCircle size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black text-sm uppercase italic">{selectedGroup.name.replace('DM:','').trim()}</h3>
                                                <p className="text-[#c5a059] text-[9px] font-bold uppercase tracking-widest">{selectedGroup.type} Registry Monitor</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedGroup(null)} className="text-white/40 hover:text-white transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fdf9f4]">
                                        {loading ? (
                                            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /></div>
                                        ) : groupMessages.length === 0 ? (
                                            <div className="text-center py-20 text-slate-400 text-sm italic font-bold">No message history detected in this node.</div>
                                        ) : groupMessages.map((m, i) => (
                                            <div key={i} className={`flex flex-col ${m.senderName === user.fullName ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className="text-[9px] font-black text-[#1a120b] uppercase italic">{m.senderName}</span>
                                                    <span className="text-[8px] text-slate-400 font-bold">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs font-medium shadow-sm ${
                                                    m.senderName === user.fullName 
                                                    ? 'bg-[#1a120b] text-white rounded-tr-none' 
                                                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                                }`}>
                                                    {m.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ANALYTICS TAB ── */}
                {tab === 'analytics' && analytics && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <StatCard label="Total Users" value={analytics.overview.totalUsers} icon={Users} />
                            <StatCard label="Students" value={analytics.overview.activeStudents} icon={User} color="#10b981" />
                            <StatCard label="Teachers" value={analytics.overview.totalTeachers} icon={Users} color="#3b82f6" />
                            <StatCard label="Exam Sessions" value={analytics.overview.examSessions} icon={BookOpen} color="#8b5cf6" />
                            <StatCard label="Messages Sent" value={analytics.overview.messages} icon={MessageSquare} color="#D4AF37" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Activity by Day */}
                            <div className="bg-white border border-[#ede3d4] rounded-3xl p-6 shadow-sm">
                                <h3 className="font-black text-[#1A120B] uppercase italic text-sm mb-4">Activity (Last 7 Days)</h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics.activityByDay}>
                                            <defs>
                                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e8da" />
                                            <XAxis dataKey="_id" tick={{ fontSize: 9, fill: '#a89282', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 9, fill: '#a89282', fontWeight: 900 }} axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="count" stroke="#D4AF37" fill="url(#grad)" strokeWidth={2.5} dot={{ fill: '#D4AF37', r: 3 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Action Breakdown */}
                            <div className="bg-white border border-[#ede3d4] rounded-3xl p-6 shadow-sm">
                                <h3 className="font-black text-[#1A120B] uppercase italic text-sm mb-4">Top Actions (Last 30 Days)</h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analytics.actionBreakdown.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0e8da" />
                                            <XAxis type="number" tick={{ fontSize: 9, fill: '#a89282' }} axisLine={false} tickLine={false} />
                                            <YAxis dataKey="_id" type="category" tick={{ fontSize: 8, fill: '#a89282', fontWeight: 900 }} axisLine={false} tickLine={false} width={90}
                                                tickFormatter={v => v?.replace(/_/g,' ') || ''} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#D4AF37" radius={[0,4,4,0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity list */}
                        <div className="bg-white border border-[#ede3d4] rounded-3xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-[#f0e8da]">
                                <h3 className="font-black text-[#1A120B] uppercase italic text-sm">Recent Activity (Last 7 Days)</h3>
                            </div>
                            <div className="divide-y divide-[#f0e8da] max-h-72 overflow-y-auto">
                                {analytics.recentActivity.map(log => (
                                    <div key={log._id} className="flex items-center gap-4 px-6 py-3 hover:bg-[#fdf9f4] transition-all">
                                        <ActionBadge action={log.action} />
                                        <p className="font-black text-xs text-[#1A120B] uppercase italic flex-shrink-0">{log.userName}</p>
                                        <p className="text-[10px] text-[#a89282] truncate flex-1">{log.messagePreview || '—'}</p>
                                        <span className="text-[9px] text-[#c4b09a] font-bold flex-shrink-0">
                                            {new Date(log.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminActivityMonitor;
