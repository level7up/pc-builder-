import type { Category } from '../domain/types'
import type { Limiter } from '../domain/bottleneck'
import type { FpsTier } from '../domain/fps'
import type { Preset } from '../domain/presets'
import type { BoardReason, CpuReason } from '../domain/suggest'
import type { ChangeStatus } from '../domain/changes'
import type { SortOrder } from '../domain/browse'
import type { RowId } from '../domain/compare'
import type { BuildMetricId } from '../domain/savedBuilds'
import type { PlanId } from '../domain/installments'

export type Locale = 'ar' | 'en'

type Params = Record<string, string | number>
export type IssueText = (p: Params, category: (c: Category) => string) => string

export interface Messages {
  dir: 'rtl' | 'ltr'
  title: string
  tagline: string
  switchTo: string
  home: string
  installApp: string
  theme: { toLight: string; toDark: string }
  categories: Record<Category, string>
  choose: string
  none: string
  clear: string
  total: string
  copyLink: string
  copied: string
  resetBuild: string
  presetsTitle: string
  presets: Record<Preset['id'], { name: string; note: string }>
  issuesTitle: string
  allGood: string
  power: { title: string; load: string; recommended: string; psu: string }
  bottleneck: {
    title: string
    needBoth: string
    cpu: string
    gpu: string
    limiter: Record<Limiter, (pct: number) => string>
    explainCpu: string
    explainGpu: string
    explainBalanced: string
    disclaimer: string
  }
  fps: {
    title: string
    needBoth: string
    resolution: string
    tiers: Record<FpsTier, string>
    capped: string
    cpuLimited: string
    gameLoopNote: string
    disclaimer: string
  }
  exportBuild: {
    copyText: string
    whatsapp: string
    print: string
    pricesOn: (date: string) => string
    part: string
    store: string
    price: string
    game: string
    link: string
  }
  pricesNote: (stores: number, date: string) => string
  viewAtStore: string
  offers: { cheapestAt: (store: string) => string; compare: (count: number) => string; outOfStock: string; quantity: (count: string) => string }
  issues: Record<string, IssueText>
  specs: {
    cores: (c: number, t: number) => string
    watts: (w: number) => string
    vram: (gb: number) => string
    length: (mm: number) => string
    maxGpu: (mm: number) => string
    maxGpuEstimated: (mm: number) => string
    rated: (w: number) => string
    igpu: string
  }
  footer: string
  groups: { fits: string; other: string }
  picker: { search: string; empty: string }
  soldOut: { badge: string; note: (price: string) => string }
  search: { label: string; empty: string }
  nav: { parts: string; wishlist: string; prices: string; label: string }
  favorite: { add: string; remove: string }
  compare: {
    add: string
    full: (max: number) => string
    startNew: string
    bar: (count: number, category: string) => string
    go: string
    needMore: string
    clear: string
    remove: string
    title: string
    browse: string
    inBuild: string
    storesTitle: string
    rows: Record<RowId, string>
    yes: string
    no: string
    units: { mm: (n: string) => string; mts: (n: string) => string; stores: (n: string) => string; pcie: (n: string) => string; gb: (n: string) => string; tb: (n: string) => string; fps: (n: string) => string }
  }
  browse: {
    title: string
    count: (count: string) => string
    search: string
    allCategories: string
    allStores: string
    inStockOnly: string
    sorts: Record<SortOrder, string>
    more: string
    empty: string
    stores: (count: number) => string
    views: { parts: string; listings: string }
    listingCount: (count: string) => string
    openAtStore: string
  }
  builds: {
    nav: string
    title: string
    namePlaceholder: string
    save: string
    defaultName: (n: number) => string
    savedAs: (name: string) => string
    changed: string
    update: string
    saveNew: string
    cancel: string
    viewAll: string
    empty: string
    open: string
    rename: string
    remove: string
    confirm: string
    parts: (count: number, total: number) => string
    savedOn: (date: string) => string
    from: (store: string) => string
    fps: (resolution: string, fps: string) => string
    noFps: string
    ok: string
    problems: (errors: number, warnings: number) => string
    pick: string
    pickHint: (max: number) => string
    compareTitle: string
    metrics: Record<BuildMetricId, string>
    notAtStore: string
    back: string
    notFound: string
    openInBuilder: string
    notChosen: string
    cheapestAnywhere: string
    priceAlert: (count: number) => string
    movedParts: (count: number, change: string) => string
    was: (price: string) => string
    acceptPrices: string
    acceptAll: string
    compareStores: string
    storesTitle: (name: string) => string
    storesHint: string
    currentStore: string
    cheapestStore: string
    useStore: string
    notStocked: string
    missingCount: (count: number) => string
    vsNow: (change: string) => string
    close: string
    storesNone: string
  }
  installments: {
    title: string
    perMonth: (price: string) => string
    planLabel: string
    plans: Record<PlanId, string>
    planNotes: Record<PlanId, string>
    monthsLabel: string
    months: (n: string) => string
    forMonths: (n: string) => string
    down: string
    rate: string
    fee: string
    adminFee: string
    interest: string
    totalPaid: string
    extra: (price: string) => string
    nothing: string
    note: string
  }
  wishlist: { title: string; total: (price: string) => string; empty: string; browse: string; gone: (store: string) => string }
  profile: {
    back: string
    add: string
    inBuild: string
    storesTitle: string
    store: string
    price: string
    status: string
    inStock: string
    notListed: string
    best: string
    yourStore: string
    open: string
  }
  changes: {
    link: string
    title: string
    back: string
    period: (from: string, to: string) => string
    periodAt: (from: string, to: string, store: string) => string
    store: string
    allStores: string
    search: string
    all: string
    statuses: Record<ChangeStatus, string>
    part: string
    before: string
    after: string
    change: string
    empty: string
    loading: string
  }
  shops: {
    nav: string
    title: string
    hint: string
    products: (count: string) => string
    inStock: (count: string) => string
    cheapest: (count: string) => string
    open: string
    visit: string
    back: string
  }
  store: {
    title: string
    all: string
    hintAll: string
    hintOne: (store: string) => string
    compareTitle: string
    complete: string
    missing: (parts: string) => string
    notHere: (store: string) => string
  }
  suggest: {
    forBoard: string
    forCpu: string
    cpuReasons: Record<CpuReason, string>
    boardReasons: Record<BoardReason, string>
  }
  budget: {
    title: string
    label: string
    placeholder: string
    resolution: string
    go: string
    invalid: string
    tooLow: (minimum: string) => string
    done: (total: string, budget: string) => string
    unavailable: (store: string) => string
  }
}
