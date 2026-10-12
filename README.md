# Sonali Paithani — website prototype

A working, browsable prototype for a Paithani saree shop: full catalog with
filters, product detail pages, a "Book a Viewing" enquiry flow, WhatsApp
deep links, an event-based **AI Stylist chatbot**, and a **"See it on
you"** virtual try-on demo.

Stack: plain **HTML / CSS / vanilla JS** — no framework, no build step, no
backend required to run. This was a deliberate choice: it's the fastest way
to get something the client can click through today, it's trivial to host
anywhere (including free static hosts), and it's easy for a second
developer to pick up later without learning a framework first.

## How to run it

You don't need to install anything. Pick one:

**Option A — just open it**
Double-click `index.html`. It works, but browsers restrict a few things
(like `fetch`) when opened as a bare file, so Option B is better once you
start extending it.

**Option B — local server (recommended)**
```bash
cd sonali-paithani
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```
Or with Node: `npx serve .`

## What's in the box

```
sonali-paithani/
├── index.html               Home — rotating hero, shop-by-occasion, bestsellers, AI panels, try-on demo, story
├── collections.html         Full catalog with occasion/price filters
├── product.html              Product detail (reads ?id=sp-001 from the URL) + booking modal
├── auth.html                  Sign Up / Log In — pick Customer or Employee, then the matching form
├── employee-dashboard.html     Staff-only view: stats, viewing requests, bestsellers
├── css/styles.css            All styling — design tokens at the top of the file
├── js/data.js                 Sample catalog (10 sarees) + shop info + mock bookings — EDIT THIS FIRST
├── js/main.js                  Nav, scroll animation, product card rendering, filters, modal
├── js/chatbot.js               The AI Stylist — rule-based recommendation engine (see below)
├── js/tryon.js                  The "See it on you" demo overlay (see below)
├── js/hero-slider.js            Rotates the homepage hero background every 10s (see below)
└── js/auth.js                    Role selection + login/signup flow (see below)
```

### The hero background rotation
`js/hero-slider.js` rotates the homepage hero through 5 slides every 10
seconds, looping continuously, with a small label in the top-left corner
("Bridal Collection," etc.) so it reads as "featured collection," not a
random background change. It's built to use **real photography** — each
slide tries to load a photo from `/assets/hero/` first, and only falls
back to a generated colour gradient if that photo isn't there yet. See
`assets/hero/README.txt` for the exact filenames and moods to shoot or
license for each of the 5 slots. Nothing needs to change in the code —
just add the files and the site upgrades itself automatically.
Respects `prefers-reduced-motion` (stays on the first look if the
visitor has that setting on).

### Sign Up / Log In (`auth.html`) + the two account "views"
Clicking the account icon (or "Sign Up / Log In" in the mobile menu) opens
a role picker first — **Customer** or **Employee** — then shows the
matching login/signup form. On submit:
- **Customer** → lands back on the normal shop (`index.html`) — the site
  you already know.
- **Employee** → lands on `employee-dashboard.html`, a separate internal
  view with stats (catalog size, viewing requests, average price), a
  table of viewing requests, and a bestsellers list.

This is a **prototype flow with no real backend** — nothing is actually
stored, and `employee-dashboard.html` is a page anyone can open directly
by typing its URL (there's no access control yet). `js/auth.js` has a
comment block on exactly what to wire up before this goes live: real
login/signup endpoints, a `role` field on each account, a real session,
and server-side gating on the dashboard page.

## The two "AI" features, honestly explained

**AI Stylist chat** — fully working today, but it's **rule-based, not an
LLM call**. It asks occasion → budget → colour, scores the sample catalog
against your answers, and returns the top 3 matches with a plain-language
reason. It's genuinely useful as-is and costs nothing to run. `js/chatbot.js`
has a comment block showing exactly where to swap in a real API call once
you want free-text understanding (e.g. "something for my cousin's sangeet,
budget 30k, I like blues" typed straight into the box).

**"See it on you"** — this is a **demo of the intended UX**, not real
photo-realistic virtual try-on. It draws the uploaded photo to a canvas and
lays a translucent saree-coloured drape shape over it, labelled "AI Preview
(Demo)". True garment-transfer AI needs a trained model or a paid
third-party API — that's real scope, not something to fake in a client
demo. `js/tryon.js` is written so the upload UI and canvas plumbing stay
exactly as they are; only the `renderOverlay()` function gets replaced with
a real API call.

Both are called out honestly in the UI copy itself (small "(Demo)" labels)
so nothing here overpromises to the client's customers.

## What I'd extend first

Roughly in priority order:

1. **Real product photos + real catalog.** Everything currently renders
   from `js/data.js`'s 10 sample sarees using generated colour swatches
   instead of photos. Swap in real photography and the full stock list —
   this alone will make the site look 10x more finished. Same for the
   hero rotation and the "See it on you" demo — both are built to accept
   real images once you have them.
2. **Real accounts + access control.** `auth.html` and
   `employee-dashboard.html` are a working *flow* today but not a working
   *backend* — see the note above. This is the highest-priority item once
   the client wants real staff logging in.
3. **A real backend for the catalog and bookings.** Right now "Book a
   Viewing" just shows a success message client-side — nothing is actually
   saved anywhere. Cheapest real fix: a small serverless function (or even
   a Google Sheet via a form service) that emails the shop and logs the
   request. Same for the catalog: move `data.js` to a lightweight CMS
   (Shopify, a headless CMS, or a simple database) once the client wants to
   update stock without editing code.
4. **WhatsApp Business API** instead of `wa.me` links, so enquiries land in
   a shared inbox the whole shop can see, not one phone.
5. **Real AI Stylist backend** — once there's a backend anyway, upgrade the
   chatbot to call an LLM with the live catalog as context, so it
   understands free text and can explain trade-offs, not just tag-match.
6. **Payments / booking deposits** if the client wants online
   pre-booking with a deposit, via Razorpay or Stripe.
7. **Real virtual try-on** — the highest-effort, highest-wow item. Options
   range from a third-party virtual try-on API to a custom model; worth
   scoping as its own mini-project once the rest is live.
8. **Analytics + SEO basics** (page titles are already set per-product;
   add Open Graph tags, sitemap, and Google Analytics/Meta Pixel before
   launch).

## Notes for handing this to the client

- All copy (shop story, product descriptions, prices) is placeholder —
  written to sound plausible for a Paithani shop, not copied from any real
  business. Replace before launch.
- The colour palette (maroon `#6B1E2B` + zari gold `#C9972C` + peacock
  teal `#1F6E63`) was chosen to reflect real Paithani colour tradition
  rather than a generic "elegant boutique" look — worth mentioning to the
  client, since it's a deliberate brand choice, not a template default.
- Fully responsive down to small phones, keyboard-navigable, and respects
  `prefers-reduced-motion`.
