import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { sound } from './audio'
import { Avatar } from './Avatar'

const socket = io()

const CH = [
  { n: 'Vega', role: 'Cryptanalyst', c: '#6fd3e8' },
  { n: 'Raven', role: 'Field Operative', c: '#e8707e' },
  { n: 'Cipher', role: 'Station Liaison', c: '#e6b84f' }
]

function getSessionToken() {
  try {
    let token = localStorage.getItem('da_token')
    if (!token) {
      token = 'agent_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36)
      localStorage.setItem('da_token', token)
    }
    return token
  } catch {
    return 'agent_' + Math.random().toString(36).substring(2, 11)
  }
}

function useCountdown(at) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const f = () => setT(Math.max(0, Math.ceil((at - Date.now()) / 1000)))
    f()
    const i = setInterval(f, 500)
    return () => clearInterval(i)
  }, [at])
  return t
}

export default function App() {
  const [s, setS] = useState(null)
  const [err, setErr] = useState('')
  const [showBrief, setShowBrief] = useState(false)
  const [soundMuted, setSoundMuted] = useState(() => sound.isMuted())

  useEffect(() => {
    socket.on('state', st => setS({ ...st, at: Date.now() + st.timeLeft }))

    const savedCode = localStorage.getItem('da_code')
    const savedName = localStorage.getItem('da_name')
    if (savedCode) {
      socket.emit('join', { name: savedName || 'Operative', code: savedCode, sessionToken: getSessionToken() }, r => {
        if (r?.error) localStorage.removeItem('da_code')
      })
    }

    return () => socket.off('state')
  }, [])

  const toggleSound = () => {
    const isNowMuted = sound.toggleMute()
    setSoundMuted(isNowMuted)
    if (!isNowMuted) sound.playClick()
  }

  const emit = (e, d) => {
    setErr('')
    const token = getSessionToken()
    socket.emit(e, { ...d, sessionToken: token }, r => {
      if (r?.error) {
        setErr(r.error)
      } else {
        if (r?.code) localStorage.setItem('da_code', r.code)
        if (d?.name) localStorage.setItem('da_name', d.name)
        if (r?.sessionToken) localStorage.setItem('da_token', r.sessionToken)
      }
    })
  }

  const handleQuickPlay = () => {
    sound.playStamp()
    const token = getSessionToken()
    socket.emit('create', { name: 'Operative', sessionToken: token }, r => {
      if (r?.ok) {
        localStorage.setItem('da_code', r.code)
        setTimeout(() => socket.emit('start'), 300)
      }
    })
  }

  return (
    <>
      {!s && (
        <Splash
          onQuickPlay={handleQuickPlay}
          emit={emit}
          err={err}
          setErr={setErr}
          onOpenBrief={() => setShowBrief(true)}
          soundMuted={soundMuted}
          onToggleSound={toggleSound}
        />
      )}
      {s?.phase === 'lobby' && (
        <Lobby
          s={s}
          emit={emit}
          soundMuted={soundMuted}
          onToggleSound={toggleSound}
          onOpenBrief={() => setShowBrief(true)}
        />
      )}
      {s?.phase === 'act' && (
        <FieldOperations
          s={s}
          emit={emit}
          soundMuted={soundMuted}
          onToggleSound={toggleSound}
          onOpenBrief={() => setShowBrief(true)}
        />
      )}
      {s?.phase === 'brief' && (
        <DebriefScreen
          s={s}
          emit={emit}
          soundMuted={soundMuted}
          onToggleSound={toggleSound}
          onOpenBrief={() => setShowBrief(true)}
        />
      )}
      {s?.phase === 'verdict' && (
        <VerdictScreen
          s={s}
          emit={emit}
          soundMuted={soundMuted}
          onToggleSound={toggleSound}
          onOpenBrief={() => setShowBrief(true)}
        />
      )}
      {s?.phase === 'final' && (
        <FinalReveal
          s={s}
          emit={emit}
          soundMuted={soundMuted}
          onToggleSound={toggleSound}
        />
      )}

      {showBrief && <MissionBriefModal onClose={() => setShowBrief(false)} />}
    </>
  )
}

function TopHeader({ s, label, soundMuted, onToggleSound, onOpenBrief }) {
  const t = useCountdown(s.at)
  const isUrgent = t <= 15 && t > 0

  useEffect(() => {
    if (isUrgent && s.phase === 'verdict') {
      sound.playHeartbeat()
    }
  }, [t, isUrgent, s.phase])

  return (
    <header className="top">
      <div className="top-left">
        <span className="brand">THE DOUBLE AGENT</span>
        <div className="pips" aria-label={`Round ${s.round} of ${s.total}`}>
          {Array.from({ length: s.total }, (_, i) => (
            <span key={i} className={'pip' + (i + 1 < s.round ? ' done' : i + 1 === s.round ? ' now' : '')} />
          ))}
        </div>
      </div>
      <div className="top-right">
        <button type="button" className="btn-header" onClick={onOpenBrief}>
          ❓ Help
        </button>
        <button type="button" className="btn-header" onClick={onToggleSound}>
          {soundMuted ? '🔇 Muted' : '🔊 Audio'}
        </button>
        <span style={{ fontSize: '.85rem', color: 'var(--mute)' }}>{label}</span>
        <span className={'clock' + (isUrgent ? ' danger' : '')}>
          {String(Math.floor(t / 60)).padStart(2, '0')}:{String(t % 60).padStart(2, '0')}
        </span>
      </div>
    </header>
  )
}

function Splash({ onQuickPlay, emit, err, setErr, onOpenBrief, soundMuted, onToggleSound }) {
  const [showMulti, setShowMulti] = useState(false)
  const [name, setName] = useState(() => localStorage.getItem('da_name') || 'Agent')
  const [code, setCode] = useState(() => localStorage.getItem('da_code') || '')

  return (
    <div className="splash">
      <div className="radar" aria-hidden />
      <div className="splash-card">
        <div className="stamp">TOP SECRET</div>
        <h1>The Double Agent</h1>
        <p className="tag">
          One of three contacts is secretly an enemy spy. You have 3 rounds to interrogate, wiretap, and expose the traitor.
        </p>

        <div className="quickplay-box">
          <button type="button" className="btn-quickplay" onClick={onQuickPlay}>
            ⚡ QUICK PLAY (Start Solo Mission)
          </button>
          <small style={{ color: '#635338' }}>Instant launch · 3 fast rounds · Zero setup</small>
        </div>

        <div className="multi-toggle">
          <button
            type="button"
            style={{ background: 'none', border: 'none', textDecoration: 'underline', color: '#524731', cursor: 'pointer' }}
            onClick={() => setShowMulti(!showMulti)}
          >
            {showMulti ? '▲ Hide multiplayer options' : '▼ Play with friends on local network / room code'}
          </button>
        </div>

        {showMulti && (
          <div style={{ display: 'grid', gap: '.8rem', background: 'rgba(0,0,0,0.04)', padding: '.9rem', borderRadius: '4px' }}>
            <input
              placeholder="Your Codename"
              maxLength={14}
              value={name}
              onChange={e => { setName(e.target.value); setErr('') }}
            />
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button
                type="button"
                className="btn primary"
                style={{ flex: 1 }}
                onClick={() => { sound.playStamp(); emit('create', { name }) }}
              >
                Host Safehouse
              </button>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <input
                placeholder="4-LETTER CODE"
                maxLength={4}
                value={code}
                style={{ width: '8rem', textTransform: 'uppercase', textAlign: 'center', fontFamily: 'var(--type)' }}
                onChange={e => { setCode(e.target.value.toUpperCase().trim()); setErr('') }}
              />
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                onClick={() => { sound.playStamp(); emit('join', { name, code }) }}
              >
                Join Safehouse
              </button>
            </div>
          </div>
        )}

        {err && <div style={{ color: 'var(--red)', fontSize: '.9rem', textAlign: 'center' }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '.5rem', borderTop: '1px solid var(--paper-dk)' }}>
          <button type="button" className="btn" style={{ fontSize: '.8rem', padding: '.3rem .6rem' }} onClick={onOpenBrief}>
            ❓ How to Play
          </button>
          <button type="button" className="btn" style={{ fontSize: '.8rem', padding: '.3rem .6rem' }} onClick={onToggleSound}>
            {soundMuted ? '🔇 Audio Off' : '🔊 Audio On'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Lobby({ s, emit, soundMuted, onToggleSound, onOpenBrief }) {
  const [copied, setCopied] = useState(false)
  const copyCode = () => {
    sound.playClick()
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(s.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="splash">
      <div className="radar" aria-hidden />
      <div className="splash-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Safehouse: {s.code}</h2>
          <button type="button" className="btn" style={{ fontSize: '.8rem', padding: '.3rem .6rem' }} onClick={onToggleSound}>
            {soundMuted ? '🔇' : '🔊'}
          </button>
        </div>
        <p className="tag">Share this 4-letter code with other operatives to hunt the traitor together.</p>
        <div className="roomcode">{s.code}</div>
        <button type="button" className="btn" onClick={copyCode}>
          {copied ? '✔ Copied to clipboard' : 'Copy invite code'}
        </button>

        <ul className="roster">
          {s.players.map(p => (
            <li key={p.id}>
              <span style={{ display: 'inline-block', width: '.6rem', height: '.6rem', borderRadius: '50%', background: p.color || '#38bdf8', marginRight: '.5rem' }} />
              {p.name} {p.host && '(Host)'} {p.id === s.you && '(You)'}
            </li>
          ))}
        </ul>

        {s.host ? (
          <button
            type="button"
            className="btn primary"
            style={{ fontSize: '1.1rem', padding: '.8rem' }}
            onClick={() => { sound.playStamp(); emit('start') }}
          >
            ⚡ Begin Operation
          </button>
        ) : (
          <p style={{ textAlign: 'center', color: '#524731' }}>Waiting for host to begin…</p>
        )}
      </div>
    </div>
  )
}

function FieldOperations({ s, emit, soundMuted, onToggleSound, onOpenBrief }) {
  const { me } = s
  const locked = !!me.action
  const [selectedMove, setSelectedMove] = useState(null)
  const [selectedTarget, setSelectedTarget] = useState(null)

  const intel = me.intel
  const round = s.round

  // Extract all clues that belong to each suspect
  const allEvents = [...(me.lastEvents || []), ...(me.events || [])]
  const cluesBySuspect = CH.map((_, i) => {
    const list = []
    if (intel && intel.subject === i) {
      list.push({ text: intel.text, sus: intel.sus, kind: 'intel' })
    }
    allEvents.forEach(ev => {
      if (ev.char === i) {
        list.push({ text: ev.text, sus: ev.tone === 'bad', kind: ev.kind })
      }
    })
    return list
  })

  const handlePickAction = (actionType, targetIdx) => {
    sound.playClick()
    setSelectedMove(actionType)
    setSelectedTarget(targetIdx)
  }

  const handleExecute = () => {
    if (!selectedMove) return
    if (selectedMove === 'wiretap') sound.playWiretap()
    else if (selectedMove === 'interrogate') sound.playBuzzer()
    else if (selectedMove === 'tail') sound.playShutter()
    else sound.playStamp()

    // Map to server actions: 'accuse' = interrogate, 'investigate' = tail, 'wiretap' = wiretap
    const serverType = selectedMove === 'interrogate' ? 'accuse' : selectedMove === 'tail' ? 'investigate' : selectedMove
    emit('act', { type: serverType, target: selectedTarget })
  }

  const handleGoDark = () => {
    sound.playClick()
    setSelectedMove('hide')
    setSelectedTarget(null)
  }

  const isSelected = (act, target) => selectedMove === act && selectedTarget === target

  return (
    <div className="field">
      <TopHeader
        s={s}
        label={`Round ${round} of 3`}
        soundMuted={soundMuted}
        onToggleSound={onToggleSound}
        onOpenBrief={onOpenBrief}
      />

      {intel && (
        <div className="flash-banner">
          <span className="flash-badge">⚡ INCOMING INTEL</span>
          <span className="flash-text">{intel.text}</span>
        </div>
      )}

      <main className="stage">
        <div className="suspects-grid">
          {CH.map((c, i) => {
            const prob = me.post[i]
            const pct = Math.round(prob * 100)
            const isPrime = pct >= 45
            const isLow = pct <= 25
            const clues = cluesBySuspect[i]
            const hasTargetSelection = selectedTarget === i

            return (
              <div
                key={i}
                className={'suspect-station' + (hasTargetSelection ? ' active-target' : '')}
                style={{ '--c': c.c }}
              >
                <div className="station-header">
                  <Avatar charIdx={i} size="md" glow={isPrime} />
                  <div className="station-meta">
                    <h3>{c.n}</h3>
                    <small>{c.role}</small>
                    <div>
                      <span className={'threat-badge ' + (isPrime ? 'high' : isLow ? 'low' : 'mid')}>
                        {isPrime ? '🔥 PRIME SUSPECT' : isLow ? '🛡️ LOW THREAT' : '⚠️ GUARDED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detector-wrap">
                  <div className="detector-info">
                    <span>LIE-DETECTOR SUSPICION</span>
                    <b style={{ color: isPrime ? 'var(--bad)' : isLow ? 'var(--good)' : 'var(--brass)' }}>
                      {pct}%
                    </b>
                  </div>
                  <div className="detector-bar">
                    <div
                      className="detector-fill"
                      style={{
                        width: pct + '%',
                        background: isPrime ? 'var(--bad)' : isLow ? 'var(--good)' : 'var(--brass)'
                      }}
                    />
                  </div>
                </div>

                <div className="evidence-box">
                  <span className="evidence-title">LOGGED DOSSIER ON {c.n.toUpperCase()}</span>
                  {clues.length > 0 ? (
                    clues.map((cl, cIdx) => (
                      <div key={cIdx} className={'clue-tag ' + (cl.sus ? 'sus' : 'clean')}>
                        {cl.text}
                      </div>
                    ))
                  ) : (
                    <div className="clue-empty">No direct evidence logged on {c.n} yet.</div>
                  )}
                </div>

                {!locked ? (
                  <div className="moves-grid">
                    <button
                      type="button"
                      className={'btn-move' + (isSelected('interrogate', i) ? ' on' : '')}
                      onClick={() => handlePickAction('interrogate', i)}
                      title="Interrogate suspect under bright lights"
                    >
                      <span className="ic">🔍</span>
                      <span>Interrogate</span>
                    </button>
                    <button
                      type="button"
                      className={'btn-move' + (isSelected('wiretap', i) ? ' on' : '')}
                      onClick={() => handlePickAction('wiretap', i)}
                      title="Plant encrypted audio transmitter in their office"
                    >
                      <span className="ic">🎙️</span>
                      <span>Wiretap</span>
                    </button>
                    <button
                      type="button"
                      className={'btn-move' + (isSelected('tail', i) ? ' on' : '')}
                      onClick={() => handlePickAction('tail', i)}
                      title="Tail suspect to verify their movements and alibis"
                    >
                      <span className="ic">🕵️</span>
                      <span>Tail Alibi</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--mute)' }}>
                    Orders locked for this round.
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="command-bar">
          <div className="command-info">
            {!locked ? (
              <>
                <button
                  type="button"
                  className={'btn-godark' + (selectedMove === 'hide' ? ' on' : '')}
                  onClick={handleGoDark}
                >
                  🕶️ Go Dark (Observe quietly)
                </button>
                <span>
                  Planned order:{' '}
                  <b>
                    {selectedMove === 'hide'
                      ? 'Go Dark & Observe'
                      : selectedMove
                      ? `${selectedMove.toUpperCase()} on ${CH[selectedTarget]?.n}`
                      : 'None selected yet'}
                  </b>
                </span>
              </>
            ) : (
              <span>
                <b>Orders Locked:</b> Executing move. Waiting on other operatives…
              </span>
            )}
          </div>

          {!locked && (
            <button
              type="button"
              className="btn primary"
              style={{ fontSize: '1rem', padding: '.7rem 1.6rem' }}
              disabled={!selectedMove}
              onClick={handleExecute}
            >
              ⚡ CONFIRM & EXECUTE
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

function DebriefScreen({ s, emit, soundMuted, onToggleSound, onOpenBrief }) {
  const { me } = s
  const isFinalRound = s.round >= s.total

  useEffect(() => {
    sound.playDossier()
  }, [])

  return (
    <div className="field">
      <TopHeader
        s={s}
        label={`Round ${s.round} Debrief`}
        soundMuted={soundMuted}
        onToggleSound={onToggleSound}
        onOpenBrief={onOpenBrief}
      />

      <main className="debrief-stage">
        <div className="debrief-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="debrief-headline">Round {s.round} Intelligence Debrief</h2>
            <span className="stamp">CONFIDENTIAL</span>
          </div>
          <p style={{ color: 'var(--mute)', margin: 0 }}>
            Here is what your field operations uncovered this round:
          </p>

          <ul className="debrief-events">
            {me.events.map((e, idx) => (
              <li key={idx} className={'debrief-item ' + (e.tone || 'good')}>
                <span style={{ fontSize: '1.2rem' }}>
                  {e.kind === 'wiretap' ? '🎙️' : e.kind === 'reaction' ? '🎭' : e.kind === 'result' ? '🔍' : '📋'}
                </span>
                <div>{e.text}</div>
              </li>
            ))}
          </ul>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.8rem', margin: '.5rem 0' }}>
            {CH.map((c, i) => {
              const pct = Math.round(me.post[i] * 100)
              const isPrime = pct >= 45
              return (
                <div key={i} style={{ background: 'var(--ink)', padding: '.6rem', borderRadius: '4px', textAlign: 'center', borderLeft: `3px solid ${c.c}` }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{c.n}</div>
                  <div style={{ fontSize: '1.3rem', fontFamily: 'var(--type)', color: isPrime ? 'var(--bad)' : 'var(--brass)' }}>
                    {pct}%
                  </div>
                  <small style={{ fontSize: '.75rem', color: 'var(--mute)' }}>
                    {isPrime ? 'High Threat' : 'Suspicion'}
                  </small>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            className="btn primary wide"
            style={{ fontSize: '1.1rem', padding: '.8rem' }}
            disabled={me.ready}
            onClick={() => { sound.playStamp(); emit('ready') }}
          >
            {me.ready ? 'Waiting for others…' : isFinalRound ? '🚨 PROCEED TO FINAL ACCUSATION' : 'Next Round →'}
          </button>
        </div>
      </main>
    </div>
  )
}

function VerdictScreen({ s, emit, soundMuted, onToggleSound, onOpenBrief }) {
  const [pick, setPick] = useState(null)
  const [conf, setConf] = useState(75)
  const v = s.me.verdict

  useEffect(() => {
    sound.playHeartbeat()
    const timer = setInterval(() => sound.playHeartbeat(), 2400)
    return () => clearInterval(timer)
  }, [])

  const handlePick = i => {
    sound.playClick()
    setPick(i)
  }

  const handleSeal = () => {
    sound.playStamp()
    emit('verdict', { target: pick, confidence: conf })
  }

  return (
    <div className="field">
      <TopHeader
        s={s}
        label="Final Call"
        soundMuted={soundMuted}
        onToggleSound={onToggleSound}
        onOpenBrief={onOpenBrief}
      />

      <main className="verdict-stage">
        <h1 className="verdict-title">WHO IS THE DOUBLE AGENT?</h1>
        <p style={{ color: 'var(--mute)', maxWidth: '42rem', margin: '0 auto' }}>
          Operations are complete. Name the traitor. If you are correct, the Bureau is saved. If you guess wrong, your cover is blown.
        </p>

        <div className="suspects-verdict-grid">
          {CH.map((c, i) => {
            const isChosen = (v ? v.target : pick) === i
            const pct = Math.round(s.me.post[i] * 100)

            return (
              <button
                key={i}
                type="button"
                disabled={!!v}
                className={'btn-verdict-card' + (isChosen ? ' chosen' : '')}
                style={{ '--c': c.c }}
                onClick={() => handlePick(i)}
              >
                <Avatar charIdx={i} size="lg" glow={isChosen} />
                <h3 style={{ fontSize: '1.3rem', margin: '.3rem 0 0' }}>{c.n}</h3>
                <small style={{ color: 'var(--mute)' }}>{c.role}</small>
                <div style={{ fontFamily: 'var(--type)', fontSize: '1.1rem', color: 'var(--brass)' }}>
                  {pct}% Suspicion
                </div>
              </button>
            )
          })}
        </div>

        <div className="conf-selector">
          <span>Confidence Level:</span>
          {[50, 75, 95].map(val => (
            <button
              key={val}
              type="button"
              disabled={!!v}
              className={'conf-btn' + (conf === val ? ' active' : '')}
              onClick={() => { sound.playClick(); setConf(val) }}
            >
              {val}% {val === 95 ? '🔥 Certain' : val === 75 ? 'Confident' : 'Hunch'}
            </button>
          ))}
        </div>

        {v ? (
          <div style={{ color: 'var(--good)', fontSize: '1.1rem', fontFamily: 'var(--type)' }}>
            ✔ VERDICT SEALED. CALCULATING BUREAU OUTCOME…
          </div>
        ) : (
          <button
            type="button"
            className="btn primary"
            style={{ fontSize: '1.2rem', padding: '.9rem 2.5rem', margin: '0 auto' }}
            disabled={pick === null}
            onClick={handleSeal}
          >
            💥 EXPOSE THE TRAITOR
          </button>
        )}
      </main>
    </div>
  )
}

function FinalReveal({ s, emit, soundMuted, onToggleSound }) {
  const { da, results = [] } = s.final || {}
  const mine = results.find(r => r.id === s.you) || results[0] || { verdict: null, score: 0 }
  const won = mine.verdict?.target === da
  const traitor = CH[da] || CH[0]

  useEffect(() => {
    if (won) sound.playWin()
    else sound.playLose()
  }, [won])

  return (
    <div className="field">
      <header className="top">
        <span className="brand">OPERATION CONCLUDED</span>
        <button type="button" className="btn-header" onClick={onToggleSound}>
          {soundMuted ? '🔇' : '🔊'}
        </button>
      </header>

      <main className="final-stage">
        <div className={'reveal-box ' + (won ? 'win' : 'lose')}>
          <div className="stamp" style={{ borderColor: won ? 'var(--good)' : 'var(--bad)', color: won ? 'var(--good)' : 'var(--bad)', position: 'static' }}>
            {won ? 'TRAITOR EXPOSED' : 'COVER BLOWN'}
          </div>

          <Avatar charIdx={da} size="huge" glow={true} />

          <h1 style={{ fontSize: '2.4rem', margin: '.2rem 0' }}>
            {traitor.n} was the Double Agent!
          </h1>
          <p style={{ color: 'var(--mute)', maxWidth: '36rem' }}>
            {won
              ? 'Outstanding work, Operative. You caught the deception, exposed the traitor, and protected Bureau intelligence.'
              : 'The traitor slipped through. The leak remains open and foreign intelligence intercepted your communications.'}
          </p>

          <div style={{ display: 'flex', gap: '2rem', padding: '1rem', background: 'var(--ink)', borderRadius: '4px', margin: '.5rem 0' }}>
            <div>
              <small style={{ color: 'var(--mute)' }}>Your Call</small>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {mine.verdict ? CH[mine.verdict.target]?.n : 'None'} ({mine.verdict?.confidence || 0}%)
              </div>
            </div>
            <div>
              <small style={{ color: 'var(--mute)' }}>Bureau Score</small>
              <div style={{ fontSize: '1.4rem', fontFamily: 'var(--type)', color: won ? 'var(--good)' : 'var(--bad)' }}>
                {mine.score} PTS
              </div>
            </div>
          </div>

          {s.host ? (
            <button
              type="button"
              className="btn primary"
              style={{ fontSize: '1.1rem', padding: '.8rem 2rem', marginTop: '.5rem' }}
              onClick={() => { sound.playStamp(); emit('rematch') }}
            >
              🔄 Launch New Mission
            </button>
          ) : (
            <p style={{ color: 'var(--mute)' }}>Waiting for handler to launch next mission…</p>
          )}
        </div>
      </main>
    </div>
  )
}

function MissionBriefModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button type="button" className="btn-close" onClick={onClose}>✕</button>
        <h2>Mission Briefing: How to Play</h2>

        <div className="rule-item">
          <span className="rule-num">1</span>
          <div>
            <b>One of the 3 contacts is a traitor:</b>
            <p style={{ margin: '.2rem 0 0', color: 'var(--mute)' }}>
              Vega, Raven, or Cipher is secretly feeding classified cables to enemy handlers.
            </p>
          </div>
        </div>

        <div className="rule-item">
          <span className="rule-num">2</span>
          <div>
            <b>3 Rounds of Field Operations:</b>
            <p style={{ margin: '.2rem 0 0', color: 'var(--mute)' }}>
              Each round brings new incoming intel. Pick 1 action to test suspects: <b>Interrogate</b> under pressure, plant an audio <b>Wiretap</b>, or <b>Tail their Alibi</b>.
            </p>
          </div>
        </div>

        <div className="rule-item">
          <span className="rule-num">3</span>
          <div>
            <b>Watch the Lie Detector & Expose Them:</b>
            <p style={{ margin: '.2rem 0 0', color: 'var(--mute)' }}>
              Their Suspicion % updates based on the clues you uncover. After Round 3, name the Double Agent and claim your score!
            </p>
          </div>
        </div>

        <button type="button" className="btn primary" style={{ marginTop: '.5rem' }} onClick={onClose}>
          Understood, Agent
        </button>
      </div>
    </div>
  )
}
