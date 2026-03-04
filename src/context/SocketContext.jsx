import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import CallModal from '../components/CallModal';

const SocketContext = createContext();

const API = import.meta.env.VITE_API_URL || 'https://educbt-pro-backend.onrender.com';

export const SocketProvider = ({ children }) => {
    const { token, user } = useSelector(state => state.auth);
    const [socket, setSocket] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [callState, setCallState] = useState(null);
    const [adminNotifications, setAdminNotifications] = useState([]);

    // Audio refs
    const ringingAudio = useRef(null);
    const outgoingAudio = useRef(null);

    useEffect(() => {
        // Init audio
        ringingAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3'); // Ringing
        ringingAudio.current.loop = true;
        outgoingAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1358/1358-preview.mp3'); // Outgoing
        outgoingAudio.current.loop = true;

        if (token && user) {
            const s = io(API, {
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            setSocket(s);

            s.on('connect', () => {
                setConnectionStatus('connected');
                console.log('[SOCKET] Connected to signaling server');
            });

            s.on('connect_error', (err) => {
                setConnectionStatus('error');
                console.error('[SOCKET] Connection Error:', err.message);
                toast.error('Network sync issue. Retrying...');
            });

            s.on('disconnect', (reason) => {
                setConnectionStatus('disconnected');
                console.warn('[SOCKET] Disconnected:', reason);
            });

            const userId = user._id || user.id;
            if (!userId) {
                console.error('[SOCKET] User ID is missing in auth state!', user);
            }

            s.emit('join_personal', userId);
            if (user.role === 'school_admin' || user.role === 'admin') {
                s.emit('join_admin_monitor', user.schoolId);
            }
            s.emit('join_school_staff', user.schoolId);

            // CALL SIGNALING
            s.on('incoming_call', (data) => {
                setCallState({ ...data, incoming: true });
                ringingAudio.current.play().catch(() => { });

                // Browser notification
                if (Notification.permission === 'granted') {
                    new Notification(`${data.callType === 'video' ? '📹 Video' : '📞 Voice'} Call`, {
                        body: `${data.callerName} is calling...`,
                    });
                }
            });

            s.on('call_accepted', (data) => {
                outgoingAudio.current.pause();
                outgoingAudio.current.currentTime = 0;
            });

            s.on('call_rejected', (data) => {
                outgoingAudio.current.pause();
                outgoingAudio.current.currentTime = 0;
                setCallState(null);
                toast.error(data.rejectorName ? `${data.rejectorName} declined` : 'Call declined');
            });

            s.on('call_ended', () => {
                stopAllAudio();
                setCallState(null);
            });

            // ADMIN MONITOR
            s.on('new_message', (msg) => {
                if (user.role === 'school_admin') {
                    setAdminNotifications(prev => [{ ...msg, id: Date.now(), type: 'MESSAGE' }, ...prev].slice(0, 10));
                }
            });

            s.on('group_activity', (data) => {
                if (user.role === 'school_admin') {
                    setAdminNotifications(prev => [{ ...data, id: Date.now(), type: 'CHAT' }, ...prev].slice(0, 10));
                }
            });

            s.on('admin_alert', (alert) => {
                toast(alert.message, { icon: '🚨', duration: 5000 });
            });

            // REAL-TIME CALL UPDATES
            s.on('ongoing_call_update', () => {
                // If there's a global method to fetch calls, we can trigger it here
                // For now, it will be handled by components listening or periodic fetch
            });

            return () => s.close();
        }
    }, [token, user?.schoolId, user?.role]);

    const stopAllAudio = () => {
        ringingAudio.current?.pause();
        if (ringingAudio.current) ringingAudio.current.currentTime = 0;
        outgoingAudio.current?.pause();
        if (outgoingAudio.current) outgoingAudio.current.currentTime = 0;
    };

    const startCall = useCallback((target, type, isGroup = false) => {
        if (!socket) return;
        const userId = user?._id || user?.id;
        const roomId = `${userId}_${Date.now()}`;
        setCallState({
            incoming: false,
            targetId: isGroup ? null : (target._id || target.id),
            targetName: target.fullName || target.name,
            callType: type,
            roomId,
            isGroup
        });

        outgoingAudio.current.play().catch(() => { });

        if (isGroup) {
            socket.emit('call_group', {
                targetUserIds: target.memberIds,
                callerId: userId,
                callerName: user.fullName,
                callType: type,
                roomId,
                groupName: target.name,
                schoolId: user.schoolId
            });
        } else {
            socket.emit('call_user', {
                targetUserId: target._id || target.id,
                callerId: userId,
                callerName: user.fullName,
                callType: type,
                roomId,
                schoolId: user.schoolId
            });
        }
    }, [socket, user]);

    const endCall = useCallback(() => {
        if (socket && callState) {
            socket.emit('call_ended', { roomId: callState.roomId });
            socket.emit('leave_call_room', { roomId: callState.roomId });
        }
        stopAllAudio();
        setCallState(null);
    }, [socket, callState]);

    return (
        <SocketContext.Provider value={{
            socket,
            callState,
            setCallState,
            startCall,
            endCall,
            stopAllAudio,
            adminNotifications
        }}>
            {children}
            {callState && (
                <CallModal
                    socket={socket}
                    currentUser={user}
                    callState={callState}
                    onClose={endCall}
                />
            )}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider. Check if you wrapped your App with <SocketProvider>.');
    }
    return context;
};
