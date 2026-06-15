import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
export default function AudioPlayer({ audioUrl, label = 'Audio Summary' }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio)
            return;
        const onLoaded = () => {
            setDuration(audio.duration);
            setLoaded(true);
        };
        const onTimeUpdate = () => {
            setProgress(audio.currentTime / (audio.duration || 1));
        };
        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
        };
    }, [audioUrl]);
    function togglePlay() {
        const audio = audioRef.current;
        if (!audio)
            return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        }
        else {
            audio.play();
            setIsPlaying(true);
        }
    }
    function handleSeek(e) {
        const audio = audioRef.current;
        if (!audio || !loaded)
            return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pct * audio.duration;
        setProgress(pct);
    }
    function formatTime(secs) {
        if (!isFinite(secs))
            return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    const currentTime = audioRef.current?.currentTime ?? 0;
    return (_jsxs("div", { className: "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface border border-border", children: [_jsx("audio", { ref: audioRef, src: audioUrl, preload: "metadata" }), _jsx("button", { onClick: togglePlay, className: "w-7 h-7 rounded-full bg-accent2/20 hover:bg-accent2/30 flex items-center justify-center shrink-0 transition-colors", title: isPlaying ? 'Pause' : 'Play audio summary', children: isPlaying ? (_jsxs("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "#06B6D4", children: [_jsx("rect", { x: "1", y: "1", width: "3", height: "8", rx: "0.5" }), _jsx("rect", { x: "6", y: "1", width: "3", height: "8", rx: "0.5" })] })) : (_jsx("svg", { width: "10", height: "10", viewBox: "0 0 10 10", fill: "#06B6D4", children: _jsx("path", { d: "M2 1.5L9 5L2 8.5V1.5Z" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [_jsx("span", { className: "text-xs text-muted", children: label }), _jsxs("span", { className: "text-xs font-mono text-muted", children: [formatTime(currentTime), " / ", formatTime(duration)] })] }), _jsx("div", { className: "relative h-5 cursor-pointer group", onClick: handleSeek, children: _jsx("div", { className: "absolute inset-0 flex items-center gap-px overflow-hidden rounded-sm", children: Array.from({ length: 48 }).map((_, i) => {
                                const height = 20 + Math.sin(i * 0.7) * 12 + Math.sin(i * 1.3) * 8;
                                const isPast = i / 48 <= progress;
                                return (_jsx("div", { className: "flex-1 rounded-sm transition-colors duration-100", style: {
                                        height: `${height}%`,
                                        background: isPast
                                            ? '#06B6D4'
                                            : isPlaying
                                                ? `rgba(6,182,212,${0.15 + Math.sin(i * 0.5 + Date.now() / 200) * 0.1})`
                                                : 'rgba(6,182,212,0.2)',
                                    } }, i));
                            }) }) })] }), _jsxs("div", { className: "shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent2/10", children: [_jsx("div", { className: "w-1 h-1 rounded-full bg-accent2" }), _jsx("span", { className: "text-xs text-accent2 font-medium", children: "TTS" })] })] }));
}
