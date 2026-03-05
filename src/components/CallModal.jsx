import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
    ScreenShare, ScreenShareOff, Maximize2, Users, X, Volume2,
    Grid, Minimize2
} from 'lucide-react';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ]
};

const RemoteVideo = ({ stream, name }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            console.log(`[Video] Attaching stream to video element for ${name}`);
            videoRef.current.srcObject = stream;
        }
    }, [stream, name]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
        />
    );
};
const CallModal = ({ socket, currentUser, callState, onClose }) => {
    const [phase, setPhase] = useState(callState.incoming ? 'ringing' : 'connecting');
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(callState.callType === 'voice');
    const [sharing, setSharing] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isMinimized, setIsMinimized] = useState(false);
    const [peers, setPeers] = useState({}); // socketId -> { stream, name, videoEnabled }

    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnections = useRef({});
    const timerRef = useRef(null);

    const callType = callState?.callType || 'voice';
    const isIncoming = callState?.incoming;
    const roomId = callState?.roomId;

    useEffect(() => {
        if (phase === 'connected') {
            timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [phase]);

    const getLocalStream = useCallback(async () => {
        try {
            const constraints = {
                audio: true,
                video: callType === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false
            };
            console.log('[MEDIA] Requesting stream with constraints:', constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error('[MEDIA] Access Error:', err);
            let msg = 'Failed to access camera or microphone.';
            if (err.name === 'NotAllowedError') msg = 'Camera/Mic permission denied. Please enable them in settings.';
            if (err.name === 'NotFoundError') msg = 'No camera or microphone found.';
            if (err.name === 'OverconstrainedError') msg = 'Camera does not support requested resolution.';

            // Lazy import toast to avoid circular dep if any, or just use console as fallback
            try { toast.error(msg); } catch (e) { console.error(msg); }

            return await navigator.mediaDevices.getUserMedia({ audio: true, video: false }).catch(() => {
                try { toast.error('Audio access also failed.'); } catch (e) { }
                return null;
            });
        }
    }, [callType]);

    const pendingCandidates = useRef({});

    const addPeer = useCallback((socketId, initialData = {}) => {
        setPeers(prev => {
            const existing = prev[socketId] || {};
            // Don't overwrite an existing stream with null
            if (existing.stream && !initialData.stream) {
                return { ...prev, [socketId]: { ...existing, ...initialData, stream: existing.stream } };
            }
            return { ...prev, [socketId]: { ...existing, ...initialData } };
        });
    }, []);

    const removePeer = useCallback((socketId) => {
        if (peerConnections.current[socketId]) {
            peerConnections.current[socketId].close();
            delete peerConnections.current[socketId];
        }
        setPeers(prev => {
            const updated = { ...prev };
            delete updated[socketId];
            return updated;
        });
    }, []);

    const createPeerConnection = useCallback((remoteSocketId) => {
        if (peerConnections.current[remoteSocketId]) return peerConnections.current[remoteSocketId];

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnections.current[remoteSocketId] = pc;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                socket.emit('rtc_ice_candidate', { targetSocketId: remoteSocketId, candidate });
            }
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received remote track from ${remoteSocketId}. Kind: ${event.track.kind}`);
            setPeers(prev => {
                const existing = prev[remoteSocketId] || {};
                let stream = existing.stream;
                if (!stream) {
                    stream = new MediaStream();
                }
                // Check if track already in stream to avoid warnings
                if (!stream.getTracks().some(t => t.id === event.track.id)) {
                    stream.addTrack(event.track);
                }
                return { ...prev, [remoteSocketId]: { ...existing, stream, name: existing.name || 'Remote Peer' } };
            });
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state with ${remoteSocketId}: ${pc.connectionState}`);
            if (['connected', 'completed'].includes(pc.connectionState)) setPhase('connected');
            if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
                console.warn(`[WebRTC] Connection failed/closed with ${remoteSocketId}`);
                removePeer(remoteSocketId);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE state with ${remoteSocketId}: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'failed') {
                pc.restartIce();
            }
        };

        return pc;
    }, [socket, removePeer]);

    const joinRoom = useCallback(async () => {
        if (localStreamRef.current) {
            console.log('[CallModal] Already joined or stream exists. Skipping join.');
            return;
        }
        setPhase('connecting');
        const stream = await getLocalStream();
        if (!stream) return onClose();

        socket.emit('join_call_room', {
            roomId,
            userId: currentUser?._id || currentUser?.id,
            userName: currentUser?.fullName,
            callType
        });
    }, [socket, roomId, currentUser, callType, getLocalStream, onClose]);

    useEffect(() => {
        if (!socket) return;

        const handlePeers = async ({ peers: existingPeers }) => {
            console.log(`[WebRTC] Room joined. Initial peers:`, existingPeers);
            for (const peerId of existingPeers) {
                const pc = createPeerConnection(peerId);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log(`[WebRTC] Sending OFFER to ${peerId}`);
                socket.emit('rtc_offer', { targetSocketId: peerId, offer, roomId });
            }
            // Auto-transition to connected phase if we are joining and there are peers
            // or if there are no peers (already handled).
            setPhase('connected');
        };

        const handlePeerJoined = ({ peerId, userName }) => {
            addPeer(peerId, { name: userName });
        };

        const handleOffer = async ({ offer, fromSocketId }) => {
            console.log(`[WebRTC] Received OFFER from ${fromSocketId}`);
            const pc = createPeerConnection(fromSocketId);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                console.log(`[WebRTC] Remote description set for ${fromSocketId}`);

                // Process queued candidates now that remote description is set
                if (pendingCandidates.current[fromSocketId]) {
                    console.log(`[WebRTC] Processing ${pendingCandidates.current[fromSocketId].length} queued candidates for ${fromSocketId}`);
                    for (const cand of pendingCandidates.current[fromSocketId]) {
                        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.error('[WebRTC] ICE Queue Error:', e));
                    }
                    delete pendingCandidates.current[fromSocketId];
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log(`[WebRTC] Sending ANSWER to ${fromSocketId}`);
                socket.emit('rtc_answer', { targetSocketId: fromSocketId, answer });
            } catch (err) {
                console.error('[WebRTC] Error handling offer:', err);
            }
        };

        const handleAnswer = async ({ answer, fromSocketId }) => {
            console.log(`[WebRTC] Received ANSWER from ${fromSocketId}`);
            const pc = peerConnections.current[fromSocketId];
            if (pc) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log(`[WebRTC] Remote description (answer) set for ${fromSocketId}`);
                } catch (err) {
                    console.error('[WebRTC] Error setting remote description from answer:', err);
                }
            } else {
                console.warn(`[WebRTC] Received answer for non-existent peer: ${fromSocketId}`);
            }
        };

        const handleIceCandidate = async ({ candidate, fromSocketId }) => {
            const pc = peerConnections.current[fromSocketId];
            if (pc && pc.remoteDescription) {
                console.log(`[WebRTC] Adding ICE candidate from ${fromSocketId}`);
                pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error('[WebRTC] ICE Error:', e));
            } else if (candidate) {
                console.log(`[WebRTC] Queueing ICE candidate from ${fromSocketId}`);
                if (!pendingCandidates.current[fromSocketId]) pendingCandidates.current[fromSocketId] = [];
                pendingCandidates.current[fromSocketId].push(candidate);
            }
        };

        const handlePeerLeft = ({ peerId }) => removePeer(peerId);

        socket.on('call_room_peers', handlePeers);
        socket.on('peer_joined_call', handlePeerJoined);
        socket.on('rtc_offer', handleOffer);
        socket.on('rtc_answer', handleAnswer);
        socket.on('rtc_ice_candidate', handleIceCandidate);
        socket.on('peer_left_call', handlePeerLeft);

        return () => {
            socket.off('call_room_peers', handlePeers);
            socket.off('peer_joined_call', handlePeerJoined);
            socket.off('rtc_offer', handleOffer);
            socket.off('rtc_answer', handleAnswer);
            socket.off('rtc_ice_candidate', handleIceCandidate);
            socket.off('peer_left_call', handlePeerLeft);
        };
    }, [socket, roomId, createPeerConnection, removePeer, addPeer]);

    // Handle initial join logic
    useEffect(() => {
        if (!isIncoming && phase === 'connecting') {
            joinRoom();
        }
    }, [isIncoming, joinRoom]);

    // Ensure listeners are cleaned up and tracks stop on unmount
    useEffect(() => {
        return () => {
            console.log('[CallModal] Unmounting - Cleaning up tracks and PCs');
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            Object.values(peerConnections.current).forEach(pc => pc.close());

            socket?.off('call_room_peers');
            socket?.off('peer_joined_call');
            socket?.off('rtc_offer');
            socket?.off('rtc_answer');
            socket?.off('rtc_ice_candidate');
            socket?.off('peer_left_call');
        };
    }, [socket]);

    const handleAccept = () => {
        socket.emit('call_accepted', {
            callerId: callState.callerId,
            roomId,
            answererName: currentUser?.fullName,
            answererId: currentUser?._id || currentUser?.id
        });
        joinRoom();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = muted);
            setMuted(!muted);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = videoOff);
            setVideoOff(!videoOff);
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (!sharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const videoTrack = screenStream.getVideoTracks()[0];

                Object.values(peerConnections.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) sender.replaceTrack(videoTrack).catch(e => console.error(e));
                });

                videoTrack.onended = () => {
                    stopScreenShare();
                };

                if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
                setSharing(true);
            } else {
                stopScreenShare();
            }
        } catch (err) {
            console.error('Screen share error:', err);
        }
    };

    const stopScreenShare = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            Object.values(peerConnections.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) sender.replaceTrack(videoTrack).catch(e => console.error(e));
            });
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            setSharing(false);
        }
    };

    const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div className={`fixed z-100 bg-[#0a0a0a] transition-all duration-500 font-outfit overflow-hidden
            ${isMinimized
                ? 'bottom-10 right-10 w-80 h-48 rounded-3xl shadow-2xl border border-white/10'
                : 'inset-0 flex flex-col animate-fade-in'
            }`}>

            {isMinimized && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] group overflow-hidden border border-white/5 rounded-3xl">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-3 right-3 flex gap-2 z-50">
                        <button onClick={() => setIsMinimized(false)} className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 text-white transition-colors">
                            <Maximize2 size={14} />
                        </button>
                        <button onClick={onClose} className="p-1.5 bg-rose-500 rounded-lg hover:bg-rose-600 text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-left">
                        <p className="text-white text-[10px] font-bold uppercase tracking-widest opacity-60">Active Session</p>
                        <h4 className="text-white text-sm font-bold truncate">{callState.callerName || callState.targetName}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
                            <p className="text-sky-400 text-[10px] font-medium">{fmt(duration)}</p>
                        </div>
                    </div>
                </div>
            )}

            {!isMinimized && (
                <>
                    {/* Header Info */}
                    <div className="absolute top-8 left-8 z-20 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse shadow-lg ${callType === 'video' ? 'bg-sky-400' : 'bg-emerald-400'}`} />
                            <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                                {callType === 'video' ? 'Secure Video' : 'Secure Voice'} Session • P2P Encrypted
                            </span>
                        </div>
                        <h2 className="text-white text-3xl font-bold tracking-tight">
                            {callState.groupName ? callState.groupName : (callState.callerName || callState.targetName)}
                        </h2>
                        <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                            <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/10">{fmt(duration)}</span>
                            <span>•</span>
                            <span>{Object.keys(peers).length + 1} Participants</span>
                        </div>
                    </div>

                    {/* Main Stage */}
                    <div className="flex-1 relative flex items-center justify-center p-6 mt-16 pb-32">
                        {phase === 'ringing' ? (
                            <div className="flex flex-col items-center gap-12 text-center">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-5xl font-bold shadow-2xl backdrop-blur-3xl">
                                        {callState.callerName?.charAt(0)}
                                    </div>
                                    <div className="absolute inset-0 rounded-full border border-sky-500/40 animate-ping opacity-20" />
                                    <div className="absolute -inset-4 rounded-full border border-white/5 animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sky-400 font-bold uppercase tracking-[0.3em] text-[10px]">Incoming {callType} Call</p>
                                    <h3 className="text-5xl font-bold text-white tracking-tight">{callState.callerName}</h3>
                                    <p className="text-white/40 text-sm font-medium">Connecting from School Hub</p>
                                </div>
                                <div className="flex gap-12">
                                    <button onClick={onClose} className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-500 shadow-2xl hover:bg-rose-500 hover:text-white transition-all hover:scale-110 active:scale-95 group">
                                        <PhoneOff size={24} className="group-hover:rotate-12 transition-transform" />
                                    </button>
                                    <button onClick={handleAccept} className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)] hover:bg-emerald-400 transition-all hover:scale-110 active:scale-95 group">
                                        <Phone size={32} className="group-hover:-rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`w-full h-full grid gap-4 ${Object.keys(peers).length === 0 ? 'grid-cols-1' :
                                Object.keys(peers).length === 1 ? 'grid-cols-1 md:grid-cols-2' :
                                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                                }`}>
                                {/* Remote Peers */}
                                {Object.entries(peers).map(([id, peer]) => (
                                    <div key={id} className="relative rounded-4xl overflow-hidden bg-white/5 border border-white/10 group">
                                        {peer.stream ? (
                                            <RemoteVideo stream={peer.stream} name={peer.name} />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                                <div className="w-20 h-20 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 text-3xl font-bold border border-sky-500/20 shadow-xl">
                                                    {peer.name?.charAt(0)}
                                                </div>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Connecting Peer...</p>
                                            </div>
                                        )}
                                        <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            <span className="text-white text-[11px] font-bold tracking-tight">{peer.name}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Local Video */}
                                <div className={`relative rounded-4xl overflow-hidden bg-white/5 border border-sky-500/10 group ${Object.keys(peers).length === 0 ? 'max-w-4xl mx-auto aspect-video' : ''}`}>
                                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                                    {(videoOff || callType === 'voice') && (
                                        <div className="absolute inset-0 bg-[#0f0f0f] flex flex-col items-center justify-center gap-6">
                                            <div className="relative">
                                                <div className="w-28 h-28 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 text-4xl font-bold border border-sky-500/20 shadow-2xl">
                                                    {currentUser?.fullName?.charAt(0)}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 p-2 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
                                                    {muted ? <MicOff size={18} className="text-rose-500" /> : <Mic size={18} className="text-sky-400" />}
                                                </div>
                                            </div>
                                            <p className="text-white font-bold text-lg tracking-tight">{currentUser?.fullName}</p>
                                        </div>
                                    )}
                                    <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-sky-500 px-3 py-1.5 rounded-xl shadow-xl shadow-sky-500/10">
                                        <span className="text-white text-[11px] font-bold tracking-tight">You</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Control Bar */}
                    {phase !== 'ringing' && !isMinimized && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-5 px-8 py-5 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl">
                            <ControlBtn icon={isMinimized ? Maximize2 : Minimize2} active={false} onClick={() => setIsMinimized(!isMinimized)} />
                            <div className="w-px h-8 bg-white/10 mx-1" />
                            <ControlBtn icon={muted ? MicOff : Mic} active={!muted} onClick={toggleMute} color={muted ? 'bg-rose-500' : 'bg-sky-500'} />
                            {callType === 'video' && (
                                <>
                                    <ControlBtn icon={videoOff ? VideoOff : Video} active={!videoOff} onClick={toggleVideo} color={videoOff ? 'bg-rose-500' : 'bg-white/10'} />
                                    <ControlBtn icon={sharing ? ScreenShareOff : ScreenShare} active={sharing} onClick={toggleScreenShare} color={sharing ? 'bg-sky-500' : 'bg-white/10'} />
                                </>
                            )}
                            <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-xl hover:bg-rose-600 transition-all hover:scale-110 active:scale-95 group">
                                <PhoneOff size={24} className="group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    )}

                </>
            )}

            <style>{`
                .mirror { transform: scaleX(-1); }
                .animate-bounce-slow { animation: bounce-slow 4s infinite ease-in-out; }
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

const ControlBtn = ({ icon: Icon, active, onClick, color = 'bg-white/10', disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 disabled:opacity-20
            ${active ? `${color} text-white shadow-lg` : 'bg-transparent border border-white/10 text-white/40 hover:bg-white/5 hover:text-white'}
        `}>
        <Icon size={22} />
    </button>
);

export default CallModal;
