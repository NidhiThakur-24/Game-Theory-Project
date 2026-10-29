export const NAMES = ['Vega', 'Raven', 'Cipher']

const rnd = a => a[Math.floor(Math.random() * a.length)]
const norm = a => { const s = a.reduce((x, y) => x + y, 0); return a.map(v => v / s) }
const bayes = (post, lik) => norm(post.map((p, i) => p * lik[i]))
const pick = w => { let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i } return w.length - 1 }
const sig = (t, sus, r) => [0, 1, 2].map(h => ((h === t) === sus ? r : 1 - r))

const POOL = [0.72, 0.16, 0.12]
const NOM_DA = [0.55, 0.15, 0.30]
const EXPLOIT = [0.5, 0.1, 0.4]

const SUS = [
  n => `🚨 EXFILTRATION: Midnight encrypted transmission traced to ${n}'s terminal.`,
  n => `🚨 SPOTTED: ${n} photographed passing sealed envelope to foreign agent at Pier 4.`,
  n => `🚨 VAULT BREACH: ${n}'s keycard accessed classified courier manifests at 03:00.`,
  n => `🚨 MICROFILM: Enemy cipher capsule discovered concealed in ${n}'s office.`,
  n => `🚨 BURNER SIGNAL: Foreign relay pinged within 10 meters of ${n}'s vehicle.`
]
const CLEAN = [
  n => `🛡️ VERIFIED ALIBI: Embassy cameras confirm ${n} was in secure briefing during leak.`,
  n => `🛡️ CLEAN AUDIT: Forensic examination found zero foreign bank accounts for ${n}.`,
  n => `🛡️ CORROBORATED: Station Chief confirmed ${n} was on site during courier ambush.`,
  n => `🛡️ EYEWITNESS: Three Bureau guards confirm ${n}'s alibi during file breach.`,
  n => `🛡️ POLYGRAPH CLEAR: ${n} passed baseline lie-detector audit with normal heart rate.`
]
const SAYS = [
  (c, t) => `💬 ${c}: "${t} is lying. I caught them copying dispatch cables yesterday."`,
  (c, t) => `💬 ${c} slides a note: "Watch ${t}. Something is deeply wrong there."`,
  (c, t) => `💬 ${c}: "${t} accessed files outside their clearance last night."`,
  (c, t) => `💬 ${c}: "I overheard ${t} whispering on an unauthorized frequency."`
]
const SILENT = c => `🔇 ${c} refused to speak. Went completely silent under questioning.`
const PROBE = c => `⚠️ ${c} became visibly agitated and deflected all questions.`

export function newPlayer(id, name, color, sessionToken = null) {
  const prior = [1 / 3, 1 / 3, 1 / 3]
  return {
    id,
    name,
    color,
    sessionToken: sessionToken || id,
    connected: true,
    post: prior,
    trace: [prior],
    resources: 3,
    integrity: 100,
    gadgets: { wiretap: 1, disinfo: 1, decrypt: 1 },
    alert: [0, 0, 0],
    events: [],
    lastEvents: [],
    log: [],
    intel: null,
    action: null,
    ready: false,
    verdict: null,
    score: 0,
    scoreBreakdown: null
  }
}

const LOCATIONS = ['Vault B Archives', 'Harbour Pier 4', 'Teletype Office', 'North Gate Checkpoint', 'Consulate Radio Room', 'Embassy Annex']
const TIMES = ['01:15 AM', '02:40 AM', '23:30 PM', '04:10 AM', '19:45 PM', '12:20 PM']
const CATEGORIES = ['Signals Intel', 'Surveillance Log', 'Vault Log', 'Defector Debrief', 'Forensic Audit']

export function dealIntel(room, p) {
  const subject = Math.floor(Math.random() * 3)
  const r = rnd([0.6, 0.7, 0.8])
  const sus = Math.random() < (subject === room.da ? r : 1 - r)
  p.post = bayes(p.post, sig(subject, sus, r))
  p.intel = {
    id: `clue_r${room.round}_${subject}_${Math.random().toString(36).slice(2, 6)}`,
    subject,
    sus,
    r,
    grade: r === 0.8 ? 'A' : r === 0.7 ? 'B' : 'C',
    text: (sus ? rnd(SUS) : rnd(CLEAN))(NAMES[subject]),
    location: rnd(LOCATIONS),
    time: rnd(TIMES),
    category: rnd(CATEGORIES),
    round: room.round
  }
  p.lastEvents = p.events.slice()
  p.events = []
}

export function resolvePlayer(room, p) {
  const { da, round } = room
  const events = []
  const ev = (kind, text, tone = 'info', char) => events.push({
    id: `ev_r${round}_${events.length}_${char != null ? char : 'x'}`,
    round,
    kind,
    text,
    tone,
    char
  })
  let a = p.action || { type: 'hide' }
  if (a.type === 'investigate' && p.resources < 1) a = { type: 'hide' }
  if (['wiretap', 'disinfo', 'decrypt'].includes(a.type) && (p.gadgets?.[a.type] ?? 0) < 1) a = { type: 'hide' }
  p.action = a

  if (a.type === 'investigate') {
    const t = a.target
    p.resources--
    const sus = Math.random() < (t === da ? 0.8 : 0.2)
    p.post = bayes(p.post, sig(t, sus, 0.8))
    p.alert[t] += 0.2
    ev('result', `Field check on ${NAMES[t]}: ${(sus ? rnd(SUS) : rnd(CLEAN))(NAMES[t])}`, sus ? 'bad' : 'good', t)
  } else if (a.type === 'wiretap' && (p.gadgets?.wiretap ?? 0) > 0) {
    const t = a.target
    p.gadgets.wiretap = 0
    const sus = Math.random() < (t === da ? 0.85 : 0.15)
    p.post = bayes(p.post, sig(t, sus, 0.85))
    ev('wiretap', sus
      ? `Wiretap Intercept: Audio recorder in ${NAMES[t]}'s office captured an encrypted shortwave broadcast to an unregistered foreign relay station!`
      : `Wiretap Intercept: 12 hours of audio surveillance on ${NAMES[t]} detected only routine cipher translations and administrative logistics.`,
      sus ? 'bad' : 'good', t)
  } else if (a.type === 'disinfo' && (p.gadgets?.disinfo ?? 0) > 0) {
    const t = a.target
    p.gadgets.disinfo = 0
    const sus = Math.random() < (t === da ? 0.90 : 0.10)
    p.post = bayes(p.post, sig(t, sus, 0.90))
    p.integrity = Math.min(100, p.integrity + (t === da ? 10 : -5))
    ev('disinfo', sus
      ? `Marked Bait Operation: Counter-espionage confirms the falsified naval convoy plans you handed ${NAMES[t]} were leaked to foreign intelligence within hours!`
      : `Marked Bait Operation: ${NAMES[t]} filed the marked convoy plans into the high-security safe without making copies or unauthorized contacts.`,
      sus ? 'bad' : 'good', t)
  } else if (a.type === 'decrypt' && (p.gadgets?.decrypt ?? 0) > 0) {
    const t = a.target
    p.gadgets.decrypt = 0
    const sus = Math.random() < (t === da ? 0.88 : 0.12)
    p.post = bayes(p.post, sig(t, sus, 0.88))
    ev('decrypt', sus
      ? `Signal Cryptanalysis: Bureau mainframe broke a hidden encrypted container on ${NAMES[t]}'s workstation containing foreign microdots and exfiltrated diplomatic cables.`
      : `Signal Cryptanalysis: Deep forensic trace on ${NAMES[t]}'s workstation found zero encrypted anomalies; cryptographic keys match Bureau protocols.`,
      sus ? 'bad' : 'good', t)
  } else if (a.type === 'accuse') {
    const t = a.target
    const calm = Math.random() < (t === da ? 0.65 : 0.35)
    p.post = bayes(p.post, [0, 1, 2].map(h => (h === t ? (calm ? 0.65 : 0.35) : (calm ? 0.35 : 0.65))))
    p.alert[t] += 0.4
    p.integrity = Math.min(100, p.integrity + (t === da ? 5 : -15))
    ev('reaction', calm ? `${NAMES[t]} met your accusation with ice-cold composure.` : `${NAMES[t]} erupted, demanding proof and slamming a fist on the table.`, calm ? 'bad' : 'good', t)
  } else if (a.type === 'hide') {
    p.resources = Math.min(4, p.resources + 1)
    for (let i = 0; i < 3; i++) {
      const sus = Math.random() < (i === da ? 0.6 : 0.4)
      p.post = bayes(p.post, sig(i, sus, 0.6))
      ev('cover', sus ? `Covert watch: ${NAMES[i]} seemed on edge, checking exits.` : `Covert watch: ${NAMES[i]} seemed relaxed and routine.`, sus ? 'bad' : 'good', i)
    }
  } else if (a.type === 'trust') {
    p.alert[a.target] -= 0.15
  }

  for (let c = 0; c < 3; c++) {
    const isDA = c === da
    const s = Math.min(0.9, Math.max(0, 0.2 + p.alert[c]))
    const probs = isDA && round > 1 ? POOL.map((v, i) => v * s + EXPLOIT[i] * (1 - s)) : POOL
    const act = pick(probs)
    const nom = h => (h === c && round > 1 ? NOM_DA : POOL)[act]
    p.post = bayes(p.post, [0, 1, 2].map(nom))
    const trusted = a.type === 'trust' && a.target === c
    if (act === 0) {
      const q = trusted ? 0.85 : 0.7
      const others = [0, 1, 2].filter(x => x !== c)
      const t = isDA ? rnd(others) : Math.random() < q ? da : others.find(x => x !== da)
      p.post = bayes(p.post, [0, 1, 2].map(h => (h === c ? 0.5 : h === t ? q : 1 - q)))
      ev('statement', rnd(SAYS)(NAMES[c], NAMES[t]), 'info', c)
    } else if (act === 1) ev('silent', SILENT(NAMES[c]), 'info', c)
    else ev('probe', PROBE(NAMES[c]), 'info', c)

    if (trusted) {
      const hit = Math.random() < (isDA && round > 1 ? 0.35 : 0.08)
      p.post = bayes(p.post, [0, 1, 2].map(h => { const pd = h === c && round > 1 ? 0.35 : 0.08; return hit ? pd : 1 - pd }))
      if (hit) { p.integrity -= 15; ev('leak', `Counter-intel flagged a possible leak from your briefing to ${NAMES[c]}.`, 'bad', c) }
      else ev('brief', `You briefed ${NAMES[c]}. Counter-intel found nothing unusual.`, 'good', c)
    }
  }

  p.trace.push(p.post.slice())
  p.events = events
  p.log.push({ round, intel: p.intel, action: a })
}

export function score(room, p) {
  const v = p.verdict
  const ok = v && v.target === room.da
  let base = 0
  if (ok) {
    base = 100 + Math.round(v.confidence / 2)
  } else if (v) {
    base = -Math.round((v.confidence - 34) * 0.68)
  } else {
    base = -20
  }

  const integrityBonus = Math.round(Math.max(0, p.integrity) / (ok ? 2 : 4))
  const resourceBonus = Math.max(0, p.resources) * 5
  const total = Math.max(0, base + integrityBonus + resourceBonus)

  p.scoreBreakdown = { ok, base, integrityBonus, resourceBonus, total }
  return total
}

