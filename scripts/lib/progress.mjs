const BAR_WIDTH = 20
const NAME_WIDTH = 17
const REDRAW_MS = 250
const TICK_MS = 1_000
const LOG_STEPS = 4

const CURSOR_UP_LINES = count => `\x1b[${count}F`
const CLEAR_LINE = '\x1b[2K'

export function formatDuration(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes === 0 ? `${rest}s` : `${minutes}m ${String(rest).padStart(2, '0')}s`
}

export function bar(fraction, width = BAR_WIDTH) {
  const filled = Math.round(Math.min(Math.max(fraction, 0), 1) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const percent = (done, total) => (total === 0 ? 100 : Math.round((done / total) * 100))

export function remainingMs(state, now) {
  if (state.finishedAt !== undefined) return 0
  if (state.done === 0) return undefined
  return ((now - state.startedAt) / state.done) * (state.total - state.done)
}

function storeStatus(state, now) {
  if (state.failed) return 'failed, keeping old prices'
  if (state.finishedAt !== undefined) return `done in ${formatDuration(state.finishedAt - state.startedAt)}`
  const left = remainingMs(state, now)
  return left === undefined ? 'starting…' : `~${formatDuration(left)} left`
}

export function storeLine(state, now) {
  const counts = `${state.done}/${state.total} ${String(percent(state.done, state.total)).padStart(3)}%`
  const results = `${state.matched} matched, ${state.errors} errors`
  return `${state.name.padEnd(NAME_WIDTH)} ${bar(state.done / state.total)} ${counts}  ·  ${results}  ·  ${storeStatus(state, now)}`
}

export function totalLine(states, now) {
  const done = states.reduce((sum, s) => sum + s.done, 0)
  const total = states.reduce((sum, s) => sum + s.total, 0)
  const startedAt = Math.min(...states.map(s => s.startedAt))
  const lefts = states.map(s => remainingMs(s, now))
  const left = lefts.includes(undefined) ? 'estimating…' : `~${formatDuration(Math.max(...lefts))} left`
  return `${'All stores'.padEnd(NAME_WIDTH)} ${bar(done / total)} ${done}/${total} ${percent(done, total)}%  ·  ${formatDuration(now - startedAt)} elapsed  ·  ${left}`
}

const logStep = state => Math.floor((state.done / state.total) * LOG_STEPS)

export function createProgress(stores, total, { out = process.stdout, now = Date.now, throttleMs = REDRAW_MS } = {}) {
  const startedAt = now()
  let states = stores.map(({ id, name }) => ({ id, name, done: 0, total, matched: 0, errors: 0, startedAt }))
  let drawn = false
  let lastDraw = -Infinity

  const draw = () => {
    const lines = [...states.map(s => storeLine(s, now())), totalLine(states, now())]
    const moveUp = drawn ? CURSOR_UP_LINES(lines.length) : ''
    out.write(moveUp + lines.map(line => CLEAR_LINE + line + '\n').join(''))
    drawn = true
    lastDraw = now()
  }

  const logChange = (before, after) => {
    const finished = before.finishedAt === undefined && after.finishedAt !== undefined
    const stepped = logStep(after) > logStep(before) && after.done < after.total
    if (finished || stepped) out.write(storeLine(after, now()) + '\n')
  }

  if (out.isTTY) draw()
  else out.write(`Scraping ${total} parts from ${stores.length} ${stores.length === 1 ? 'store' : 'stores'}…\n`)
  const ticker = out.isTTY ? setInterval(draw, TICK_MS) : undefined
  ticker?.unref?.()

  return {
    update(id, patch) {
      const before = states.find(s => s.id === id)
      if (!before) return
      const after = { ...before, ...patch }
      states = states.map(s => (s.id === id ? after : s))
      if (!out.isTTY) logChange(before, after)
      else if (now() - lastDraw >= throttleMs) draw()
    },
    stop() {
      if (ticker) clearInterval(ticker)
      if (out.isTTY) draw()
      else out.write(totalLine(states, now()) + '\n')
    }
  }
}
