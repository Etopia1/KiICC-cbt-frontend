import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import io from 'socket.io-client';

const StudentScreen = ({ offerData, socket }) => {
    const videoRef = useRef(null);
    const peerConnection = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!offerData) return;

        const initializeConnection = async () => {
            // Close existing connection if any
            if (peerConnection.current) {
                peerConnection.current.close();
            }

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerConnection.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice_candidate', {
                        targetSocketId: offerData.studentSocketId,
                        candidate: event.candidate
                    });
                }
            };

            pc.ontrack = (event) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = event.streams[0];
                    setIsConnected(true);
                }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(offerData.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('screen_answer', {
                studentSocketId: offerData.studentSocketId,
                answer
            });
        };

        initializeConnection();

        // Listen for ICE candidates from student
        const handleRemoteIce = async (data) => {
            // We need to ensure this ICE is for THIS student.
            // The parent component might filter this, or we rely on 'remote_ice_candidate' event
            // being uniquely meaningful?
            // Actually, signaling is usually p2p. If parent receives ICE, it should pass it here?
            // Or we just listen globally but check sender ID?
            if (data.senderSocketId === offerData.studentSocketId && peerConnection.current) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error("Error adding remote ICE", e);
                }
            }
        };

        socket.on('remote_ice_candidate', handleRemoteIce);

        return () => {
            if (peerConnection.current) {
                peerConnection.current.close();
            }
            socket.off('remote_ice_candidate', handleRemoteIce);
        };
    }, [offerData]);

    if (!isConnected) return (
        <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center text-gray-500 text-xs">
            Connecting to screen...
        </div>
    );

    return (
        <div className={`relative ${isExpanded ? 'fixed inset-4 z-50 bg-black rounded-xl shadow-2xl flex items-center justify-center' : 'w-full h-48 bg-black rounded-lg overflow-hidden'}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-contain ${isExpanded ? 'max-h-full' : ''}`}
            />
            <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded hover:bg-black/80"
            >
                {isExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
        </div>
    );
};

export default StudentScreen;
