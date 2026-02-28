import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import io from 'socket.io-client';
import { 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    Send, 
    AlertTriangle, 
    ShieldCheck, 
    Maximize, 
    Activity,
    CheckCircle,
    Camera,
    Monitor,
    Mic
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useSelector((state) => state.auth);

    const [exam, setExam] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [faceStatus, setFaceStatus] = useState('ok'); // 'ok' | 'missing'
    const [screenSharing, setScreenSharing] = useState(false);
    const [cameraOn, setCameraOn] = useState(false);

    const timerRef = useRef(null);
    const socketRef = useRef(null);
    const screenStreamRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const cameraVideoRef = useRef(null);
    const peerConnsRef = useRef({}); // teacherSocketId -> RTCPeerConnection
    const faceTimerRef = useRef(null);
    const audioCtxRef = useRef(null);

    useEffect(() => {
        fetchExamAndStart();
        setupSecurityListeners();
        // Connect socket for proctoring
        socketRef.current = io('https://educbt-pro-backend.onrender.com', { auth: { token } });
        return () => {
            clearInterval(timerRef.current);
            clearInterval(faceTimerRef.current);
            removeSecurityListeners();
            stopAllMedia();
            socketRef.current?.disconnect();
        };
    }, []);

    // Load exam info AND start a session to get sessionId
    const fetchExamAndStart = async () => {
        try {
            const examRes = await axios.get(`https://educbt-pro-backend.onrender.com/exam/${examId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setExam(examRes.data);
            setTimeLeft(examRes.data.durationMinutes * 60);

            const sessionRes = await axios.post('https://educbt-pro-backend.onrender.com/exam/start', {
                examId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const sid = sessionRes.data.sessionId || sessionRes.data._id;
            setSessionId(sid);

            // Announce presence to teacher IMMEDIATELY (before asking for screen permission)
            // This ensures the teacher ALWAYS sees the student even if they deny screen share
            socketRef.current?.emit('student_joined_monitor', {
                examId,
                sessionId: sid,
                studentName: user?.fullName || user?.username || 'Student'
            });

            startTimer();
            setLoading(false);

            // Start screen share + camera for ALL exams (with audio)
            setTimeout(() => {
                startScreenShare(sid, examId);
                startCamera(sid, examId);
            }, 800);

        } catch (error) {
            console.error('Exam start error:', error);
            toast.error('Failed to load exam. Please try again.');
            navigate('/student/dashboard');
        }
    };

    const stopAllMedia = () => {
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        cameraStreamRef.current?.getTracks().forEach(t => t.stop());
        audioCtxRef.current?.close();
        Object.values(peerConnsRef.current).forEach(pc => pc.close());
    };

    // ── SCREEN SHARING + AUDIO via WebRTC ──────────────────────────
    const startScreenShare = async (sid, eid) => {
        try {
            // Request screen + audio (microphone during exam)
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 15, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true  // Include system audio if available
            });

            // Also grab mic audio and mix it in
            let finalStream = screenStream;
            try {
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                const tracks = [
                    ...screenStream.getVideoTracks(),
                    ...screenStream.getAudioTracks(),
                    ...micStream.getAudioTracks()
                ];
                finalStream = new MediaStream(tracks);
            } catch { /* mic optional */ }

            screenStreamRef.current = finalStream;
            setScreenSharing(true);
            finalStream.getVideoTracks()[0].onended = () => {
                setScreenSharing(false);
                toast('Screen sharing stopped');
            };

            const socket = socketRef.current;

            // ── WebRTC handlers ───────────────────────────────────────
            // Remove old listeners to avoid duplicates
            socket.off('screen_answer');
            socket.off('ice_candidate');
            socket.off('request_screen');

            // Teacher sends SDP answer → apply it
            socket.on('screen_answer', async ({ answer, teacherSocketId }) => {
                const pc = peerConnsRef.current[teacherSocketId];
                if (pc) {
                    try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); }
                    catch (e) { console.warn('[WebRTC] setRemote answer failed:', e.message); }
                }
            });

            // ICE candidate from teacher
            socket.on('ice_candidate', async ({ candidate, senderSocketId }) => {
                const pc = peerConnsRef.current[senderSocketId];
                if (pc && candidate) {
                    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
                }
            });

            // Build RTCPeerConnection and send offer to teacher
            const sendOffer = async (teacherSocketId) => {
                console.log('[WebRTC] Sending offer to teacher:', teacherSocketId);
                // Close old connection if any
                if (peerConnsRef.current[teacherSocketId]) {
                    peerConnsRef.current[teacherSocketId].close();
                }
                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                });
                peerConnsRef.current[teacherSocketId] = pc;

                // Add all tracks (video + audio) to the peer connection
                finalStream.getTracks().forEach(track => {
                    pc.addTrack(track, finalStream);
                });

                pc.onicecandidate = ({ candidate }) => {
                    if (candidate) {
                        socket.emit('ice_candidate', { targetSocketId: teacherSocketId, candidate });
                    }
                };

                pc.onconnectionstatechange = () => {
                    console.log('[WebRTC] Connection state:', pc.connectionState);
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('screen_offer', { examId: eid, sessionId: sid, offer, socketId: socket.id });
            };

            // Teacher requests screen → send WebRTC offer
            socket.on('request_screen', ({ teacherSocketId }) => {
                console.log('[WebRTC] Teacher requested screen, socketId:', teacherSocketId);
                sendOffer(teacherSocketId);
            });

            // Notify teacher that screen is now ready (re-announce with screen flag)
            socket.emit('student_joined_monitor', {
                examId: eid,
                sessionId: sid,
                studentName: user?.fullName || user?.username || 'Student',
                hasScreen: true
            });

            toast.success('Screen sharing started — teacher can now see your screen');

        } catch (err) {
            if (err.name === 'NotAllowedError') {
                toast('Screen sharing was declined. Your teacher won\'t see your screen.', { icon: '⚠️' });
            } else {
                console.warn('[ScreenShare] Error:', err.message);
            }
        }
    };


    // CAMERA + FACE + MIC MONITORING
    const startCamera = async (sid, eid) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            cameraStreamRef.current = stream;
            setCameraOn(true);
            if (cameraVideoRef.current) cameraVideoRef.current.srcObject = stream;

            // Face presence check every 5 seconds using pixel brightness
            faceTimerRef.current = setInterval(() => {
                if (!cameraVideoRef.current) return;
                const c = document.createElement('canvas');
                c.width = 80; c.height = 60;
                const ctx = c.getContext('2d');
                ctx.drawImage(cameraVideoRef.current, 0, 0, 80, 60);
                const data = ctx.getImageData(0, 0, 80, 60).data;
                let bright = 0;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i] > 30 || data[i+1] > 30 || data[i+2] > 30) bright++;
                }
                const visible = bright / (80 * 60) > 0.1;
                setFaceStatus(visible ? 'ok' : 'missing');
                if (!visible) {
                    socketRef.current?.emit('report_violation', { sessionId: sid, examId: eid, type: 'face_not_detected' });
                }
            }, 5000);

            // Mic noise monitor every 10 seconds
            try {
                const actx = new AudioContext();
                audioCtxRef.current = actx;
                const analyser = actx.createAnalyser();
                actx.createMediaStreamSource(stream).connect(analyser);
                analyser.fftSize = 256;
                const buf = new Uint8Array(analyser.frequencyBinCount);
                setInterval(() => {
                    analyser.getByteFrequencyData(buf);
                    const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
                    if (avg > 50) socketRef.current?.emit('report_violation', { sessionId: sid, examId: eid, type: 'suspicious_noise' });
                }, 10000);
            } catch {}
        } catch (err) {
            console.warn('Camera unavailable:', err.message);
        }
    };

    const setupSecurityListeners = () => {
        window.addEventListener('blur', handleTabSwitch);
        window.addEventListener('resize', handleResize);
        document.addEventListener('contextmenu', e => e.preventDefault());
    };

    const removeSecurityListeners = () => {
        window.removeEventListener('blur', handleTabSwitch);
        window.removeEventListener('resize', handleResize);
    };

    const handleTabSwitch = () => {
        setTabSwitches(prev => {
            const count = prev + 1;
            if (count >= 3) {
                forceSubmit(`You switched tabs ${count} times. Your exam has been submitted automatically.`);
            } else {
                toast.error(`Warning: You left the exam tab! (${count}/3). If you do this 3 times, your exam will be submitted.`);
            }
            return count;
        });
    };

    const handleResize = () => {
        if (!document.fullscreenElement) {
            setIsFullscreen(false);
        }
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    forceSubmit('Time is up! Your exam has been submitted automatically.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    const handleAnswer = (questionId, optionIndex) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleSubmit = async () => {
        const unanswered = exam.questions.length - Object.keys(answers).length;
        if (unanswered > 0) {
            const confirmed = window.confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to submit?`);
            if (!confirmed) return;
        }
        await submitExam();
    };

    const forceSubmit = async (reason) => {
        toast.error(reason);
        await submitExam();
    };

    const submitExam = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const loadingToast = toast.loading('Submitting your exam...');

        try {
            // Convert answers object (questionId -> optionIndex) to array format (index -> optionIndex)
            // The backend expects answers indexed by question position
            const answersArray = {};
            exam.questions.forEach((q, idx) => {
                if (answers[q._id] !== undefined) {
                    answersArray[idx] = answers[q._id];
                }
            });

            await axios.post('https://educbt-pro-backend.onrender.com/exam/submit', {
                sessionId,
                answers: answersArray,
                tabSwitches
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.dismiss(loadingToast);
            toast.success('Exam submitted successfully! Well done.');
            navigate('/student/dashboard');
        } catch (error) {
            console.error('Submit error:', error.response?.data || error.message);
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || 'Submission failed. Please try again.');
            setIsSubmitting(false);
        }
    };

    const enterFullscreen = () => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen().then(() => setIsFullscreen(true));
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center p-6 font-outfit">
            <div className="w-16 h-16 rounded-[2rem] bg-[#1a120b] flex items-center justify-center mb-8 border border-[#c5a059]/10 shadow-2xl animate-bounce">
                <Activity size={32} className="text-[#c5a059]" />
            </div>
            <p className="text-[10px] font-black text-[#1a120b] uppercase tracking-[0.4em] animate-pulse">Initializing Secure Protocol...</p>
        </div>
    );

    const currentQuestion = exam.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-[#fcfbf9] flex flex-col font-outfit text-[#1a150e] select-none">
            {/* Professional Header */}
            <header className="sticky top-0 z-40 h-20 bg-[#1a120b] border-b border-[#c5a059]/10 px-6 md:px-12 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059] shadow-inner group">
                        <ShieldCheck size={22} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-white text-sm font-black uppercase tracking-widest italic">{exam.title}</h1>
                        <p className="text-[#c5a059]/60 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mt-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            Live Exam — {exam.subject}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* Timer Logic */}
                    <div className={`flex items-center gap-4 px-6 py-2.5 rounded-2xl border transition-all duration-500 ${timeLeft < 300 ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-white/5 border-white/10 text-white'}`}>
                        <Clock size={16} className={timeLeft < 300 ? 'animate-pulse' : ''} />
                        <span className="text-xl font-black tabular-nums italic">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 border-l border-white/10 pl-8">
                        <div className="text-right">
                            <p className="text-white text-[10px] font-black uppercase tracking-widest leading-none mb-1">{user?.fullName}</p>
                            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em]">{user?.info?.classLevel}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a059] font-black">
                            {user?.fullName?.charAt(0)}
                        </div>
                    </div>
                </div>
            </header>

            {!isFullscreen && (
                <div className="bg-[#c5a059] text-[#1a120b] text-[10px] font-black uppercase tracking-[0.3em] py-3 text-center animate-in slide-in-from-top duration-500">
                    <button onClick={enterFullscreen} className="flex items-center gap-2 mx-auto hover:scale-105 transition-transform">
                        <Maximize size={12} />
                        Tip: Click here to go Fullscreen for a better experience
                    </button>
                </div>
            )}

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Question Area */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-[#c5a059] uppercase tracking-[0.4em]">Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-3 py-1 rounded-lg">{Object.keys(answers).length} Answered</span>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#c5a059]/5 blur-[60px] rounded-full" />
                        
                        <div className="relative z-10">
                            <h2 className="text-xl md:text-2xl font-black text-[#1a150e] leading-relaxed italic mb-12">
                                {currentQuestion.text}
                            </h2>

                            <div className="space-y-4">
                                {currentQuestion.options.map((option, idx) => {
                                    const isSelected = answers[currentQuestion._id] === idx;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(currentQuestion._id, idx)}
                                            className={`
                                                w-full flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-300 group/opt
                                                ${isSelected 
                                                    ? 'bg-[#1a120b] border-[#c5a059] text-[#c5a059] shadow-2xl scale-[1.02]' 
                                                    : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:border-[#c5a059]/30 hover:bg-white'}
                                            `}
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors
                                                ${isSelected ? 'bg-[#c5a059] text-[#1a120b]' : 'bg-white border border-slate-100 group-hover/opt:border-[#c5a059]/30 text-slate-400'}
                                            `}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-left font-bold text-sm leading-tight uppercase tracking-tight">{option}</span>
                                            {isSelected && (
                                                <div className="ml-auto">
                                                    <CheckCircle size={20} className="text-[#c5a059]" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 pt-10">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="h-16 px-10 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[#1a150e] hover:bg-slate-50 transition-all disabled:opacity-30 active:scale-95 shadow-sm"
                        >
                            <ChevronLeft size={18} />
                            Previous
                        </button>
                        
                        {currentQuestionIndex === exam.questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="h-16 px-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                            >
                                {isSubmitting ? <Activity size={18} className="animate-spin" /> : <Send size={18} />}
                                Submit Exam
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}
                                className="h-16 px-12 bg-[#1a120b] hover:bg-black text-[#c5a059] rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl border border-[#c5a059]/20"
                            >
                                Next Question
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Question Grid Navigation */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                        <h3 className="text-sm font-black text-[#1a150e] uppercase italic tracking-[0.2em] mb-8">Navigation Grid</h3>
                        <div className="grid grid-cols-5 gap-3">
                            {exam.questions.map((q, idx) => {
                                const isAnswered = answers[q._id] !== undefined;
                                const isCurrent = currentQuestionIndex === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`
                                            aspect-square rounded-xl text-[10px] font-black transition-all flex items-center justify-center relative
                                            ${isCurrent ? 'bg-[#1a120b] text-[#c5a059] ring-2 ring-[#c5a059] ring-offset-2' : 
                                              isAnswered ? 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20 shadow-inner' : 
                                              'bg-slate-50 text-slate-300 border border-slate-100 hover:bg-white hover:border-[#c5a059]/30'}
                                        `}
                                    >
                                        {idx + 1}
                                        {isAnswered && !isCurrent && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#c5a059] rounded-full border border-white" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-[#1a120b] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-[#c5a059]/10 blur-[60px] rounded-full group-hover:bg-[#c5a059]/20 transition-all duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[#c5a059]">
                                    <AlertTriangle size={20} />
                                </div>
                                <h4 className="text-white text-xs font-black uppercase tracking-widest italic">Exam Security</h4>
                            </div>
                            <p className="text-slate-500 text-[11px] leading-relaxed font-medium mb-6">
                                You are being monitored. Do not switch tabs or leave this window. Tab switching will auto-submit your exam.
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Tab Switches</span>
                                    <span className={`text-[11px] font-black ${tabSwitches > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{tabSwitches} / 3</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Integrity Rank</span>
                                    <span className="text-emerald-500 text-[11px] font-black uppercase">ALPHA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="h-14 border-t border-slate-100 bg-white/50 backdrop-blur-xl flex items-center justify-center px-12">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] italic">
                    KICC CBT Institutional Secure Engine v4.0.1
                </p>
            </footer>
        </div>
    );
};

export default ExamPage;
