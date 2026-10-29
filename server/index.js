import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import { newPlayer, dealIntel, resolvePlayer, score, NAMES } from './game.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const http = createServer(app)
const io = new Server(http)
app.use(express.static(path.join(__dirname, '../dist')))
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../dist/index.html')))

const COLORS = ['#38bdf8', '#4ade80', '#fb923c', '#c084fc']
const TOTAL = 3
const rooms = new Map()

const newCode = () => {
  let c
  do { c = Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]).join('') } while (rooms.has(c))
  return c
}

const live = room => [...room.players.values()].filter(p => p.connected)

function snap(room, p) {
  const ph = room.phase
  return {
    code: room.code, phase: ph, round: room.round, total: TOTAL, you: p.id, host: room.host === p.id,
    timeLeft: Math.max(0, room.deadline - Date.now()),
    players: [...room.players.values()].map(q => ({
      id: q.id, name: q.name, color: q.color, connected: q.connected, host: room.host === q.id,
      locked: ph === 'act' ? !!q.action : ph === 'brief' ? q.ready : ph === 'verdict' ? !!q.verdict : false
    })),
    me: {
      post: p.post,
      trace: p.trace,
      resources: p.resources,
      integrity: p.integrity,
      intel: p.intel,
      events: p.events,
      lastEvents: p.lastEvents || [],
      log: p.log,
      action: p.action,
      ready: p.ready,
      verdict: p.verdict,
      gadgets: p.gadgets || { wiretap: 1, disinfo: 1, decrypt: 1 }
    },
    rivals: ph === 'brief' ? room.pub.filter(x => x.id !== p.id) : [],
    final: ph === 'final' ? {
      da: room.da,
      results: [...room.players.values()].map(q => ({
        id: q.id,
        name: q.name,
        color: q.color,
        verdict: q.verdict,
        score: q.score || 0,
        scoreBreakdown: q.scoreBreakdown,
        integrity: q.integrity,
        resources: q.resources,
        trace: q.trace
      })).sort((a, b) => b.score - a.score)
    } : null
  }
}

const push = room => live(room).forEach(p => io.to(p.id).emit('state', snap(room, p)))

function timer(room, ms, fn) {
  clearTimeout(room.timer)
  room.deadline = Date.now() + ms
  room.timer = setTimeout(fn, ms)
}

function startRound(room) {
  room.round++
  room.phase = 'act'
  for (const p of room.players.values()) { p.action = null; p.ready = false; dealIntel(room, p) }
  timer(room, 75000, () => resolveRound(room))
  push(room)
}

function resolveRound(room) {
  if (room.phase !== 'act') return
  room.pub = []
  for (const p of room.players.values()) {
    resolvePlayer(room, p)
    const a = p.action || { type: 'hide' }
    let actDesc = 'worked the field quietly'
    if (a.type === 'accuse') actDesc = `filed an accusation against ${NAMES[a.target]}`
    else if (a.type === 'hide') actDesc = 'went dark'
    else if (a.type === 'wiretap') actDesc = `deployed covert audio wiretap on ${NAMES[a.target]}`
    else if (a.type === 'disinfo') actDesc = `fed marked disinformation bait to ${NAMES[a.target]}`
    else if (a.type === 'decrypt') actDesc = `ran deep cryptanalysis on ${NAMES[a.target]}`
    room.pub.push({ id: p.id, name: p.name, color: p.color, text: actDesc })
  }
  room.phase = 'brief'
  for (const p of room.players.values()) p.ready = !p.connected
  timer(room, 40000, () => afterBrief(room))
  push(room)
}

function afterBrief(room) {
  if (room.phase !== 'brief') return
  if (room.round >= TOTAL) {
    room.phase = 'verdict'
    timer(room, 90000, () => finish(room))
    push(room)
  } else startRound(room)
}

function finish(room) {
  if (room.phase !== 'verdict') return
  clearTimeout(room.timer)
  for (const p of room.players.values()) p.score = score(room, p)
  room.phase = 'final'
  push(room)
}

function reset(room) {
  clearTimeout(room.timer)
  room.da = Math.floor(Math.random() * 3)
  room.round = 0
  room.phase = 'lobby'
  room.deadline = 0
  for (const [id, p] of room.players) {
    if (!p.connected) {
      room.players.delete(id)
      continue
    }
    room.players.set(id, newPlayer(p.id, p.name, p.color, p.sessionToken))
  }
}

function progress(room) {
  const ps = live(room)
  if (!ps.length) return
  if (room.phase === 'act' && ps.every(p => p.action)) resolveRound(room)
  else if (room.phase === 'brief' && ps.every(p => p.ready)) afterBrief(room)
  else if (room.phase === 'verdict' && ps.every(p => p.verdict)) finish(room)
}

io.on('connection', socket => {
  const mine = () => rooms.get(socket.data.code)
  const me = () => mine()?.players.get(socket.id)
  const clean = n => String(n || '').trim().slice(0, 14) || 'Agent'

  socket.on('create', ({ name, sessionToken }, cb) => {
    const code = newCode()
    const token = sessionToken || socket.id
    const room = { code, host: socket.id, da: Math.floor(Math.random() * 3), round: 0, phase: 'lobby', deadline: 0, players: new Map(), pub: [], timer: null, emptyTimer: null }
    rooms.set(code, room)
    room.players.set(socket.id, newPlayer(socket.id, clean(name), COLORS[0], token))
    socket.data.code = code
    socket.join(code)
    cb?.({ ok: true, code, sessionToken: token })
    push(room)
  })

  socket.on('join', ({ name, code, sessionToken }, cb) => {
    const cleanCode = String(code || '').trim().toUpperCase()
    const room = rooms.get(cleanCode)
    if (!room) return cb?.({ error: 'No such room. Check the code.' })
    clearTimeout(room.emptyTimer)

    // Reconnection check
    let existingPlayer = null
    let existingSocketId = null
    if (sessionToken) {
      for (const [sId, p] of room.players) {
        if (p.sessionToken === sessionToken || (!p.connected && p.name.toLowerCase() === clean(name).toLowerCase())) {
          existingPlayer = p
          existingSocketId = sId
          break
        }
      }
    }

    if (existingPlayer) {
      room.players.delete(existingSocketId)
      existingPlayer.id = socket.id
      existingPlayer.connected = true
      room.players.set(socket.id, existingPlayer)
      if (room.host === existingSocketId || !live(room).some(q => q.id === room.host)) {
        room.host = socket.id
      }
      socket.data.code = room.code
      socket.join(room.code)
      cb?.({ ok: true, code: room.code, sessionToken: existingPlayer.sessionToken, reconnected: true })
      push(room)
      progress(room)
      return
    }

    if (room.phase !== 'lobby') return cb?.({ error: 'That operation has already begun.' })
    if (room.players.size >= 4) return cb?.({ error: 'The room is full.' })
    const token = sessionToken || socket.id
    const used = [...room.players.values()].map(p => p.color)
    const assignedColor = COLORS.find(c => !used.includes(c)) || COLORS[used.length % COLORS.length] || COLORS[0]
    room.players.set(socket.id, newPlayer(socket.id, clean(name), assignedColor, token))
    socket.data.code = room.code
    socket.join(room.code)
    cb?.({ ok: true, code: room.code, sessionToken: token })
    push(room)
  })

  socket.on('start', () => {
    const room = mine()
    if (room && room.host === socket.id && room.phase === 'lobby') startRound(room)
  })

  socket.on('act', ({ type, target }) => {
    const room = mine(), p = me()
    if (!room || !p || room.phase !== 'act' || p.action) return
    const validMoves = ['investigate', 'trust', 'accuse', 'hide', 'wiretap', 'disinfo', 'decrypt']
    if (!validMoves.includes(type)) return
    if (type !== 'hide' && ![0, 1, 2].includes(target)) return
    if (type === 'investigate' && p.resources < 1) return
    if (['wiretap', 'disinfo', 'decrypt'].includes(type) && (p.gadgets?.[type] ?? 0) < 1) return
    p.action = { type, target: type === 'hide' ? null : target }
    push(room)
    progress(room)
  })

  socket.on('ready', () => {
    const room = mine(), p = me()
    if (!room || !p || room.phase !== 'brief') return
    p.ready = true
    push(room)
    progress(room)
  })

  socket.on('verdict', ({ target, confidence }) => {
    const room = mine(), p = me()
    if (!room || !p || room.phase !== 'verdict' || p.verdict || ![0, 1, 2].includes(target)) return
    p.verdict = { target, confidence: Math.max(34, Math.min(100, Math.round(Number(confidence) || 34))) }
    push(room)
    progress(room)
  })

  socket.on('rematch', () => {
    const room = mine()
    if (room && room.host === socket.id && room.phase === 'final') {
      reset(room)
      push(room)
    }
  })

  socket.on('disconnect', () => {
    const room = mine()
    if (!room) return
    const p = me()
    if (room.phase === 'lobby') {
      room.players.delete(socket.id)
      if (room.host === socket.id) room.host = [...room.players.keys()][0]
    } else if (p) {
      p.connected = false
    }

    if (!live(room).length) {
      clearTimeout(room.emptyTimer)
      room.emptyTimer = setTimeout(() => {
        if (rooms.get(room.code) && !live(room).length) {
          clearTimeout(room.timer)
          rooms.delete(room.code)
        }
      }, 60000)
      return
    }

    if (!live(room).some(q => q.id === room.host)) room.host = live(room)[0].id
    push(room)
    progress(room)
  })
})

const PORT = process.env.PORT || 3001
http.listen(PORT, () => console.log(`The Double Agent is live on http://localhost:${PORT}`))
