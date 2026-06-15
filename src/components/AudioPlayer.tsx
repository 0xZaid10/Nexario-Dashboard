import { useState, useRef, useEffect } from 'react'

interface Props {
  audioUrl: string
  label?: string
}

export default function AudioPlayer({ audioUrl, label = 'Audio Summary' }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoaded = () => {
      setDuration(audio.duration)
      setLoaded(true)
    }
    const onTimeUpdate = () => {
      setProgress(audio.currentTime / (audio.duration || 1))
    }
    const onEnded = () => {
      setIsPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [audioUrl])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !loaded) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * audio.duration
    setProgress(pct)
  }

  function formatTime(secs: number): string {
    if (!isFinite(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const currentTime = audioRef.current?.currentTime ?? 0

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface border border-border">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/pause button */}
      <button
        onClick={togglePlay}
        className="w-7 h-7 rounded-full bg-accent2/20 hover:bg-accent2/30 flex items-center justify-center shrink-0 transition-colors"
        title={isPlaying ? 'Pause' : 'Play audio summary'}
      >
        {isPlaying ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="#06B6D4">
            <rect x="1" y="1" width="3" height="8" rx="0.5"/>
            <rect x="6" y="1" width="3" height="8" rx="0.5"/>
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="#06B6D4">
            <path d="M2 1.5L9 5L2 8.5V1.5Z"/>
          </svg>
        )}
      </button>

      {/* Label + waveform bars */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted">{label}</span>
          <span className="text-xs font-mono text-muted">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Progress bar + waveform visual */}
        <div
          className="relative h-5 cursor-pointer group"
          onClick={handleSeek}
        >
          {/* Waveform bars (decorative) */}
          <div className="absolute inset-0 flex items-center gap-px overflow-hidden rounded-sm">
            {Array.from({ length: 48 }).map((_, i) => {
              const height = 20 + Math.sin(i * 0.7) * 12 + Math.sin(i * 1.3) * 8
              const isPast = i / 48 <= progress
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-colors duration-100"
                  style={{
                    height: `${height}%`,
                    background: isPast
                      ? '#06B6D4'
                      : isPlaying
                      ? `rgba(6,182,212,${0.15 + Math.sin(i * 0.5 + Date.now() / 200) * 0.1})`
                      : 'rgba(6,182,212,0.2)',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Venice badge */}
      <div className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent2/10">
        <div className="w-1 h-1 rounded-full bg-accent2" />
        <span className="text-xs text-accent2 font-medium">TTS</span>
      </div>
    </div>
  )
}
