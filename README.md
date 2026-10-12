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
npm run prices:check   # compare stored prices with the live store (read-only)
npm run prices:check -- --write   # save the new prices and today's date
npm run prices:scrape  # fetch prices from all stores (read-only, ~3 min)
npm run prices:scrape -- --write  # save them to src/data/offers.json
```

Builds are saved in the browser and shareable: "Copy build link" gives a URL
like `?cpu=r5-7500f&gpu=rx9060xt-16&…`. A build can also be copied as text,
sent on WhatsApp, or printed / saved as a PDF sheet with parts, prices, total
and FPS at each resolution.

## Data

| File | Holds |
|---|---|
| `src/data/listings.json` | Reference price, store handle and variant per part on Compumarts, plus `checkedOn` |
| `src/data/search-terms.json` | Per part: the store search query and the title terms a listing must (`all`) and must not (`none`) contain |
| `src/data/offers.json` | Scraped price, stock and link per part and store |
| `src/data/parts.ts` | Specs per part (socket, memory type, power, length, score…) |
| `src/domain/presets.ts` | The four ready-made builds |

Prices are scraped from eight Egyptian stores: Compumarts, Kimo Store and AHW
Store (Shopify catalogue feeds), Sigma Computer (search page data), El Badr
Group and Maximum Hardware (OpenCart search pages), Alfrensia and Uptodate
Store (WooCommerce store API). Each part shows the cheapest in-stock offer and
a list to compare all stores. Listings are matched by title terms, with
bundles, PC builds and laptops rejected, and a match is ignored when its price
is outside 0.6–1.8× the Compumarts reference price. CPUs, boards, memory,
storage, PSUs, cases and coolers match the exact model; GPUs match the chip and
VRAM, so other stores may list a different card of the same GPU. A store that
fails completely keeps its previous prices on `--write`. The catalogue covers the models that
Egyptian stores stock widely: Intel 12th–14th gen and Core Ultra, Ryzen 5000,
7000, 8000 and 9000, RTX 3050 to 5090, RX 9060 XT to 9070 XT, plus common
boards, memory, SSDs, PSUs, cases and coolers.

To add a part: add its listing to `listings.json` (the store handle is the last
part of the product URL), its search terms to `search-terms.json`, its specs to
`parts.ts`, then run `npm test` and `npm run prices:scrape -- --write`. The data
tests fail if a part has no listing or a listing has no part.

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
