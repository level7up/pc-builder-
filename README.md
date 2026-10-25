# levelxup

Vue 3 + TypeScript site for planning a gaming PC from parts that are popular in
Egypt: compatibility checks, power estimate, a bottleneck estimate and the
total in EGP. Arabic (RTL) and English, switchable.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # domain, data, translation and app tests
npm run build          # type-check + production build into dist/
npm run prices:check   # compare stored Compumarts reference prices with the live store (read-only)
npm run prices:check -- --write   # save the new prices and today's date
npm run prices:scrape  # fetch prices from all stores (read-only, ~10–20 min, shows live progress per store)
npm run prices:scrape -- --write  # save them to src/data/offers.json (the old file becomes offers-previous.json); `npm run prices:scrape --write` works too
npm run prices:scrape -- --stores=sigma,elbadr --write  # update only these stores
npm run prices:scrape -- --skip=elbadr --write          # update every store except these
```

Builds are saved in the browser and shareable: "Copy build link" gives a URL
like `?cpu=r5-7500f&gpu=rx9060xt-16&…`. A build can also be copied as text,
sent on WhatsApp, or printed / saved as a PDF sheet with parts, prices, total
and FPS at each resolution.

## Data

| File | Holds |
|---|---|
| `src/data/listings.json` | Reference price per part, plus `checkedOn`: a Compumarts handle and variant, or a store id and URL for parts Compumarts does not sell |
| `src/data/search-terms.json` | Per part: the store search query and the title terms a listing must (`all`) and must not (`none`) contain, and any globally excluded words it may still contain (`allow`, e.g. "inch" for an AIO with a screen) |
| `src/data/offers.json` | Scraped price, stock, link and product image (https only) per part and store |
| `src/data/offers-previous.json` | The offers from the scrape before, kept by `--write` (once per day) for the price changes page |
| `src/data/catalog/*.ts` | Specs per part, one file per category (socket, memory type, power, length, score…) |
| `src/data/parts.ts` | Joins the specs with their reference price and scraped offers |
| `src/domain/presets.ts` | The four ready-made builds |

Prices are scraped from eight Egyptian stores: Compumarts, Kimo Store and AHW
Store (Shopify catalogue feeds), Sigma Computer (search page data), El Badr
Group and Maximum Hardware (OpenCart search pages), Alfrensia and Uptodate
Store (WooCommerce store API). Each part shows the cheapest in-stock offer and
a list to compare all stores. Listings are matched by title terms, with
bundles, PC builds and laptops rejected (a `+` counts as a bundle unless it is
part of "80+", "8000+", "P-cores + E-cores" or "+ Fan"), and a match is ignored when its price
is outside 0.6–1.8× the reference price. CPUs, boards, memory,
storage, PSUs, cases and coolers match the exact model; GPUs match the chip and
VRAM, so other stores may list a different card of the same GPU. A store that
fails completely, or is left out with `--stores`/`--skip`, keeps its previous prices on `--write`.
Store ids: compumarts, kimo, ahw, sigma, elbadr, maximum, alfrensia, uptodate. The catalogue covers every
CPU, GPU, ATX/micro-ATX motherboard, desktop memory kit, case, PSU and CPU cooler (air and AIO, except Intel-only and server coolers) that was in stock at one of the eight
stores on the last full survey (October 2026): Ryzen 2000 to 9000, Intel
12th–14th gen and Core Ultra, RTX 3050 to 5090 including the 4070 Ti and 4090,
RX 6500 XT to 9070 XT including the 7900 XT and XTX. Intel 10th/11th gen (LGA1200) is
left out because no LGA1200 boards are listed, and mini-ITX and E-ATX boards
because cases are only checked for ATX and micro-ATX. Board power limits come
from the chipset and board tier (entry -E/-K/-H boards are lower). Case GPU clearances come from the
maker's spec or the store description; where neither states it, the value is
an estimate, marked "(est.)", and an over-long card is a warning, not an error.
Cooler ratings use the maker's TDP where it is published; otherwise they are
estimated from the design (single or dual tower, radiator size).
Storage covers NVMe SSDs, 2.5" SATA SSDs and desktop hard drives (`kind` in
`src/data/catalog/storage.ts`); portable, enterprise and surveillance drives are
left out. The budget builder only picks an NVMe drive as the boot drive.
The October 25 Compumarts survey added every in-stock component it sells that
was missing, apart from those cases, listings with placeholder prices (1 or
1,010,000 EGP), case + PSU bundles and prebuilt PCs.

To add a part: add its listing to `listings.json` (for Compumarts the store
handle is the last part of the product URL; for another store give its store id
and the product URL), its search terms to `search-terms.json`, its specs to the
category file in `src/data/catalog/`, then run `npm test` and `npm run prices:scrape -- --write`. The data
tests fail if a part has no listing or a listing has no part.

## Sold-out parts and price changes

A part with no in-stock offer at any store stays in the lists, marked sold out
with its last price. It is left out of the total, the budget builder and the
suggestions, and picking one shows a warning. The "Price changes" page (`#prices`, loaded only when opened)
lists every part with its price on the last check and now, using the same
cheapest-in-stock rule, sorted with sold-out and back-in-stock parts first,
then the biggest moves (`src/domain/changes.ts`). Choosing a store compares that
store's own price for each part it lists instead; a listing it dropped counts as
sold out and a new one as back in stock.

## Search and part pages

The search box in the header finds any part in every category by name words
(Arabic digits work too), in-stock parts first. Choosing one opens its page
(`#part/<id>`): specs, the cheapest price, an "Add to build" button, and a row
per store with its cheapest listing there, the price, stock and a link, or
"not listed" (`src/domain/lookup.ts`).

## All parts and the wishlist

"All parts" (`#parts`) opens on "All store products": one card per listing at
every store (store, its own product title, image, price, stock, a link to buy
and to the matching part). "Parts" switches to one card per part with its
cheapest price. Both show 24 cards at a time with "Show more", filter by name
words (store titles too), category, store and "in stock only", and sort by
price or name (`src/domain/browse.ts`). The ♡
button saves to the wishlist (`#wishlist`), kept in the browser
(`pcb-wishlist`). On a store product card or a store row of a part page it
saves that store's listing (`<part>@<store>`), shown with that store's title,
price and link; on part cards, the part page header and picked parts it saves
the part at its cheapest price. A saved store listing that the store drops
stays, marked as no longer listed. The page sums the in-stock prices
(`src/domain/wishlist.ts`).

## Saved builds

The total box in the builder saves the current build under a name, with its
chosen store (kept in the browser as `pcb-builds`, up to 30). Once a build is
saved or opened, the box shows its name, flags unsaved changes, and offers
"Save changes" or "Save as a new build". "My builds" (`#builds`) lists them as
cards (total, average FPS per resolution, compatibility, parts) with Open,
Rename and Delete (asks first). Each card lists every part with its price.
A build remembers each part's price when it is saved (builds saved earlier start
from the prices on their first visit). When a price has moved since, the page
shows a 🔔 banner, the card and the build page say how many parts changed and
by how much in total, and each moved part shows its old price crossed out, red
when it went up and green when it went down. "Keep the new prices" (per build)
or "Mark all as seen" makes the current prices the new starting point.

"Compare stores" on a card opens the same build at every store that stocks any
of its parts (`src/domain/storeCompare.ts`): each part's price per store with
the cheapest starred, each store's total, how many parts it is missing, how
much more or less a complete store costs than the build now, the build's own
store and the cheapest complete store tagged, and "Use this store" to move the
build to that store. Ticking 2–3 builds compares them: total,
average FPS, power draw, problems and missing parts with the best starred, then
every part with its price, highlighting the categories where the builds differ
(`src/domain/savedBuilds.ts`).

Each saved build also has its own page (`#build/<id>`, linked from the card and
the comparison header): every part with its image, price at the saved store and
store link, sold-out or "not at the store" marks, the total, the compatibility
check, bottleneck, power and FPS panels, plus "Open in the builder" and the
share buttons (link, text, WhatsApp).

## Comparing parts

The ⚖ compare button on part cards, store product cards and part pages collects 2–4
parts of one category (a part of another category starts a new comparison;
kept in the browser as `pcb-compare`). A bar at the bottom links to `#compare`:
specs side by side with the best value in each row starred (lowest price,
most VRAM, most cores…; sold-out parts never win on price), performance and
performance per pound relative to the strongest compared part, price per GB or
TB for memory and storage, each part's price at every store, and "Add to
build" (`src/domain/compare.ts`).

## Buying from one store

"Buy everything from one store" limits the part lists, prices, total, suggestions
and the budget builder to one store's in-stock offers (`src/domain/store.ts`).
A part that store does not stock stays in the build with a warning. With any
parts picked, the panel also compares the build's cost at each store, stores
that have every part first, then cheapest. The chosen store is remembered and
travels in the share link (`store=`).

## Store profiles

`#stores` lists every store with how many products it lists, how many are in
stock, a count per category, and how many parts it is the cheapest for
(`src/domain/storeProfile.ts`). `#store/<id>` is one store's profile: all its
products, sold-out ones included, with category chips, search, sort and an
in-stock filter. Store names on product cards and part pages link to the
profile, and the header has a Stores link.

## Installments

The builder and each saved build page split the total into monthly payments
(`src/domain/installments.ts`). Two example plans: a 0% bank card plan (6 or 12
months) and finance companies such as valU, Souhoola, Contact and Aman (6–24
months, 2.5% flat a month and a 3% admin fee by default). The down payment,
monthly rate and admin fee are editable, since real rates vary by provider. Only
interest and fees count as the extra over the cash price.

## Phone navigation and installing

Under 640px the header keeps only search, theme, language and install, and a
bottom tab bar (Home, All parts, Wishlist, My builds, Prices) handles
navigation. The compare bar sits above it (`--tabbar-h`).

The site is a PWA through `vite-plugin-pwa`: a manifest with icons
(`public/icon-*.png`), and a service worker that precaches the app, including
the bundled prices, so it opens offline with the last prices. Part images and
Google Fonts are cached as they load. New versions install in the background and
apply on the next visit. On screens up to 900px, an install button (📲) appears
when the browser offers installation (`src/useInstallPrompt.ts`).
The service worker is only built by `npm run build`; `npm run dev` doesn't
register it.

## How the estimates work

- **Power:** CPU peak package power + GPU board power + 50 W for the rest.
  Recommended PSU = load × 1.3, rounded up to 50 W.
- **Bottleneck:** each CPU has a 1080p gaming score (Ryzen 7 9800X3D = 100)
  and each GPU a raster score (RTX 5080 = 100), both approximated from
  published review averages. CPU capacity does not depend on resolution; GPU
  capacity scales by 1.0 / 0.7 / 0.38 for 1080p / 1440p / 4K, with a 15 %
  penalty when VRAM is below 8 / 10 / 12 GB and a 10 % CPU penalty for
  single-channel memory. The percentage is how far the slower side is behind
  the faster one; under 10 % is "balanced". It is a guide, not a benchmark.
- **FPS per game:** each game in `src/data/games.ts` has the frame rate the
  reference CPU (Ryzen 7 9800X3D) and the reference GPU (RTX 5080 at 1080p)
  reach at the listed preset. A build's FPS is the lower of the two, scaled by
  the same CPU and GPU capacities as the bottleneck estimate, and capped where
  the game has a cap. PUBG Mobile on GameLoop is capped at 120 FPS and does not
  scale with resolution.
- **Compatibility:** socket, memory type (board and CPU), board/case form
  factor, GPU length vs case clearance (lengths are approximate per listed
  model), PSU wattage and rating, cooler rating vs CPU power, entry-board power
  delivery, single-channel / low RAM, 8 GB VRAM, overclocking support, and
  possible BIOS updates for newer CPUs on older chipsets. Board power limits
  and GPU lengths are conservative estimates, shown as warnings, not errors.
