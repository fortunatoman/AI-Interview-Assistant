import { useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
export type SpeakerId = 'me' | 'them'

export interface TranscriptSegment {
    id: string
    speaker: SpeakerId
    text: string
    isFinal: boolean
    startMs?: number
    endMs?: number
}

interface LiveTranscriptProps {
    segments: TranscriptSegment[]
}

export default function LiveTranscript({ segments }: LiveTranscriptProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    // Build display rows: all finalized utterances (merged by consecutive speaker), plus one latest interim
    const finalizedRows: { key: string; speaker: SpeakerId; text: string; interim?: string }[] = []
    for (const s of segments) {
        if (!s.isFinal) continue
        const last = finalizedRows[finalizedRows.length - 1]
        const incoming = s.text.replace(/\s+/g, ' ').trim()
        const incomingCmp = incoming.toLowerCase()
        if (last && last.speaker === s.speaker) {
            // Prefer the longer phrase when one contains the other to avoid duplicated tails
            const prev = last.text
            const prevCmp = prev.toLowerCase()
            if (incomingCmp.startsWith(prevCmp) || incomingCmp.includes(prevCmp)) {
                last.text = incoming
            } else if (prevCmp.includes(incomingCmp)) {
                last.text = prev
            } else {
                last.text = `${prev} ${incoming}`.replace(/\s+/g, ' ').trim()
            }
        } else {
            finalizedRows.push({ key: s.id, speaker: s.speaker, text: incoming })
        }
    }

    // Find the most recent interim (if any), prefer mic ('me') so your speech is visible while sharing
    let interimRow: { key: string; speaker: SpeakerId; text: string } | null = null
    // First pass: prefer 'me'
    for (let i = segments.length - 1; i >= 0; i--) {
        const s = segments[i]
        if (!s.isFinal && s.speaker === 'me') {
            interimRow = { key: s.id, speaker: s.speaker, text: s.text }
            break
        }
    }
    // Fallback: any interim
    if (!interimRow) {
        for (let i = segments.length - 1; i >= 0; i--) {
            const s = segments[i]
            if (!s.isFinal) {
                interimRow = { key: s.id, speaker: s.speaker, text: s.text }
                break
            }
        }
    }

    useEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [finalizedRows.length, interimRow?.key, interimRow?.text])

    // Build final display rows, concatenating interim text into the latest row of the same speaker
    const displayRows = (() => {
        const rows = finalizedRows.map((r) => ({ ...r }))
        if (interimRow) {
            // find latest finalized row for same speaker
            let idx = -1
            for (let i = rows.length - 1; i >= 0; i--) {
                if (rows[i].speaker === interimRow.speaker) { idx = i; break }
            }
            if (idx >= 0) {
                rows[idx].interim = interimRow.text
            } else {
                rows.push({ key: interimRow.key, speaker: interimRow.speaker, text: '', interim: interimRow.text })
            }
        }
        return rows
    })()

    return (
        <div className="bg-[#2c2c2c] rounded-md shadow-lg border border-gray-500 p-4 h-64 overflow-y-auto" ref={scrollRef}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    Live Transcript
                </h3>
            </div>
            {displayRows.length === 0 ? (
                <p className="text-sm text-gray-500">Live transcript will appear here.</p>
            ) : (
                <div className="space-y-2">
                    {displayRows.map((r) => (
                        <div key={r.key} className="flex gap-2 items-start">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.speaker === 'me' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                                {r.speaker === 'me' ? 'You' : 'Other'}
                            </span>
                            <span className="text-sm text-gray-200">
                                {r.text}
                                {r.interim ? <span className="italic text-gray-400"> {r.interim}</span> : null}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
};