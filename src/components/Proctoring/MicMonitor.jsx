import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

const MicMonitor = ({ onViolation }) => {
    const [audioLevel, setAudioLevel] = useState(0);
    const [micActive, setMicActive] = useState(false);
    const [error, setError] = useState(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const silenceCountRef = useRef(0);
    const talkingCountRef = useRef(0);

    useEffect(() => {
        const startMicrophone = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });

                streamRef.current = stream;
                setMicActive(true);

                // Create audio context and analyser
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);

                analyser.fftSize = 256;
                source.connect(analyser);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;

                // Start monitoring
                monitorAudio();
            } catch (err) {
                console.error("Microphone Access Error:", err);
                setError("Microphone access is required for this exam.");
                onViolation('microphone_disabled');
            }
        };


        const checkAudio = () => {
            if (!analyser) return;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);

            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;

            setAudioLevel(average);

            // AI-based Voice Detection Logic
            // In a real implementation with streaming, we would send audio chunks to the server.
            // For now, we simulate AI detection based on frequency patterns which is more robust than simple volume.

            // Human voice frequency range is typically 85Hz - 255Hz
            // FFT Size 256 @ 44.1kHz sample rate => each bin is ~172Hz
            // Bins 0-2 contain valid voice fundamental frequencies

            const voiceBinEnergy = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;
            const highFreqEnergy = (dataArray[10] + dataArray[11] + dataArray[12]) / 3; // Noise?

            // Simple heuristic to distinguish voice from background noise
            const isVoice = voiceBinEnergy > 20 && (voiceBinEnergy > highFreqEnergy * 1.5);

            if (isVoice) {
                talkingCountRef.current++;
                silenceCountRef.current = 0;

                if (talkingCountRef.current >= 40) { // ~2 seconds of continuous talking
                    console.log("⚠️ AI Detected Sustained Voice Activity");
                    onViolation('ai_voice_detected');
                    talkingCountRef.current = 0;
                }
            } else {
                talkingCountRef.current = Math.max(0, talkingCountRef.current - 1); // Decay
                if (average < 5) silenceCountRef.current++;
            }

            requestAnimationFrame(checkAudio);
        };

        checkAudio();

        startMicrophone();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [onViolation]);

    return (
        <div className="fixed bottom-6 right-56 w-48 h-36 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-white z-50">
            {error ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center">
                    <MicOff className="text-red-500 mb-2" size={24} />
                    <span className="text-[10px] font-bold leading-tight">{error}</span>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    {/* Mic Icon */}
                    <div className="relative mb-3">
                        {micActive ? (
                            <Mic className="text-white" size={32} />
                        ) : (
                            <MicOff className="text-red-500" size={32} />
                        )}
                        {audioLevel > 20 && (
                            <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        )}
                    </div>

                    {/* Audio Level Bar */}
                    <div className="w-full bg-black/30 rounded-full h-3 mb-2 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-100 ${audioLevel > 80 ? 'bg-red-500' :
                                audioLevel > 40 ? 'bg-yellow-500' :
                                    audioLevel > 10 ? 'bg-green-500' :
                                        'bg-gray-500'
                                }`}
                            style={{ width: `${Math.min(audioLevel, 100)}%` }}
                        />
                    </div>

                    {/* Status Text */}
                    <div className="text-center">
                        <div className="text-[10px] font-black text-white uppercase tracking-wider">
                            {audioLevel < 5 ? '🔇 Silent' :
                                audioLevel > 80 ? '🔊 Loud' :
                                    audioLevel > 20 ? '🎤 Active' :
                                        '🔉 Low'}
                        </div>
                        <div className="text-[8px] text-white/70 mt-1">
                            Level: {Math.round(audioLevel)}
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-purple-600 rounded-full">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Mic</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MicMonitor;
