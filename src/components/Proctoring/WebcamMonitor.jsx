import { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const WebcamMonitor = ({ onViolation, studentId }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [aiStatus, setAiStatus] = useState("Initializing AI...");
    const [isOk, setIsOk] = useState(true);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 640,
                        height: 480,
                        facingMode: 'user'
                    }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Camera Access Error:", err);
                setError("Camera access is required for this exam.");
                onViolation('camera_disabled');
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // AI Face Analysis
    useEffect(() => {
        if (!stream || !videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvasRef.current = canvas;

        const sendFrameToAI = async () => {
            const video = videoRef.current;
            if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

            // 1. Draw video frame to canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 2. Convert to Blob
            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const formData = new FormData();
                formData.append('file', blob, 'frame.jpg');
                formData.append('student_id', studentId || 'unknown_student');

                try {
                    // 3. Send to Python AI Server
                    const response = await axios.post('https://educbt-pro-backend.onrender.com/analyze-frame', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                        timeout: 3000 // Timeout fast if server is down
                    });

                    const result = response.data;

                    // 4. Handle Result
                    if (result.status === 'violation') {
                        setIsOk(false);
                        setAiStatus(result.reason.replace('_', ' '));
                        console.warn('AI Violation:', result.reason);
                        if (onViolation) onViolation(result.reason.toLowerCase());
                    } else {
                        setIsOk(true);
                        setAiStatus("Monitoring Active");
                    }

                } catch (err) {
                    console.error("AI Server Error:", err.message);
                    setAiStatus("AI Server Disconnected");
                    // Optionally don't fail the exam just because AI is down, or fail gracefully
                }
            }, 'image/jpeg', 0.8); // 80% quality jpeg
        };

        // Run analysis every 3 seconds to save bandwidth/cpu
        const interval = setInterval(sendFrameToAI, 3000);
        return () => clearInterval(interval);
    }, [stream, onViolation, studentId]);

    return (
        <div className="fixed bottom-6 right-6 w-48 h-36 bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white z-50">
            {error ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
                    <CameraOff className="text-red-500 mb-2" size={24} />
                    <span className="text-[10px] font-bold leading-tight">{error}</span>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                    {/* Live indicator */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-red-600 rounded-full animate-pulse">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Live</span>
                    </div>

                    {/* Face detection status */}
                    <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-bold ${isOk ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'
                        }`}>
                        {aiStatus}
                    </div>
                </>
            )}
        </div>
    );
};

export default WebcamMonitor;
