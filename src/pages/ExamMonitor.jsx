import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import axios from 'axios';
import TeacherLayout from '../components/TeacherLayout';
import {
    Activity, Shield, User, AlertTriangle,
    CheckCircle, XCircle, Eye, Lock, Unlock, Send,
    RefreshCcw, Monitor, Maximize2, Grid3x3, Grid2x2,
    Mic, MicOff, Camera, CameraOff
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Live screen tile for one student ─────────────────────────── */
const ScreenTile = ({ session, onRequest, stream, isExpanded, onExpand, onAction }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const statusColor = {
        ongoing:    'bg-emerald-500',
        completed:  'bg-blue-400',
        terminated: 'bg-rose-500',
    }[session.status] || 'bg-slate-400';

    return (
        <div className={`relative bg-[#0f0a06] rounded-2xl overflow-hidden group border transition-all duration-300
            ${session.violationCount > 0 ? 'border-rose-500/60 shadow-rose-500/20 shadow-lg' : 'border-white/5 hover:border-[#c5a059]/30'}
            ${isExpanded ? 'col-span-2 row-span-2' : ''}`}
        >
            {/* Live Screen */}
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ minHeight: 160 }}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Monitor size={20} className="text-white/20" />
                    </div>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">No Screen</p>
                    {session.status === 'ongoing' && (
                        <button
                            onClick={() => onRequest(session)}
                            className="px-3 py-1.5 bg-[#c5a059]/20 hover:bg-[#c5a059]/40 text-[#c5a059] text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-[#c5a059]/20"
                        >
                            Request Screen
                        </button>
                    )}
                </div>
            )}

            {/* Overlay info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor} ${session.status === 'ongoing' ? 'animate-pulse' : ''}`} />
                        <span className="text-white text-[11px] font-black uppercase italic truncate">
                            {session.studentName || 'Student'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        {session.violationCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-md flex items-center gap-0.5">
                                <AlertTriangle size={8} /> {session.violationCount}
                            </span>
                        )}
                        {session.isLocked && (
                            <span className="px-1.5 py-0.5 bg-amber-500/80 text-white text-[8px] font-black rounded-md">
                                🔒
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Hover action bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                <div className="flex gap-1">
                    {/* Expand */}
                    <button
                        onClick={() => onExpand(session._id)}
                        title="Expand"
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                        <Maximize2 size={12} className="text-white" />
                    </button>
                    {/* View details */}
                    <button
                        onClick={() => onAction('view', session)}
                        title="View details"
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                        <Eye size={12} className="text-white" />
                    </button>
                </div>
                <div className="flex gap-1">
                    {/* Lock / Unlock */}
                    <button
                        onClick={() => onAction('lock', session)}
                        title={session.isLocked ? 'Unlock' : 'Lock'}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${session.isLocked ? 'bg-amber-500/80 hover:bg-amber-500' : 'bg-white/10 hover:bg-amber-500/80'}`}
                    >
                        {session.isLocked ? <Unlock size={12} className="text-white" /> : <Lock size={12} className="text-white" />}
                    </button>
                    {/* Force submit */}
                    <button
                        onClick={() => onAction('submit', session)}
                        title="Force Submit"
                        disabled={session.status !== 'ongoing'}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-blue-500/80 flex items-center justify-center transition-all disabled:opacity-30"
                    >
                        <Send size={12} className="text-white" />
                    </button>
                    {/* Remove */}
                    <button
                        onClick={() => onAction('remove', session)}
                        title="Remove"
                        disabled={session.status !== 'ongoing'}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/80 flex items-center justify-center transition-all disabled:opacity-30"
                    >
                        <XCircle size={12} className="text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Component ────────────────────────────────────────────── */
const ExamMonitor = () => {
    const { examId } = useParams();
    const { token } = useSelector((state) => state.auth);

    const [sessions, setSessions] = useState([]);
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ active: 0, completed: 0, violations: 0 });
    const [selectedSession, setSelectedSession] = useState(null);
    const [processing, setProcessing] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [gridSize, setGridSize] = useState(3); // columns
    const [liveStreams, setLiveStreams] = useState({}); // sessionId -> MediaStream
    const [onlineStudents, setOnlineStudents] = useState({}); // socketId -> sessionId

    const socketRef = useRef(null);
    const peerConnsRef = useRef({}); // studentSocketId -> RTCPeerConnection

    // ── Socket + WebRTC setup ──────────────────────────────────────
    useEffect(() => {
        fetchInitialData();

        const socket = io('https://educbt-pro-backend.onrender.com', { auth: { token } });
        socketRef.current = socket;

        // Join teacher's monitor room
        socket.emit('join_monitor', examId);

        // Student joined with screen sharing available
        socket.on('student_ready', ({ sessionId, studentName, studentSocketId }) => {
            console.log(`[MONITOR] Student ready: ${studentName} (${studentSocketId})`);
            setOnlineStudents(prev => ({ ...prev, [studentSocketId]: sessionId }));
            // Request their screen
            requestStudentScreen(studentSocketId);
        });

        // Receive SDP answer from student
        socket.on('screen_answer', async ({ answer, studentSocketId }) => {
            const pc = peerConnsRef.current[studentSocketId];
            if (pc) {
                try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); } catch {}
            }
        });

        // Receive ICE candidate from student
        socket.on('ice_candidate', async ({ candidate, senderSocketId }) => {
            const pc = peerConnsRef.current[senderSocketId];
            if (pc && candidate) {
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
            }
        });

        // Receive screen offer from student (student-initiated)
        socket.on('screen_offer', async ({ offer, sessionId, socketId: studentSocketId }) => {
            await handleScreenOffer({ offer, sessionId, studentSocketId });
        });

        // Real-time session updates
        socket.on('session-update', (updatedSession) => {
            setSessions(prev => {
                const idx = prev.findIndex(s => s._id === updatedSession._id);
                if (idx !== -1) {
                    const copy = [...prev];
                    copy[idx] = updatedSession;
                    return copy;
                }
                return [updatedSession, ...prev];
            });
        });

        // Violation alerts
        socket.on('protocol-violation', (data) => {
            toast.error(`⚠️ ${data.studentName}: ${data.type.replace(/_/g, ' ')}`, { duration: 5000 });
            setSessions(prev => prev.map(s =>
                s._id === data.sessionId
                    ? { ...s, violationCount: (s.violationCount || 0) + 1 }
                    : s
            ));
        });

        socket.on('report_violation', (data) => {
            toast.error(`🚨 Violation: ${data.type.replace(/_/g, ' ')}`, { duration: 5000 });
        });

        return () => {
            socket.disconnect();
            Object.values(peerConnsRef.current).forEach(pc => pc.close());
        };
    }, [examId, token]);

    // ── Handle screen offer from student (student pushed their stream) ──
    const handleScreenOffer = async ({ offer, sessionId, studentSocketId }) => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        peerConnsRef.current[studentSocketId] = pc;

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            setLiveStreams(prev => ({ ...prev, [studentSocketId]: stream }));
        };

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                socketRef.current?.emit('ice_candidate', { targetSocketId: studentSocketId, candidate });
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketRef.current?.emit('screen_answer', { studentSocketId, answer });
    };

    // ── Request screen from a specific student ──────────────────────
    const requestStudentScreen = (studentSocketId) => {
        socketRef.current?.emit('request_screen', { studentSocketId, teacherSocketId: socketRef.current.id });
    };

    const requestAllScreens = () => {
        Object.keys(onlineStudents).forEach(socketId => requestStudentScreen(socketId));
        toast.success('Screen request sent to all students');
    };

    // ── Data fetching ───────────────────────────────────────────────
    const fetchInitialData = async () => {
        try {
            const [eData, sData] = await Promise.all([
                axios.get(`https://educbt-pro-backend.onrender.com/exam/${examId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`https://educbt-pro-backend.onrender.com/exam/${examId}/sessions`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setExam(eData.data);
            // Normalize: flatten student.name -> studentName for convenience
            const normalized = sData.data.map(s => ({
                ...s,
                studentName: s.student?.name || s.student?.username || 'Student',
            })).filter(s => s._id); // skip not-started (no session yet)
            setSessions(normalized);
            calcStats(normalized);
            setLoading(false);
        } catch {
            toast.error('Failed to load exam data');
            setLoading(false);
        }
    };


    const calcStats = (data) => setStats({
        active: data.filter(s => s.status === 'ongoing').length,
        completed: data.filter(s => s.status === 'completed').length,
        violations: data.reduce((acc, s) => acc + (s.violationCount || 0), 0),
    });

    const handleAction = async (type, session) => {
        if (type === 'view') { setSelectedSession(session); return; }

        if (type === 'lock') {
            const action = session.isLocked ? 'unlock' : 'lock';
            setProcessing(session._id);
            try {
                await axios.post(`https://educbt-pro-backend.onrender.com/exam/session/${session._id}/${action}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(session.isLocked
                    ? `✅ ${session.studentName} unlocked`
                    : `🔒 ${session.studentName} locked`);
                setSessions(prev => prev.map(s => s._id === session._id ? { ...s, isLocked: !session.isLocked } : s));
            } catch { toast.error('Action failed'); }
            finally { setProcessing(null); }
        }

        if (type === 'submit') {
            if (!window.confirm(`Submit ${session.studentName}'s exam now?`)) return;
            setProcessing(session._id);
            try {
                await axios.post(`https://educbt-pro-backend.onrender.com/exam/session/${session._id}/force-submit`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(`✅ ${session.studentName}'s exam submitted`);
                setSessions(prev => prev.map(s => s._id === session._id ? { ...s, status: 'completed' } : s));
            } catch { toast.error('Force submit failed'); }
            finally { setProcessing(null); }
        }

        if (type === 'remove') {
            if (!window.confirm(`Remove ${session.studentName} from exam?`)) return;
            setProcessing(session._id);
            try {
                await axios.post(`https://educbt-pro-backend.onrender.com/exam/session/${session._id}/lock`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success(`${session.studentName} removed`);
                setSessions(prev => prev.map(s => s._id === session._id ? { ...s, status: 'terminated' } : s));
            } catch { toast.error('Remove failed'); }
            finally { setProcessing(null); }
        }
    };


    // ── Get stream for a session ────────────────────────────────────
    const getStreamForSession = (session) => {
        // Match socketId -> sessionId -> stream
        const socketId = Object.entries(onlineStudents).find(([, sid]) => sid === session._id)?.[0];
        return socketId ? liveStreams[socketId] : null;
    };

    const getStatusLabel = (status) => ({
        ongoing: 'In Progress', completed: 'Submitted', terminated: 'Removed'
    })[status] || status;

    // ── LOADING ─────────────────────────────────────────────────────
    if (loading) return (
        <TeacherLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 rounded-2xl bg-[#1a120b] flex items-center justify-center border border-[#c5a059]/10 shadow-2xl animate-bounce mb-6">
                    <Activity size={32} className="text-[#c5a059]" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Loading exam monitor...</p>
            </div>
        </TeacherLayout>
    );

    return (
        <TeacherLayout>
            <div className="space-y-6 pb-20">

                {/* ── Header ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 bg-white border border-slate-100 rounded-full px-4 py-1.5 shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                            </span>
                            <span className="text-[11px] font-black text-[#1a120b] uppercase tracking-widest">LIVE</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-[#1a150e] uppercase italic tracking-tight">
                            {exam?.title} <span className="gold-text-gradient">Monitor</span>
                        </h1>
                        <p className="text-slate-500 text-xs">{exam?.subject} — {exam?.classLevel || 'All Classes'}</p>
                    </div>

                    {/* Stats + controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-center shadow-sm">
                            <p className="text-xl font-black text-emerald-500">{stats.active}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-center shadow-sm">
                            <p className="text-xl font-black text-blue-500">{stats.completed}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Done</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-center shadow-sm">
                            <p className="text-xl font-black text-rose-500">{stats.violations}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Violations</p>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 text-center shadow-sm">
                            <p className="text-xl font-black text-[#c5a059]">{Object.keys(liveStreams).length}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Screens Live</p>
                        </div>

                        {/* Grid size toggle */}
                        <div className="flex bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            {[2, 3, 4].map(n => (
                                <button key={n} onClick={() => setGridSize(n)}
                                    className={`w-10 h-10 flex items-center justify-center text-[10px] font-black transition-all ${gridSize === n ? 'bg-[#1a120b] text-[#c5a059]' : 'text-slate-400 hover:text-[#1a120b]'}`}
                                >
                                    {n === 2 ? <Grid2x2 size={16} /> : <Grid3x3 size={16} />}
                                </button>
                            ))}
                        </div>

                        {/* Request all screens */}
                        <button onClick={requestAllScreens}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1a120b] text-[#c5a059] rounded-2xl text-[10px] font-black uppercase tracking-widest border border-[#c5a059]/20 hover:bg-black transition-all shadow-sm"
                        >
                            <Monitor size={14} /> Request All Screens
                        </button>

                        <button onClick={fetchInitialData}
                            className="w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center hover:border-[#c5a059]/30 transition-all shadow-sm group"
                        >
                            <RefreshCcw size={16} className="text-slate-400 group-hover:text-[#c5a059] group-hover:rotate-180 transition-all duration-500" />
                        </button>
                    </div>
                </div>

                {/* ── Live Screen Grid ── */}
                {sessions.length === 0 ? (
                    <div className="bg-[#0f0a06] border border-white/5 rounded-3xl p-20 text-center">
                        <Shield size={48} className="text-white/10 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-white/40 mb-2">No Students Yet</h3>
                        <p className="text-white/20 text-sm">Waiting for students to join and share their screens...</p>
                    </div>
                ) : (
                    <div
                        className="grid gap-3"
                        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                    >
                        {sessions.map(session => (
                            <ScreenTile
                                key={session._id}
                                session={session}
                                stream={getStreamForSession(session)}
                                isExpanded={expandedId === session._id}
                                onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                                onRequest={(s) => {
                                    const socketId = Object.entries(onlineStudents).find(([, sid]) => sid === s._id)?.[0];
                                    if (socketId) requestStudentScreen(socketId);
                                    else toast('Student not yet online — they will share when they join');
                                }}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                )}

                {/* ── Student Detail Modal ── */}
                {selectedSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSession(null)} />
                        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#1a120b] flex items-center justify-center text-[#c5a059] border border-[#c5a059]/20">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-[#1a150e] uppercase italic">{selectedSession.studentName}</h2>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Student Details</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedSession(null)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                        <XCircle size={22} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#1a120b] rounded-2xl p-5 border border-[#c5a059]/10">
                                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Status</p>
                                        <p className={`text-xl font-black italic ${selectedSession.status === 'ongoing' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {getStatusLabel(selectedSession.status)}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Violations</p>
                                        <p className={`text-2xl font-black italic ${selectedSession.violationCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {selectedSession.violationCount || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Violations list */}
                                <div>
                                    <h4 className="text-[10px] font-black text-[#1a150e] uppercase tracking-widest border-b border-slate-100 pb-3 mb-3">Violation History</h4>
                                    {selectedSession.violations?.length > 0 ? (
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {selectedSession.violations.map((v, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <AlertTriangle size={14} className="text-rose-500" />
                                                        <span className="text-[11px] font-black text-rose-700 uppercase italic">{v.type?.replace(/_/g, ' ')}</span>
                                                    </div>
                                                    <span className="text-[10px] text-rose-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <CheckCircle size={24} className="text-emerald-500 mx-auto mb-2" />
                                            <p className="text-slate-400 text-sm font-medium">No violations</p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => { handleAction('lock', selectedSession); setSelectedSession(null); }}
                                        className={`flex items-center justify-center gap-2 h-12 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all border
                                            ${selectedSession.isLocked ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-500 hover:text-white' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-amber-500 hover:text-white'}`}
                                    >
                                        {selectedSession.isLocked ? <><Unlock size={16} /> Unlock</> : <><Lock size={16} /> Lock</>}
                                    </button>
                                    <button onClick={() => { handleAction('submit', selectedSession); setSelectedSession(null); }}
                                        disabled={selectedSession.status !== 'ongoing'}
                                        className="flex items-center justify-center gap-2 h-12 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all border border-blue-200 disabled:opacity-40"
                                    >
                                        <Send size={16} /> Force Submit
                                    </button>
                                </div>

                                <button onClick={() => setSelectedSession(null)}
                                    className="w-full h-12 bg-[#1a120b] text-[#c5a059] rounded-2xl font-black text-[11px] uppercase tracking-widest border border-[#c5a059]/20 hover:bg-black transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TeacherLayout>
    );
};

export default ExamMonitor;
