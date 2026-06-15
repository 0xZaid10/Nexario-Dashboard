import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useSessionStore } from '../store/session'

interface Props {
  prompt: string          // pre-filled from last message
  onClose: () => void
  onScheduled: (name: string, schedule: string) => void
}

const FREQUENCIES = [
  { label: 'Every 15 min',  value: 'every:15:minutes' },
  { label: 'Every 30 min',  value: 'every:30:minutes' },
  { label: 'Every hour',    value: 'every:1:hours'    },
  { label: 'Every 6 hours', value: 'every:6:hours'    },
  { label: 'Daily',         value: 'daily:09:00'      },
  { label: 'Weekly',        value: 'weekly:1:09:00'   },
  { label: 'Custom',        value: 'custom'           },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function ScheduleModal({ prompt, onClose, onScheduled }: Props) {
  const { address } = useAccount()
  const { session, apiKey } = useSessionStore()

  const [name, setName] = useState('')
  const [editedPrompt, setEditedPrompt] = useState(prompt)
  const [frequency, setFrequency] = useState('daily:09:00')
  const [customSchedule, setCustomSchedule] = useState('')
  const [dailyTime, setDailyTime] = useState('09:00')
  const [weeklyDay, setWeeklyDay] = useState('1')
  const [weeklyTime, setWeeklyTime] = useState('09:00')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  function buildSchedule(): string {
    if (frequency === 'custom') return customSchedule
    if (frequency === 'daily:09:00') return `daily:${dailyTime.replace(':', ':').padStart(5, '0')}`
    if (frequency === 'weekly:1:09:00') return `weekly:${weeklyDay}:${weeklyTime}`
    return frequency
  }

  function describeSchedule(s: string): string {
    const everyMatch = s.match(/^every:(\d+):(minutes?|hours?)$/)
    if (everyMatch) return `Every ${everyMatch[1]} ${everyMatch[2]}`
    const dailyMatch = s.match(/^daily:(\d{2}):(\d{2})$/)
    if (dailyMatch) return `Daily at ${dailyMatch[1]}:${dailyMatch[2]}`
    const weeklyMatch = s.match(/^weekly:(\d):(\d{2}):(\d{2})$/)
    if (weeklyMatch) return `Every ${DAYS[parseInt(weeklyMatch[1]!) - 1]} at ${weeklyMatch[2]}:${weeklyMatch[3]}`
    return s
  }

  async function handleSchedule() {
    if (!address || !session || !name.trim()) return
    setStatus('saving')
    setError('')

    const schedule = buildSchedule()

    try {
      const res = await fetch('/api/authorize/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Address': address,
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          prompt: editedPrompt.trim(),
          schedule,
        }),
      })

      if (!res.ok) {
        const err = await res.json() as any
        throw new Error(err.error ?? 'Failed to schedule task')
      }

      setStatus('done')
      setTimeout(() => {
        onScheduled(name.trim(), schedule)
        onClose()
      }, 600)
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  const finalSchedule = buildSchedule()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-semibold text-sm text-text">Schedule Recurring Task</h2>
            <p className="text-xs text-muted mt-0.5">Agents run autonomously within your session authorization</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text">✕</button>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-text block mb-1.5">Task Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. daily-eth-analysis"
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-accent/50"
            />
          </div>

          {/* Prompt */}
          <div>
            <label className="text-xs font-medium text-text block mb-1.5">Prompt</label>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={3}
              className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text placeholder-muted focus:outline-none focus:border-accent/50 resize-none"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="text-xs font-medium text-text block mb-1.5">Frequency</label>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={`py-1.5 rounded-md text-xs font-medium transition-colors ${
                    frequency === f.value
                      ? 'bg-white text-black'
                      : 'bg-surface border border-border text-muted hover:text-text'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Daily time picker */}
            {frequency === 'daily:09:00' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">At</span>
                <input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => setDailyTime(e.target.value)}
                  className="bg-bg border border-border rounded px-2 py-1 text-xs text-text font-mono focus:outline-none focus:border-accent/50"
                />
                <span className="text-xs text-muted">UTC</span>
              </div>
            )}

            {/* Weekly picker */}
            {frequency === 'weekly:1:09:00' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted">Every</span>
                <select
                  value={weeklyDay}
                  onChange={(e) => setWeeklyDay(e.target.value)}
                  className="bg-bg border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:border-accent/50"
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={String(i + 1)}>{d}</option>
                  ))}
                </select>
                <span className="text-xs text-muted">at</span>
                <input
                  type="time"
                  value={weeklyTime}
                  onChange={(e) => setWeeklyTime(e.target.value)}
                  className="bg-bg border border-border rounded px-2 py-1 text-xs text-text font-mono focus:outline-none focus:border-accent/50"
                />
                <span className="text-xs text-muted">UTC</span>
              </div>
            )}

            {/* Custom */}
            {frequency === 'custom' && (
              <input
                value={customSchedule}
                onChange={(e) => setCustomSchedule(e.target.value)}
                placeholder="e.g. every:4:hours or daily:14:30"
                className="w-full bg-bg border border-border rounded px-3 py-1.5 text-xs font-mono text-text placeholder-muted focus:outline-none focus:border-accent/50"
              />
            )}
          </div>

          {/* Preview */}
          {finalSchedule && (
            <div className="p-3 rounded-md bg-white/[0.04] border border-white/[0.08] text-xs">
              <div className="text-white/70 font-medium mb-0.5">Schedule preview</div>
              <div className="text-text">{describeSchedule(finalSchedule)}</div>
              <div className="text-muted mt-1">
                Uses your active session authorization. Runs without additional approvals.
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger">{error}</div>
          )}

          {/* CTA */}
          <button
            onClick={handleSchedule}
            disabled={!name.trim() || !address || !session || status === 'saving' || status === 'done'}
            className={`w-full py-2.5 rounded-md font-display font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              status === 'done' ? 'bg-success text-white'
              : status === 'saving' ? 'bg-white/20 text-white cursor-wait'
              : !session ? 'bg-white/[0.06] text-muted cursor-not-allowed'
              : 'bg-white hover:bg-white/90 text-black'
            }`}
          >
            {status === 'done' ? '✓ Scheduled'
              : status === 'saving' ? 'Scheduling…'
              : !session ? 'Authorize session first'
              : '⏰ Schedule Task'}
          </button>

          <p className="text-xs text-muted text-center">
            Autonomous tasks run within your ERC-7715 authorization budget.
            Cancel anytime from the Leasing page.
          </p>
        </div>
      </div>
    </div>
  )
}
