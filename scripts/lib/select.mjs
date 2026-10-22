const splitList = value => String(value).split(',').map(part => part.trim().toLowerCase()).filter(Boolean)

export function argList(argv, env, name) {
  const flag = `--${name}`
  const inline = argv.find(arg => arg.startsWith(`${flag}=`))
  if (inline) return splitList(inline.slice(flag.length + 1))
  const at = argv.indexOf(flag)
  if (at >= 0 && argv[at + 1] && !argv[at + 1].startsWith('--')) return splitList(argv[at + 1])
  const fromNpm = env[`npm_config_${name}`]
  return fromNpm && fromNpm !== 'true' ? splitList(fromNpm) : []
}

export function pickStores(stores, only, skip) {
  const ids = stores.map(store => store.id)
  const unknown = [...only, ...skip].filter(id => !ids.includes(id))
  if (unknown.length > 0) throw new Error(`Unknown store: ${unknown.join(', ')}. Store ids: ${ids.join(', ')}`)
  const picked = stores.filter(store => (only.length === 0 || only.includes(store.id)) && !skip.includes(store.id))
  if (picked.length === 0) throw new Error('No stores left to scrape.')
  return picked
}

export function mergeOffers(ids, results, previous) {
  const replaced = new Set(results.filter(r => !r.failed).map(r => r.store.id))
  return Object.fromEntries(ids.map(id => {
    const fresh = results.filter(r => !r.failed).flatMap(r => (r.offers[id] ? [r.offers[id]] : []))
    const kept = (previous.items?.[id] ?? []).filter(o => !replaced.has(o.store))
    return [id, [...fresh, ...kept].sort((a, b) => a.priceEgp - b.priceEgp)]
  }))
}
