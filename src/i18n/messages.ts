import type { Category, Issue } from '../domain/types'
import type { Limiter } from '../domain/bottleneck'
import type { FpsTier } from '../domain/fps'
import type { Preset } from '../domain/presets'
import type { BoardReason, CpuReason } from '../domain/suggest'

export type Locale = 'ar' | 'en'

export const BRAND = 'levelxup'

type Params = Record<string, string | number>
type IssueText = (p: Params, category: (c: Category) => string) => string

export interface Messages {
  dir: 'rtl' | 'ltr'
  title: string
  tagline: string
  switchTo: string
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
  offers: { cheapestAt: (store: string) => string; compare: (count: number) => string; outOfStock: string }
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

const ar: Messages = {
  dir: 'rtl',
  title: 'جمّع جهازك',
  tagline: 'اختار القطع المنتشرة في مصر، وشوف التوافق والباور والـ Bottleneck والسعر بالجنيه.',
  switchTo: 'English',
  theme: { toLight: 'الوضع الفاتح', toDark: 'الوضع الغامق' },
  categories: { cpu: 'البروسيسور', motherboard: 'المازربورد', memory: 'الرامات', gpu: 'كارت الشاشة', storage: 'الهارد (SSD)', psu: 'الباور سبلاي', case: 'الكيسة', cooler: 'مبرّد البروسيسور' },
  choose: 'اختار…',
  none: 'من غير',
  clear: 'شيل',
  total: 'الإجمالي',
  copyLink: 'انسخ لينك التجميعة',
  copied: 'اتنسخ ✓',
  resetBuild: 'ابدأ من الأول',
  presetsTitle: 'تجميعات جاهزة',
  presets: {
    budget: { name: 'اقتصادي', note: 'ألعاب 1080p' },
    mainstream: { name: 'متوسط', note: '1080p عالي و 1440p' },
    high: { name: 'قوي', note: '1440p عالي' },
    enthusiast: { name: 'فلاجشيب', note: '1440p و 4K' }
  },
  issuesTitle: 'التوافق',
  allGood: 'كل القطع متوافقة مع بعض ✓',
  power: { title: 'الباور', load: 'الاستهلاك المتوقع', recommended: 'الباور المقترح', psu: 'الباور اللي اخترته' },
  bottleneck: {
    title: 'حاسبة الـ Bottleneck',
    needBoth: 'اختار بروسيسور وكارت شاشة عشان تشوف النتيجة.',
    cpu: 'البروسيسور',
    gpu: 'الكارت',
    limiter: {
      cpu: pct => `البروسيسور مأخّر الكارت ${pct}%`,
      gpu: pct => `الكارت هو الحد (${pct}%)`,
      balanced: () => 'متوازن'
    },
    explainCpu: 'الكارت مستني البروسيسور: هتدفع في كارت مش هتاخد قوته كلها في الدقة دي.',
    explainGpu: 'ده الطبيعي في الألعاب: الكارت شغال على آخره والبروسيسور مكفّيه.',
    explainBalanced: 'الاتنين قريبين من بعض.',
    disclaimer: 'تقدير تقريبي من متوسطات اختبارات الألعاب المنشورة، مش قياس. كل لعبة وكل إعدادات ليها نتيجة مختلفة.'
  },
  fps: {
    title: 'الـ FPS المتوقع في الألعاب',
    needBoth: 'اختار بروسيسور وكارت شاشة عشان تشوف الـ FPS.',
    resolution: 'الدقة',
    tiers: { low: 'مش هتتلعب', playable: 'تتلعب', smooth: 'سلسة', high: 'تنافسية' },
    capped: 'أقصى حاجة في اللعبة',
    cpuLimited: 'البروسيسور هو الحد',
    gameLoopNote: 'ببجي موبايل على GameLoop آخرها 120 FPS، وبتعتمد على البروسيسور أكتر من الكارت. فعّل الـ Virtualization (SVM أو VT-x) من الـ BIOS.',
    disclaimer: 'متوسط تقريبي من اختبارات منشورة بالإعدادات المكتوبة جنب كل لعبة، من غير DLSS أو FSR. الماب والتحديثات والدرايفرات بتفرق.'
  },
  exportBuild: {
    copyText: 'انسخ التجميعة كنص',
    whatsapp: 'ابعتها واتساب',
    print: 'اطبع / PDF',
    pricesOn: date => `الأسعار يوم ${date}`,
    part: 'القطعة',
    store: 'المحل',
    price: 'السعر',
    game: 'اللعبة',
    link: 'لينك التجميعة'
  },
  pricesNote: (stores, date) => `الأسعار من ${stores} محلات في مصر يوم ${date}، وبتتغير كتير. السعر المعروض هو أرخص سعر متوفر، واضغط عليه عشان تفتح الصفحة.`,
  viewAtStore: 'شوف في المحل',
  offers: {
    cheapestAt: store => `أرخص سعر عند ${store}`,
    compare: count => `قارن الأسعار في ${count} محلات`,
    outOfStock: 'مش متوفر'
  },
  issues: {
    missing: (p, cat) => `لسه مااخترتش ${cat(p.category as Category)}.`,
    notAtStore: (p, cat) => `${cat(p.category as Category)}: القطعة اللي اخترتها مش موجودة في ${p.store}.`,
    socketMismatch: p => `البروسيسور سوكيت ${p.cpu} والمازربورد ${p.board}: مش هيركبوا.`,
    memoryMismatch: p => `المازربورد ${p.board} والرامات ${p.memory}: مش هتركب.`,
    cpuMemoryMismatch: p => `البروسيسور بيدعم ${p.cpu} بس، والرامات ${p.memory}.`,
    formFactorMismatch: p => `مازربورد ${p.board} مش هتدخل في الكيسة دي.`,
    gpuTooLong: p => `الكارت طوله حوالي ${p.gpu} مم والكيسة آخرها ${p.max} مم.`,
    gpuMaybeTooLong: p => `الكارت طوله حوالي ${p.gpu} مم، والكيسة تقديراً آخرها ${p.max} مم: اتأكد من مواصفات الكيسة.`,
    gpuTight: p => `الكارت (حوالي ${p.gpu} مم) قريب من آخر الكيسة (${p.max} مم): اتأكد من الطول بالظبط.`,
    noVideoOutput: () => 'البروسيسور ده مفيهوش جرافيك داخلي: محتاج كارت شاشة عشان الشاشة تشتغل.',
    psuTooWeak: p => `الاستهلاك المتوقع ${p.load} وات والباور ${p.watts} وات بس.`,
    psuLowHeadroom: p => `الأحسن باور ${p.recommended} وات أو أكتر (عندك ${p.watts}).`,
    psuRatingLow: p => `كارت ${p.gpuW} وات على باور من غير شهادة Bronze أو Gold: خد باور أحسن.`,
    coolerUnderrated: p => `المبرّد متصمم لـ ${p.cooler} وات والبروسيسور ممكن يوصل ${p.cpu} وات: هيسخن ويقلّل سرعته.`,
    boardPowerLimited: p => `مازربورد ${p.chipset} الاقتصادية ممكن تقلّل سرعة بروسيسور ${p.cpu} وات في الضغط الطويل.`,
    lowRam: p => `${p.gb} جيجا رامات قليلة للألعاب النهارده: 16 على الأقل.`,
    singleChannel: () => 'رامة واحدة = Single channel: الأحسن رامتين عشان الأداء.',
    lowVram: p => `${p.gb} جيجا VRAM كفاية لـ 1080p، بس في 1440p و4K هتقلّل جودة الـ Textures.`,
    noOverclock: p => `البروسيسور Unlocked بس مازربورد ${p.chipset} مش بتعمل أوفركلوك. عادي لو مش ناوي.`,
    biosUpdate: p => `بعض مازربوردات ${p.chipset} القديمة في المخزن محتاجة تحديث BIOS للبروسيسور ده: اسأل المحل.`
  },
  specs: {
    cores: (c, t) => `${c} كور / ${t} ثريد`,
    watts: w => `${w} وات`,
    vram: gb => `${gb} جيجا`,
    length: mm => `~${mm} مم`,
    maxGpu: mm => `كارت لحد ${mm} مم`,
    maxGpuEstimated: mm => `كارت لحد ~${mm} مم (تقدير)`,
    rated: w => `لحد ${w} وات`,
    igpu: 'فيه جرافيك'
  },
  footer: 'الأسعار والمواصفات للاسترشاد. اتأكد من المحل قبل الشراء.',
  groups: { fits: 'تركب مع اختياراتك', other: 'مش هتركب مع اختياراتك' },
  picker: { search: 'دوّر بالاسم أو الموديل…', empty: 'مفيش حاجة بالاسم ده' },
  store: {
    title: 'اشتري كله من محل واحد',
    all: 'كل المحلات',
    hintAll: 'الأسعار دلوقتي أرخص سعر من أي محل. اختار محل عشان تشوف القطع اللي عنده بس وبأسعاره.',
    hintOne: store => `كل القطع والأسعار والتجميع بالميزانية من ${store} بس.`,
    compareTitle: 'تجميعتك في كل محل',
    complete: 'كل القطع موجودة',
    missing: parts => `ناقص: ${parts}`,
    notHere: store => `القطعة دي مش متوفرة في ${store}. اختار بديل من القايمة.`
  },
  suggest: {
    forBoard: 'بروسيسورات تركب على المازربورد دي:',
    forCpu: 'مازربوردات تناسب البروسيسور ده:',
    cpuReasons: { cheapest: 'الأرخص', bestValue: 'أحسن قيمة', strongest: 'الأقوى' },
    boardReasons: { cheapest: 'الأرخص', overclock: 'بتعمل أوفركلوك', wifi: 'فيها Wi-Fi' }
  },
  budget: {
    title: 'جمّعلي على قد ميزانيتي',
    label: 'الميزانية بالجنيه',
    placeholder: 'مثلاً 60000',
    resolution: 'هتلعب على',
    go: 'جمّع',
    invalid: 'اكتب الميزانية رقم بالجنيه (لحد مليون).',
    tooLow: minimum => `الميزانية قليلة: أرخص تجميعة كاملة ومتوافقة بـ ${minimum}.`,
    done: (total, budget) => `اتجمّعت بـ ${total} من ميزانية ${budget}. تقدر تغيّر أي قطعة.`,
    unavailable: store => `${store} مفيهوش قطع كفاية لتجميعة كاملة متوافقة.`
  }
}

const en: Messages = {
  dir: 'ltr',
  title: 'PC Builder Egypt',
  tagline: 'Pick parts that are popular in Egypt and see compatibility, power, bottleneck and the price in EGP.',
  switchTo: 'العربية',
  theme: { toLight: 'Light mode', toDark: 'Dark mode' },
  categories: { cpu: 'CPU', motherboard: 'Motherboard', memory: 'Memory', gpu: 'Graphics card', storage: 'Storage (SSD)', psu: 'Power supply', case: 'Case', cooler: 'CPU cooler' },
  choose: 'Choose…',
  none: 'None',
  clear: 'Remove',
  total: 'Total',
  copyLink: 'Copy build link',
  copied: 'Copied ✓',
  resetBuild: 'Start over',
  presetsTitle: 'Ready-made builds',
  presets: {
    budget: { name: 'Budget', note: '1080p gaming' },
    mainstream: { name: 'Mainstream', note: 'High 1080p and 1440p' },
    high: { name: 'High-end', note: 'High 1440p' },
    enthusiast: { name: 'Flagship', note: '1440p and 4K' }
  },
  issuesTitle: 'Compatibility',
  allGood: 'All parts are compatible ✓',
  power: { title: 'Power', load: 'Estimated load', recommended: 'Recommended PSU', psu: 'Your PSU' },
  bottleneck: {
    title: 'Bottleneck calculator',
    needBoth: 'Pick a CPU and a graphics card to see the result.',
    cpu: 'CPU',
    gpu: 'GPU',
    limiter: {
      cpu: pct => `CPU holds the GPU back by ${pct}%`,
      gpu: pct => `GPU is the limit (${pct}%)`,
      balanced: () => 'Balanced'
    },
    explainCpu: 'The GPU is waiting on the CPU: you are paying for graphics power you will not get at this resolution.',
    explainGpu: 'This is normal for games: the GPU runs flat out and the CPU keeps up.',
    explainBalanced: 'Both parts are close to each other.',
    disclaimer: 'A rough estimate from published gaming benchmark averages, not a measurement. Every game and setting differs.'
  },
  fps: {
    title: 'Estimated FPS in games',
    needBoth: 'Pick a CPU and a graphics card to see the FPS.',
    resolution: 'Resolution',
    tiers: { low: 'Unplayable', playable: 'Playable', smooth: 'Smooth', high: 'Competitive' },
    capped: 'Game maximum',
    cpuLimited: 'CPU-limited',
    gameLoopNote: 'PUBG Mobile on GameLoop tops out at 120 FPS and depends more on the CPU than the graphics card. Turn on virtualization (SVM or VT-x) in the BIOS.',
    disclaimer: 'A rough average from published benchmarks at the settings shown next to each game, without DLSS or FSR. Maps, patches and drivers change it.'
  },
  exportBuild: {
    copyText: 'Copy as text',
    whatsapp: 'Send on WhatsApp',
    print: 'Print / PDF',
    pricesOn: date => `Prices on ${date}`,
    part: 'Part',
    store: 'Store',
    price: 'Price',
    game: 'Game',
    link: 'Build link'
  },
  pricesNote: (stores, date) => `Prices from ${stores} Egyptian stores on ${date}; they change often. Each part shows the cheapest in-stock price; click it to open the listing.`,
  viewAtStore: 'View at store',
  offers: {
    cheapestAt: store => `Cheapest at ${store}`,
    compare: count => `Compare prices at ${count} stores`,
    outOfStock: 'Out of stock'
  },
  issues: {
    missing: (p, cat) => `No ${cat(p.category as Category).toLowerCase()} picked yet.`,
    notAtStore: (p, cat) => `${cat(p.category as Category)}: your pick isn't in stock at ${p.store}.`,
    socketMismatch: p => `The CPU is ${p.cpu} and the motherboard is ${p.board}: they will not fit.`,
    memoryMismatch: p => `The motherboard takes ${p.board} but the memory is ${p.memory}.`,
    cpuMemoryMismatch: p => `The CPU supports ${p.cpu} only, but the memory is ${p.memory}.`,
    formFactorMismatch: p => `An ${p.board} motherboard does not fit this case.`,
    gpuTooLong: p => `The card is about ${p.gpu} mm long and the case fits up to ${p.max} mm.`,
    gpuMaybeTooLong: p => `The card is about ${p.gpu} mm long and this case fits roughly ${p.max} mm (estimated): check the case specs.`,
    gpuTight: p => `The card (about ${p.gpu} mm) is close to the case limit (${p.max} mm): check the exact length.`,
    noVideoOutput: () => 'This CPU has no integrated graphics: you need a graphics card for any display output.',
    psuTooWeak: p => `Estimated load is ${p.load} W but the PSU is only ${p.watts} W.`,
    psuLowHeadroom: p => `A ${p.recommended} W or larger PSU is recommended (you have ${p.watts} W).`,
    psuRatingLow: p => `A ${p.gpuW} W card on an unrated PSU: get at least an 80 Plus Bronze unit.`,
    coolerUnderrated: p => `The cooler is rated for ${p.cooler} W but the CPU can draw ${p.cpu} W: expect heat and throttling.`,
    boardPowerLimited: p => `An entry ${p.chipset} board may throttle a ${p.cpu} W CPU under long all-core loads.`,
    lowRam: p => `${p.gb} GB is low for current games: 16 GB minimum.`,
    singleChannel: () => 'One memory stick runs single-channel: two sticks perform better.',
    lowVram: p => `${p.gb} GB VRAM is fine for 1080p; at 1440p and 4K you will lower texture quality.`,
    noOverclock: p => `The CPU is unlocked but ${p.chipset} boards cannot overclock it. Fine if you do not plan to.`,
    biosUpdate: p => `Some older ${p.chipset} boards in stock need a BIOS update for this CPU: ask the store.`
  },
  specs: {
    cores: (c, t) => `${c}C / ${t}T`,
    watts: w => `${w} W`,
    vram: gb => `${gb} GB`,
    length: mm => `~${mm} mm`,
    maxGpu: mm => `GPU up to ${mm} mm`,
    maxGpuEstimated: mm => `GPU up to ~${mm} mm (est.)`,
    rated: w => `up to ${w} W`,
    igpu: 'iGPU'
  },
  footer: 'Prices and specs are a guide. Confirm with the store before you buy.',
  groups: { fits: 'Fits your picks', other: 'Does not fit your picks' },
  picker: { search: 'Search by name or model…', empty: 'Nothing matches that' },
  store: {
    title: 'Buy everything from one store',
    all: 'All stores',
    hintAll: 'Prices are the cheapest at any store. Pick a store to see only what it stocks, at its prices.',
    hintOne: store => `Every part, price and budget build comes from ${store} only.`,
    compareTitle: 'Your build at each store',
    complete: 'Has every part',
    missing: parts => `Missing: ${parts}`,
    notHere: store => `This part isn't in stock at ${store}. Pick another from the list.`
  },
  suggest: {
    forBoard: 'CPUs that fit this motherboard:',
    forCpu: 'Motherboards that suit this CPU:',
    cpuReasons: { cheapest: 'Cheapest', bestValue: 'Best value', strongest: 'Fastest' },
    boardReasons: { cheapest: 'Cheapest', overclock: 'Overclocking', wifi: 'Wi-Fi' }
  },
  budget: {
    title: 'Build to my budget',
    label: 'Budget in EGP',
    placeholder: 'e.g. 60000',
    resolution: 'Gaming at',
    go: 'Build',
    invalid: 'Enter the budget as a number in EGP (up to 1,000,000).',
    tooLow: minimum => `Too low: the cheapest complete, compatible build is ${minimum}.`,
    done: (total, budget) => `Built for ${total} of your ${budget}. Change any part you like.`,
    unavailable: store => `${store} doesn't stock enough parts for a complete, compatible build.`
  }
}

export const MESSAGES: Record<Locale, Messages> = { ar, en }

export function issueText(messages: Messages, issue: Issue): string {
  const render = messages.issues[issue.code]
  if (!render) return issue.code
  return render(issue.params ?? {}, c => messages.categories[c])
}
