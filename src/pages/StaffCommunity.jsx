import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
    setConversations as setReduxConvs, 
    updateConversationPreview, 
    incrementUnread, 
    clearUnread 
} from '../redux/chatSlice';
import TeacherLayout from '../components/TeacherLayout';
import AdminLayout from '../components/AdminLayout';
import { encryptMessage, decryptMessage } from '../utils/crypto';
import EmojiPicker from 'emoji-picker-react';
import {
    Send, Paperclip, Phone, Video, Search, Plus, X, Check, CheckCheck,
    MoreVertical, ArrowLeft, Hash, Users, MessageSquare, Globe,
    Mic, Lock, FileText, Smile, Shield, ChevronRight, BookOpen, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const API = 'https://educbt-pro-backend.onrender.com';

const StaffCommunity = () => {
    const { token, user } = useSelector(s => s.auth);
    const isTeacher = user?.role === 'teacher';
    const Layout = isTeacher ? TeacherLayout : AdminLayout;
    const schoolId = user?.schoolId;
    const headers = { Authorization: `Bearer ${token}` };

    // ── Socket & Calls ──
    const { socket, startCall: initiateCall } = useSocket();

    const { conversations, unreadMap } = useSelector(s => s.chat);
    const dispatch = useDispatch();

    // ── Conversations & Messages ──
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);

    // ── Staff ──
    const [staff, setStaff] = useState([]);

    // ── Input ──
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);

    // ── UI state ──
    const [view, setView] = useState('chats'); // chats, groups, search, newchat, calls
    const [ongoingCalls, setOngoingCalls] = useState([]);
    const [callHistory, setCallHistory] = useState([]);
    const [search, setSearch] = useState('');
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // ── Group creation ──
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);

    const fileRef = useRef(null);
    const msgEndRef = useRef(null);
    const inputRef = useRef(null);

    // ─────────────────────────────────────────────
    // Socket initialisation
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        // Incoming message
        socket.on('new_message', async (msg) => {
            const dec = await decryptMessage(msg.content, schoolId).catch(() => msg.content);
            const decMsg = { ...msg, content: dec };
            
            // Only update messages list if it's the active chat
            setMessages(prev => {
                if (prev.some(m => m._id === msg._id)) return prev;
                // If it's NOT the active conv, we don't push it to the list (it will load when opened)
                // but we might want to if we are already viewing it.
                // However, the main goal is to update the preview and counts.
                return [...prev, decMsg];
            });

            if (String(msg.senderId) !== String(user?._id)) {
                dispatch(incrementUnread(msg.groupId));
            }

            dispatch(updateConversationPreview({
                groupId: msg.groupId,
                content: msg.content?.substring(0, 60),
                senderName: msg.senderName,
                updatedAt: new Date().toISOString()
            }));
        });

        socket.on('account_action', ({ message }) => toast.error(message, { duration: 8000 }));

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            socket.off('new_message');
            socket.off('account_action');
        };
    }, [socket, user?._id, schoolId]);

    // ─────────────────────────────────────────────
    // Initial data fetch
    // ─────────────────────────────────────────────
    useEffect(() => {
        if (token) { 
            fetchConversations(); 
            fetchStaff(); 
            fetchOngoingCalls();
            fetchCallHistory();
        }
    }, [token]);

    useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Close emoji on outside click
    useEffect(() => {
        if (!showEmoji) return;
        const handler = () => setShowEmoji(false);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [showEmoji]);

    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${API}/chat/groups`, { headers });
            dispatch(setReduxConvs(res.data.sort((a, b) =>
                new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
            )));
        } catch (e) { console.error(e); }
    };

    const fetchStaff = async () => {
        try {
            const res = await axios.get(`${API}/chat/staff`, { headers });
            setStaff(res.data);
        } catch {
            toast.error('Network failure in faculty registry synchronisation');
        }
    };

    const fetchOngoingCalls = async () => {
        try {
            const res = await axios.get(`${API}/school/calls/ongoing`, { headers });
            setOngoingCalls(res.data);
        } catch (err) { console.error('Error fetching ongoing calls:', err); }
    };

    const fetchCallHistory = async () => {
        try {
            const res = await axios.get(`${API}/school/calls/history`, { headers });
            setCallHistory(res.data);
        } catch (err) { console.error('Error fetching call history:', err); }
    };

    // ─────────────────────────────────────────────
    // Open conversation / load messages
    // ─────────────────────────────────────────────
    const openConversation = useCallback(async (conv) => {
        console.log('[CHAT] Opening conversation:', conv._id, conv.name);
        if (activeConv?._id === conv._id) return;
        if (activeConv && socket) {
            console.log('[CHAT] Leaving old group:', activeConv._id);
            socket.emit('leave_chat_group', activeConv._id);
        }
        setActiveConv(conv);
        setMessages([]);
        setMobileShowChat(true);
        setView('chats');
        setLoadingMsgs(true);
        dispatch(clearUnread(conv._id));
        if (socket) {
            console.log('[CHAT] Joining new group:', conv._id);
            socket.emit('join_chat_group', conv._id);
        }
        try {
            const res = await axios.get(`${API}/chat/groups/${conv._id}/messages`, { headers });
            const decrypted = await Promise.all(res.data.map(async m => ({
                ...m,
                content: await decryptMessage(m.content, schoolId).catch(() => m.content)
            })));
            setMessages(decrypted);
            console.log(`[CHAT] Loaded ${res.data.length} messages`);
        } catch (err) { 
            console.error('[CHAT] Load messages error:', err);
            toast.error('Could not load messages'); 
        }
        finally { setLoadingMsgs(false); setTimeout(() => inputRef.current?.focus(), 100); }
    }, [activeConv, socket, schoolId, headers]);

    // ─────────────────────────────────────────────
    // Send message
    // ─────────────────────────────────────────────
    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!text.trim() && attachments.length === 0) return;
        if (!activeConv) return;
        const rawText = text;
        const rawAtts = [...attachments];
        setText('');
        setAttachments([]);
        setSending(true);
        try {
            const encrypted = await encryptMessage(rawText, schoolId).catch(() => rawText);
            await axios.post(`${API}/chat/groups/${activeConv._id}/messages`, {
                content: encrypted,
                attachments: rawAtts
            }, { headers });
        } catch {
            toast.error('Failed to send');
            setText(rawText);
            setAttachments(rawAtts);
        } finally { setSending(false); }
    };

    const startDM = async (targetUser) => {
        console.log('[CHAT] Starting DM with:', targetUser.fullName, targetUser._id);
        try {
            const res = await axios.post(`${API}/chat/dm`, { targetUserId: targetUser._id }, { headers });
            console.log('[CHAT] DM Response:', res.data);
            const exists = conversations.find(c => c._id === res.data._id);
            if (!exists) {
                dispatch(setReduxConvs([res.data, ...conversations]));
            }
            openConversation(res.data);
        } catch (err) { 
            console.error('[CHAT] startDM Error:', err.response?.data || err.message);
            toast.error('Could not open DM'); 
        }
    };

    // ─────────────────────────────────────────────
    // Create group
    // ─────────────────────────────────────────────
    const createGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return;
        try {
            await axios.post(`${API}/chat/groups`, {
                name: groupName,
                description: groupDesc,
                memberIds: groupMembers.map(m => m._id)
            }, { headers });
            toast.success(`#${groupName} created!`);
            setGroupName(''); setGroupDesc(''); setGroupMembers([]);
            setView('chats');
            fetchConversations();
        } catch { toast.error('Failed to create group'); }
    };

    // ─────────────────────────────────────────────
    // File upload
    // ─────────────────────────────────────────────
    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await axios.post(`${API}/chat/upload`, fd, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            setAttachments(prev => [...prev, res.data]);
        } catch { toast.error('Upload failed'); }
        finally { setUploading(false); e.target.value = null; }
    };

    // ─────────────────────────────────────────────
    // Initiate call
    // ─────────────────────────────────────────────
    const startCall = (targetUser, callType) => {
        initiateCall(targetUser, callType, false);
    };
 
    const startGroupCall = (conv, callType) => {
        const memberIds = (conv.members || [])
            .map(m => m._id || m)
            .filter(id => String(id) !== String(user?._id));
        if (memberIds.length === 0) return toast.error('No other members in group');
        
        initiateCall({ ...conv, memberIds }, callType, true);
    };

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    // Resolve the other person in a DM from members array or staff list
    const getDMOther = useCallback((c) => {
        if (!c || c.type !== 'dm') return null;
        // Try populated members first
        const fromMembers = c.members?.find(m => {
            const id = m._id || m;
            return String(id) !== String(user?._id);
        });
        if (fromMembers && fromMembers.fullName) return fromMembers;
        // Fallback: look up in staff list by member ID
        const otherId = (c.members || []).find(m => String(m._id || m) !== String(user?._id));
        if (otherId) {
            const found = staff.find(s => String(s._id) === String(otherId._id || otherId));
            if (found) return found;
        }
        // Last resort: parse from name field
        const parsedName = c.name?.replace(/^DM:\s*/, '').trim();
        return parsedName ? { fullName: parsedName } : null;
    }, [user?._id, staff]);

    const convName = useCallback((c) => {
        if (!c) return 'Chat';
        if (c.type === 'dm') {
            const other = getDMOther(c);
            return other?.fullName || 'Direct Message';
        }
        return c.name || '';
    }, [getDMOther]);

    const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);
    const formatTime = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDay = d => {
        const dt = new Date(d); const today = new Date();
        if (dt.toDateString() === today.toDateString()) return 'Today';
        if ((today - dt) < 172800000) return 'Yesterday';
        return dt.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const groupedMsgs = messages.reduce((acc, m) => {
        const d = formatDay(m.createdAt);
        if (!acc[d]) acc[d] = [];
        acc[d].push(m);
        return acc;
    }, {});

    const filteredConvs = conversations.filter(c => {
        if (!c) return false;
        const name = convName(c) || '';
        return name.toLowerCase().includes(search.toLowerCase());
    });

    const staffSearch = search && view === 'newchat'
        ? staff.filter(s => s.fullName?.toLowerCase().includes(search.toLowerCase()))
        : staff;

    // Resolve DM target person for calls / header
    const dmOtherPerson = activeConv?.type === 'dm' ? getDMOther(activeConv) : null;
    // Build a call-able target object from the dm other person
    const dmCallTarget = dmOtherPerson
        ? (staff.find(s => s.fullName === dmOtherPerson.fullName) || { ...dmOtherPerson, _id: dmOtherPerson._id })
        : null;

    // Avatar initials helper
    const initials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0][0].toUpperCase();
    };

    // Role label prettifier
    const roleLabel = (role) => {
        if (!role) return '';
        return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <Layout>
            <div className="flex h-[calc(100vh-90px)] overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 bg-white">

                {/* ════════════════════════════
                        SIDEBAR
                ════════════════════════════ */}
                <aside className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-[340px] shrink-0 flex-col bg-[#0F0D0A] border-r border-white/5`}>

                    {/* Top */}
                    <div className="px-5 pt-6 pb-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-white font-black text-xl uppercase italic tracking-tight">Staff Hub</h1>
                                    {totalUnread > 0 && (
                                        <span className="bg-[#D4AF37] text-[#1A120B] text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Shield size={9} className="text-[#D4AF37]" />
                                    <span className="text-[#D4AF37]/40 text-[8px] font-black uppercase tracking-[0.3em]">End-to-End Encrypted</span>
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => { setView(v => v === 'newgroup' ? 'chats' : 'newgroup'); setSearch(''); }}
                                    title="New Group"
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${view === 'newgroup' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                                    <Users size={16} />
                                </button>
                                <button onClick={() => { setView(v => v === 'newchat' ? 'chats' : 'newchat'); setSearch(''); }}
                                    title="New Message"
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${view === 'newchat' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                            <input type="text" placeholder={view === 'newchat' ? 'Search staff...' : 'Search conversations...'}
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 focus:border-[#D4AF37]/25 rounded-xl text-white text-xs font-medium placeholder:text-white/20 outline-none transition-all" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">

                        {/* ── New Group ── */}
                        {view === 'newgroup' && (
                            <form onSubmit={createGroup} className="p-3 space-y-3">
                                <p className="text-[9px] font-black text-white/25 uppercase tracking-widest px-2">Create Group</p>
                                <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 focus-within:border-[#D4AF37]/25 rounded-xl px-3.5 py-2.5">
                                    <Hash size={13} className="text-white/30" />
                                    <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                                        placeholder="Group name..." required
                                        className="bg-transparent flex-1 outline-none text-sm font-bold text-white placeholder:text-white/20" />
                                </div>
                                <input type="text" value={groupDesc} onChange={e => setGroupDesc(e.target.value)}
                                    placeholder="Description (optional)"
                                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/8 rounded-xl text-xs text-white placeholder:text-white/20 outline-none" />
                                <p className="text-[9px] font-black text-white/25 uppercase tracking-widest px-2 pt-1">Add Members</p>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                    {staff.map(s => {
                                        const sel = groupMembers.some(m => m._id === s._id);
                                        return (
                                            <button key={s._id} type="button"
                                                onClick={() => setGroupMembers(prev => sel ? prev.filter(m => m._id !== s._id) : [...prev, s])}
                                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all border ${sel ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20' : 'bg-white/3 border-transparent hover:bg-white/5'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${sel ? 'bg-[#D4AF37] text-[#1A120B]' : 'bg-white/10 text-white/60'}`}>
                                                    {s.fullName?.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className={`text-xs font-black truncate ${sel ? 'text-[#D4AF37]' : 'text-white/60'}`}>{s.fullName}</p>
                                                    <p className="text-[9px] text-white/25 capitalize">{s.role?.replace('_', ' ')}</p>
                                                </div>
                                                {sel && <Check size={13} className="text-[#D4AF37] shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button type="submit" className="w-full py-4 bg-[#D4AF37] rounded-xl text-[#1A120B] font-black text-[10px] uppercase tracking-widest hover:bg-[#c9a427] transition-all flex items-center justify-center gap-2">
                                    <Plus size={14} /> Create New Group ({groupMembers.length})
                                </button>
                            </form>
                        )}

                        {/* ── Call Center (Ongoing & History) ── */}
                        {view === 'calls' && (
                            <div className="flex flex-col h-full animate-fade-in">
                                {/* Ongoing Section */}
                                {ongoingCalls.length > 0 && (
                                    <div className="p-4 space-y-3">
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            Ongoing Cognitive Sessions
                                        </p>
                                        <div className="space-y-2">
                                            {ongoingCalls.map(call => (
                                                <div key={call.roomId} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-black">
                                                            {call.callerName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-white text-xs font-black uppercase italic truncate">{call.callerName}</p>
                                                            <p className="text-white/30 text-[9px] font-bold uppercase">{call.callType === 'video' ? 'Video' : 'Audio'}{call.isGroup ? ' Group' : ''} Call</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => initiateCall(call, call.callType, call.isGroup)}
                                                        className="px-4 py-2 bg-emerald-500 text-[#1A120B] text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg shadow-emerald-500/20"
                                                    >
                                                        Join
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* History Section */}
                                <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-4 mt-2">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Call History</p>
                                    {callHistory.length === 0 ? (
                                        <div className="py-20 text-center space-y-3">
                                            <Phone size={32} className="text-white/5 mx-auto" />
                                            <p className="text-white/20 text-xs font-bold uppercase tracking-widest">No Recent Calls</p>
                                        </div>
                                    ) : (
                                        callHistory.map(log => (
                                            <div key={log._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 font-black text-xs">
                                                        {log.callerName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-white/80 text-[11px] font-bold truncate">{log.callerName}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            {log.callType === 'video' ? <Video size={9} className="text-blue-400" /> : <Mic size={9} className="text-[#D4AF37]" />}
                                                            <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">
                                                                {new Date(log.startedAt).toLocaleDateString()} · {log.duration ? `${Math.floor(log.duration/60)}:${String(log.duration%60).padStart(2,'0')}` : 'Missed'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => initiateCall({ _id: log.callerId, fullName: log.callerName }, log.callType)}
                                                    className="p-2.5 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all">
                                                    {log.callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── New Chat (Staff Directory) ── */}
                        {view === 'newchat' && (
                            <div>
                                <p className="text-[9px] font-black text-white/25 uppercase tracking-widest px-5 py-2">Faculty</p>
                                {staffSearch.map(s => (
                                    <div key={s._id} onClick={() => { startDM(s); setView('chats'); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer">
                                        <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-black text-lg shrink-0">
                                            {s.fullName?.charAt(0)}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-white text-sm font-black uppercase italic truncate">{s.fullName}</p>
                                            <p className="text-white/30 text-[10px] font-bold capitalize">{s.role?.replace('_', ' ')}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {s.info?.classLevel && (
                                                    <span className="text-[8px] font-black text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                                        {s.info.classLevel}
                                                    </span>
                                                )}
                                                {(s.info?.subjects || []).slice(0, 2).map(sub => (
                                                    <span key={sub} className="text-[8px] font-black text-[#D4AF37]/60 bg-[#D4AF37]/10 px-1.5 py-0.5 rounded-md">
                                                        {sub}
                                                    </span>
                                                ))}
                                                {(s.info?.subjects?.length || 0) > 2 && (
                                                    <span className="text-[8px] text-white/20">+{s.info.subjects.length - 2}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                            <button onClick={e => { e.stopPropagation(); initiateCall(s, 'voice'); }}
                                                className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center" title="Voice call">
                                                <Phone size={13} />
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); initiateCall(s, 'video'); }}
                                                className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center" title="Video call">
                                                <Video size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Conversations List ── */}
                        {view === 'chats' && (
                            <>
                                {filteredConvs.length === 0 ? (
                                    <div className="py-16 text-center space-y-3">
                                        <MessageSquare size={28} className="text-white/10 mx-auto" />
                                        <p className="text-white/20 text-xs font-bold">No conversations yet</p>
                                        <button onClick={() => setView('newchat')}
                                            className="text-[#D4AF37]/60 text-[10px] font-black uppercase hover:text-[#D4AF37]">
                                            Start one →
                                        </button>
                                    </div>
                                ) : filteredConvs.map(conv => {
                                    const isAct = activeConv?._id === conv._id;
                                    const unread = unreadMap[conv._id] || 0;
                                    return (
                                        <div key={conv._id} onClick={() => openConversation(conv)}
                                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer ${isAct ? 'bg-[#D4AF37]/10' : 'hover:bg-white/4'}`}>
                                            <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-black text-base border ${
                                                conv.type === 'dm' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                                : conv.type === 'general' ? 'bg-emerald-500/10 border-emerald-500/20 text-xl'
                                                : `bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]`
                                            }`}>
                                                {conv.type === 'general' ? '🌐' : conv.type === 'dm' ? (convName(conv) || '?').charAt(0).toUpperCase() : <Hash size={18} />}
                                                {unread > 0 && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#D4AF37] text-[#1A120B] text-[8px] font-black rounded-full flex items-center justify-center">
                                                        {unread > 9 ? '9+' : unread}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-black uppercase italic truncate ${isAct ? 'text-[#D4AF37]' : 'text-white'}`}>
                                                        {convName(conv)}
                                                    </p>
                                                    {conv.lastMessageAt && (
                                                        <span className="text-[9px] text-white/20 font-bold shrink-0">{formatTime(conv.lastMessageAt)}</span>
                                                    )}
                                                </div>
                                                {conv.lastMessage ? (
                                                    <p className={`text-[11px] truncate mt-0.5 ${unread > 0 ? 'text-[#D4AF37]/80 font-bold' : 'text-white/25 font-medium'}`}>
                                                        {conv.lastMessageBy ? `${conv.lastMessageBy.split(' ')[0]}: ` : ''}{conv.lastMessage}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-white/15 italic mt-0.5">No messages yet</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Me bar */}
                    <div className="px-4 py-3.5 border-t border-white/5 flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-black text-base">
                                {user?.fullName?.charAt(0)}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0F0D0A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-black uppercase italic truncate">{user?.fullName}</p>
                            <p className="text-[9px] text-white/25 font-bold capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                        <Shield size={13} className="text-[#D4AF37]/25" />
                        <NavBtn icon={Phone} label="Calls" active={view === 'calls'} onClick={() => setView('calls')} />
                    </div>
                </aside>

                {/* ════════════════════════════
                        CHAT AREA
                ════════════════════════════ */}
                <main className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#FAFAF8] min-w-0`}>

                    {activeConv ? (
                        <>
                            {/* Header */}
                            <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-100 shrink-0 shadow-sm">
                                <button className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-50 text-slate-400"
                                    onClick={() => setMobileShowChat(false)}>
                                    <ArrowLeft size={20} />
                                </button>

                                {/* Avatar */}
                                {activeConv.type === 'dm' ? (
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-black text-white shadow-md"
                                            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                            {initials(dmOtherPerson?.fullName)}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
                                    </div>
                                ) : activeConv.type === 'general' ? (
                                    <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-xl bg-emerald-50 border-2 border-emerald-100">
                                        🌐
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-black bg-[#1A120B] text-[#D4AF37] border-2 border-[#D4AF37]/20">
                                        <Hash size={20} />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h2 className="font-black text-[#1A120B] tracking-tight truncate text-base leading-tight">
                                        {convName(activeConv)}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        {activeConv.type === 'dm' && dmOtherPerson?.role && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#a87e2a] border border-[#D4AF37]/20">
                                                {roleLabel(dmOtherPerson.role)}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                {activeConv.type === 'general' ? 'All Staff · Active'
                                                 : activeConv.type === 'dm' ? 'Online'
                                                 : `${activeConv.members?.length || 0} Members`}
                                            </p>
                                        </div>
                                        <Lock size={9} className="text-[#D4AF37]" />
                                    </div>
                                    {/* Extra info badges for DM target */}
                                    {activeConv.type === 'dm' && dmOtherPerson?.info && (
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            {dmOtherPerson.info.classLevel && (
                                                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                    {dmOtherPerson.info.classLevel}
                                                </span>
                                            )}
                                            {(dmOtherPerson.info.subjects || []).slice(0, 3).map(sub => (
                                                <span key={sub} className="text-[8px] font-black text-[#a87e2a] bg-[#D4AF37]/10 border border-[#D4AF37]/15 px-2 py-0.5 rounded-full">{sub}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Call buttons */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {activeConv.type === 'dm' && dmCallTarget && (
                                        <>
                                            <button onClick={() => startCall(dmCallTarget, 'voice')}
                                                className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center shadow-sm" title="Voice call">
                                                <Phone size={17} />
                                            </button>
                                            <button onClick={() => startCall(dmCallTarget, 'video')}
                                                className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center shadow-sm" title="Video call">
                                                <Video size={17} />
                                            </button>
                                        </>
                                    )}
                                    {(activeConv.type === 'group' || activeConv.type === 'general') && (
                                        <>
                                            <button onClick={() => startGroupCall(activeConv, 'voice')}
                                                className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-100 transition-all flex items-center justify-center shadow-sm" title="Group voice call">
                                                <Phone size={17} />
                                            </button>
                                            <button onClick={() => startGroupCall(activeConv, 'video')}
                                                className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center shadow-sm" title="Group video call">
                                                <Video size={17} />
                                            </button>
                                        </>
                                    )}
                                    <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-100 transition-all flex items-center justify-center">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </header>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-6 py-6"
                                style={{ backgroundImage: 'radial-gradient(circle, #e0dcd6 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                                {loadingMsgs ? (
                                    <div className="flex justify-center py-20">
                                        <div className="w-10 h-10 border-4 border-[#D4AF37]/15 border-t-[#D4AF37] rounded-full animate-spin" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                                        <div className="w-20 h-20 rounded-4xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                            <Lock size={28} className="text-[#D4AF37]" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[#1A120B] uppercase italic">Encrypted Chat</h3>
                                            <p className="text-slate-400 text-sm mt-1">Messages are secured with AES-256 encryption.</p>
                                            <p className="text-slate-300 text-xs mt-1">Be the first to say hi! 👋</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {Object.entries(groupedMsgs).map(([day, dayMsgs]) => (
                                            <div key={day}>
                                                {/* Date separator */}
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="h-px flex-1 bg-slate-200/60" />
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-white/90 rounded-full px-4 py-1.5 border border-slate-100 shadow-sm">{day}</span>
                                                    <div className="h-px flex-1 bg-slate-200/60" />
                                                </div>

                                                <div className="space-y-1.5">
                                                    {dayMsgs.map((msg, i) => {
                                                        const isMe = String(msg.senderId) === String(user?._id);
                                                        const prev = dayMsgs[i - 1];
                                                        const isCont = prev && String(prev.senderId) === String(msg.senderId);
                                                        return (
                                                            <div key={msg._id || i}
                                                                className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                {/* Avatar */}
                                                                {!isMe && (
                                                                    isCont
                                                                        ? <div className="w-8 shrink-0" />
                                                                        : <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black shrink-0">
                                                                            {msg.senderName?.charAt(0)}
                                                                          </div>
                                                                )}

                                                                <div className={`flex flex-col max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                                    {/* Sender name */}
                                                                    {!isMe && !isCont && activeConv.type !== 'dm' && (
                                                                        <p className="text-[9px] font-black text-slate-500 uppercase pl-1 mb-0.5">{msg.senderName}</p>
                                                                    )}
                                                                    {/* Bubble */}
                                                                    {msg.content && (
                                                                        <div className={`px-4 py-2.5 text-sm leading-relaxed font-medium break-all shadow-sm ${
                                                                            isMe
                                                                                ? 'bg-[#1A120B] text-white rounded-[1.3rem] rounded-br-sm'
                                                                                : 'bg-white text-[#1A120B] border border-slate-100 rounded-[1.3rem] rounded-bl-sm'
                                                                        }`}>
                                                                            {msg.content}
                                                                        </div>
                                                                    )}
                                                                    {/* Attachments */}
                                                                    {msg.attachments?.map((att, ai) =>
                                                                        att.type === 'image' ? (
                                                                            <img key={ai} src={att.url} alt={att.name}
                                                                                className="mt-1.5 max-w-[260px] rounded-2xl border border-slate-100 shadow-sm object-cover cursor-pointer"
                                                                                onClick={() => window.open(att.url)} />
                                                                        ) : (
                                                                            <a key={ai} href={att.url} target="_blank" rel="noreferrer"
                                                                                className="mt-1.5 flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl hover:border-[#D4AF37]/30 transition-all shadow-sm">
                                                                                <FileText size={15} className="text-[#D4AF37]" />
                                                                                <span className="text-xs font-bold text-[#1A120B] truncate max-w-[140px]">{att.name}</span>
                                                                            </a>
                                                                        )
                                                                    )}
                                                                    {/* Time + ticks */}
                                                                    <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                                        <span className="text-[9px] text-slate-300 font-medium">{formatTime(msg.createdAt)}</span>
                                                                        {isMe && <CheckCheck size={11} className="text-[#D4AF37]" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={msgEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Attachment previews */}
                            {attachments.length > 0 && (
                                <div className="flex gap-2 flex-wrap px-6 py-2 bg-white border-t border-slate-50">
                                    {attachments.map((att, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xl px-3 py-1.5">
                                            <FileText size={11} className="text-[#D4AF37]" />
                                            <span className="text-xs font-bold text-[#1A120B] max-w-[120px] truncate">{att.name}</span>
                                            <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}>
                                                <X size={11} className="text-slate-400 hover:text-rose-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Input bar */}
                            <div className="px-6 py-4 bg-white border-t border-slate-50 shrink-0 relative">
                                <form onSubmit={sendMessage} className="flex items-center gap-3">
                                    <input type="file" ref={fileRef} onChange={handleFile} className="hidden" />
                                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                                        className="w-11 h-11 rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/25 transition-all flex items-center justify-center shrink-0">
                                        {uploading ? <div className="w-4 h-4 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /> : <Paperclip size={18} />}
                                    </button>

                                    <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-100 focus-within:bg-white focus-within:border-[#D4AF37]/25 rounded-full px-5 py-2.5 transition-all shadow-inner relative">
                                        <input ref={inputRef} type="text" value={text}
                                            onChange={e => setText(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
                                            placeholder="Type a message…"
                                            className="flex-1 bg-transparent outline-none text-sm text-[#1A120B] font-medium placeholder:text-slate-300" />
                                        <button type="button" onClick={e => { e.stopPropagation(); setShowEmoji(v => !v); }}
                                            className={`text-slate-300 hover:text-[#D4AF37] transition-colors ${showEmoji ? 'text-[#D4AF37]' : ''}`}>
                                            <Smile size={18} />
                                        </button>
                                    </div>

                                    <button type="submit" disabled={sending || (!text.trim() && attachments.length === 0)}
                                        className="w-11 h-11 rounded-full bg-[#1A120B] text-[#D4AF37] hover:bg-black transition-all flex items-center justify-center shrink-0 shadow-xl shadow-[#1A120B]/15 disabled:opacity-30 active:scale-95">
                                        {sending ? <div className="w-4 h-4 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" /> : <Send size={18} />}
                                    </button>
                                </form>

                                {/* Emoji Picker */}
                                {showEmoji && (
                                    <div className="absolute bottom-20 right-6 z-50" onClick={e => e.stopPropagation()}>
                                        <EmojiPicker
                                            onEmojiClick={({ emoji }) => { setText(t => t + emoji); setShowEmoji(false); }}
                                            height={380} width={320} theme="light"
                                            searchDisabled={false} lazyLoadEmojis
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Welcome screen */
                        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12"
                            style={{ backgroundImage: 'radial-gradient(circle, #e0dcd6 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                            <div className="w-28 h-28 rounded-[3rem] bg-white border-2 border-[#D4AF37]/20 flex items-center justify-center shadow-2xl shadow-[#D4AF37]/10">
                                <Lock size={40} className="text-[#D4AF37]" />
                            </div>
                            <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-100 shadow-xl max-w-sm">
                                <h2 className="text-3xl font-black text-[#1A120B] uppercase italic tracking-tighter">Staff Hub</h2>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <Shield size={11} className="text-[#D4AF37]" />
                                    <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</p>
                                </div>
                                <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                                    Select a conversation or start a new chat with your colleagues.
                                </p>
                                <div className="flex gap-3 mt-6 justify-center">
                                    <button onClick={() => setView('newchat')}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#1A120B] text-[#D4AF37] rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all">
                                        <MessageSquare size={13} /> Message
                                    </button>
                                    <button onClick={() => setView('newgroup')}
                                        className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37]/10 text-[#1A120B] border border-[#D4AF37]/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#D4AF37]/15 transition-all">
                                        <Users size={13} /> New Group
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </Layout>
    );
};

export default StaffCommunity;

const NavBtn = ({ icon: Icon, active, onClick, label }) => (
    <button 
        onClick={onClick}
        title={label}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            active 
            ? 'bg-[#D4AF37] text-[#1A120B] shadow-lg shadow-[#D4AF37]/20' 
            : 'text-white/30 hover:bg-white/5 hover:text-white'
        }`}
    >
        <Icon size={18} />
    </button>
);
