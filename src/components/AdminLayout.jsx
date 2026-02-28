import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, GraduationCap, FileQuestion, ClipboardCheck,
    LogOut, Menu, X, Settings, UserCheck,
    MessageSquare, ChevronRight, Activity, Clock, TrendingUp
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const AdminLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { socket } = useSocket();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { path: '/school/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/school/approvals', label: 'Approvals', icon: UserCheck },
        { path: '/school/teachers', label: 'Teachers', icon: Users },
        { path: '/school/students', label: 'Students', icon: GraduationCap },
        { path: '/school/exams', label: 'Exams', icon: FileQuestion },
        { path: '/school/results', label: 'Results', icon: ClipboardCheck },
        { path: '/school/analytics', label: 'Analytics', icon: TrendingUp },
        { path: '/school/attendance', label: 'Attendance', icon: Clock },
        { path: '/school/activity', label: 'Audit Log', icon: Activity },
        { path: '/school/community', label: 'Community', icon: MessageSquare },
        { path: '/school/settings', label: 'Settings', icon: Settings },
    ];

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const currentLabel = menuItems.find(i => i.path === location.pathname)?.label || 'Intelligence Hub';

    const copyInviteLink = (type) => {
        let link = '';
        if (type === 'teacher') {
            link = `${window.location.origin}/#/signup/teacher?schoolId=${user?.schoolId || ''}`;
        } else {
            link = `${window.location.origin}/#/signup/student?schoolRefId=${user?.schoolRefId || ''}`;
        }
        navigator.clipboard.writeText(link);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} access token copied!`, {
            style: {
                background: '#1a120b',
                color: '#c5a059',
                borderRadius: '1rem',
                fontSize: '11px',
                fontWeight: '900',
                border: '1px solid rgba(197, 160, 89, 0.2)'
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex font-outfit text-[#1a150e]">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-[#1a150e]/60 backdrop-blur-sm md:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Side Navigation */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col
                bg-white border-r border-slate-100 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)]
                transform transition-all duration-500 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Branding Core */}
                <div className="p-8 border-b border-slate-50 relative group">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#1a120b] flex items-center justify-center border border-[#c5a059]/10 shadow-xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                             {user?.schoolLogo ? (
                                <img src={user.schoolLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Activity size={20} className="text-[#c5a059]" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[15px] font-black text-[#1a150e] truncate uppercase tracking-tighter italic leading-none mb-1.5">
                                {user?.schoolName || 'KICC CBT'}
                            </h2>
                            <span className="text-[9px] font-black text-[#c5a059] uppercase tracking-[0.3em]">Institutional Node</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-8 right-6 text-slate-300 hover:text-rose-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Primary Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-4 custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`
                                    flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black tracking-[0.1em] transition-all relative group uppercase italic
                                    ${isActive 
                                        ? 'bg-[#1a120b] text-[#c5a059] shadow-2xl shadow-black/10' 
                                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#1a150e]'}
                                `}
                            >
                                <Icon size={18} className={`${isActive ? 'text-[#c5a059]' : 'text-slate-300 group-hover:text-[#c5a059]'} transition-colors duration-300`} />
                                {item.label}
                                {isActive && (
                                    <div className="absolute right-4 w-1.5 h-1.5 bg-[#c5a059] rounded-full shadow-[0_0_12px_#c5a059]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Identity Module */}
                <div className="p-6 border-t border-slate-50 bg-[#fcfbf9]/50 space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm relative group cursor-pointer">
                             <span className="text-[12px] font-black text-[#c5a059] uppercase italic">{user?.fullName?.charAt(0) || 'A'}</span>
                             <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] font-black text-[#1a150e] truncate uppercase italic leading-none mb-1.5">{user?.fullName || 'Admin'}</p>
                            <p className="text-[8px] font-black text-[#c5a059]/60 uppercase tracking-widest bg-[#c5a059]/5 px-2 py-0.5 rounded-lg border border-[#c5a059]/10">
                                Authority Active
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full h-14 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-[1.25rem] transition-all text-[10px] font-black uppercase tracking-[0.15em] border border-slate-100 hover:border-rose-500 shadow-sm group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Close Registry
                    </button>
                </div>
            </aside>

            {/* Global Interface */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden md:ml-[280px]">
                <header className="sticky top-0 z-30 border-b border-slate-50 bg-white/70 backdrop-blur-2xl px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-[#1a150e] hover:text-[#c5a059] transition-all p-1 active:scale-95">
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                <Activity size={14} className="text-[#c5a059]/50" />
                                <span>Network</span>
                                <ChevronRight size={12} className="text-slate-200" />
                                <span className="text-[#1a150e] italic underline decoration-[#c5a059]/30 underline-offset-4 decoration-2">{currentLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => copyInviteLink('teacher')}
                            className="hidden sm:flex items-center gap-2.5 h-11 px-5 text-[10px] font-black uppercase tracking-widest text-[#c5a059] bg-[#c5a059]/5 border border-[#c5a059]/10 rounded-xl hover:bg-[#c5a059]/10 transition-all active:scale-95"
                        >
                            <Users size={16} /> Invite Faculty
                        </button>
                        <button
                            onClick={() => copyInviteLink('student')}
                            className="hidden sm:flex items-center gap-2.5 h-11 px-5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-500/10 rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-sm"
                        >
                            <GraduationCap size={16} /> Add Candidate
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-10 lg:p-12 custom-scrollbar scroll-smooth">
                    {children}
                </main>
            </div>

        </div>
    );
};

export default AdminLayout;
