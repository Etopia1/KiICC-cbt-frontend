import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckCircle, BarChart2, Bell, Settings, LogOut, Menu, X, UserCheck, BookOpen, Clock, Table, Users, ChevronRight, Activity, TrendingUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import axios from 'axios';
import { useAutoLogout } from '../hooks/useAutoLogout';
import { useSocket } from '../context/SocketContext';

const TeacherLayout = ({ children }) => {
    const { user: authUser, token } = useSelector((state) => state.auth);
    const { socket } = useSocket();
    const [user, setUser] = useState(authUser);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    // Auto-logout after 20 minutes of inactivity
    useAutoLogout(true);

    useEffect(() => {
        if (token) fetchProfile();
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('https://educbt-pro-backend.onrender.com/school/teacher/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (error) {
            console.error("Profile fetch error:", error);
        }
    };

    const navLinks = [
        { path: '/teacher/dashboard',         label: 'Dashboard',       icon: LayoutDashboard },
        { path: '/teacher/tests',              label: 'My Exams',        icon: BookOpen },
        { path: '/teacher/analytics',          label: 'Analytics',       icon: TrendingUp },
        { path: '/teacher/grading',            label: 'Grading',         icon: CheckCircle },
        { path: '/teacher/results',            label: 'Results',         icon: BarChart2 },
        { path: '/teacher/attendance',         label: 'Attendance',      icon: UserCheck },
        { path: '/staff/attendance',           label: 'Staff Attend.',   icon: Clock },
        { path: '/teacher/student-records',    label: 'Student Records', icon: Table },
        { path: '/teacher/community',          label: 'Community',       icon: Users },
        { path: '/teacher/settings',           label: 'Settings',        icon: Settings },
    ];

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const currentLabel = navLinks.find(i => location.pathname.startsWith(i.path))?.label || 'Overview';

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
                bg-white border-r border-slate-50 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)]
                transform transition-all duration-500 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Branding Section */}
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
                            <span className="text-[9px] font-black text-[#c5a059] uppercase tracking-[0.3em]">Digital faculty</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-8 right-6 text-slate-300 hover:text-rose-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Primary Links */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-4 custom-scrollbar">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`
                                    flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black tracking-[0.1em] transition-all relative group uppercase italic
                                    ${isActive 
                                        ? 'bg-[#1a120b] text-[#c5a059] shadow-2xl shadow-black/10' 
                                        : 'text-slate-400 hover:bg-slate-50 hover:text-[#1a150e]'}
                                `}
                            >
                                <Icon size={18} className={`${isActive ? 'text-[#c5a059]' : 'text-slate-300 group-hover:text-[#c5a059]'} transition-colors duration-300`} />
                                {link.label}
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
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm relative group cursor-pointer transition-transform hover:scale-110">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <span className="text-[12px] font-black text-[#c5a059] uppercase italic">{user?.fullName?.charAt(0) || 'T'}</span>
                            )}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] font-black text-[#1a150e] truncate uppercase italic leading-none mb-1.5">{user?.fullName || 'Teacher'}</p>
                            <p className="text-[8px] font-black text-[#c5a059]/60 uppercase tracking-widest bg-[#c5a059]/5 px-2 py-0.5 rounded-lg border border-[#c5a059]/10">
                                Faculty active
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-3 w-full h-14 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-[1.25rem] transition-all text-[10px] font-black uppercase tracking-[0.15em] border border-slate-100 hover:border-rose-500 shadow-sm group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Exit Session
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
                                <span>Academic Command</span>
                                <ChevronRight size={12} className="text-slate-200" />
                                <span className="text-[#1a150e] italic underline decoration-[#c5a059]/30 underline-offset-4 decoration-2">{currentLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="w-11 h-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#c5a059] hover:border-[#c5a059]/20 transition-all relative shadow-sm group active:scale-95">
                            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#c5a059] rounded-full border-2 border-white animate-pulse"></span>
                        </button>
                        <Link to="/teacher/tests/create" className="hidden sm:flex btn-primary h-11 px-6 rounded-xl shadow-lg shadow-black/5">
                            + Initialize Script
                        </Link>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-10 lg:p-12 custom-scrollbar scroll-smooth font-outfit">
                    {children}
                </main>
            </div>

        </div>
    );
};

export default TeacherLayout;
