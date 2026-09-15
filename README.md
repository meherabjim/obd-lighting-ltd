# OBD Lighting — website

Marketing and catalogue website for **OBD Lighting** (Total Lighting Solutions),
Sayed Nogor, Vatara, Dhaka.

React (Vite) + Node.js (Express) + MySQL. No customer accounts and no online
payment — every "buy" button opens WhatsApp with the message already written.
Only you sign in, to add products.

---

## Quick start (একবারেই সব)

Open the project folder in VS Code, then in the terminal:

```bash
npm run setup     # installs everything, creates the database, makes your admin login
npm run dev       # starts the website and the API together
```

Then open:

| | |
|---|---|
| Website | http://localhost:5173 |
| Admin panel | http://localhost:5173/admin |

Stop everything with `Ctrl + C`.

### What you need first

* **Node.js 18 or newer** — https://nodejs.org (the LTS version)
* **MySQL running** — XAMPP or Laragon on Windows is easiest; start MySQL from its
  control panel before running setup.

`npm run setup` asks for your MySQL user and password, then for the email and
password you want to sign in with. It is safe to run again if anything goes wrong.

---

## বাংলায় — সংক্ষেপে

১. Node.js ইনস্টল করুন (nodejs.org থেকে LTS)
২. MySQL চালু করুন (XAMPP বা Laragon হলে সেখান থেকে Start করুন)
৩. VS Code-এ ফোল্ডারটা খুলে টার্মিনালে লিখুন:

```bash
npm run setup
npm run dev
```

৪. ব্রাউজারে যান — সাইট: `localhost:5173`, অ্যাডমিন: `localhost:5173/admin`

setup চলার সময় MySQL-এর ইউজার/পাসওয়ার্ড আর আপনার admin ইমেইল-পাসওয়ার্ড চাইবে।
১০টা ক্যাটাগরি আর ৩৬টা প্রোডাক্ট আগে থেকেই থাকবে — **দামগুলো বাজারদরের অনুমান**,
admin panel থেকে ঠিক করে নেবেন। নতুন প্রোডাক্টও ওখান থেকেই যোগ করবেন।

---

## What is in the box

```
obd-lighting/
├── package.json          npm run setup  /  npm run dev
├── setup.js              the one-command installer
├── dev.js                runs the API and the website together
│
├── database/
│   ├── schema.sql        tables
│   └── seed.sql          10 categories, 36 starter products, site settings
│
├── server/               Node.js + Express + MySQL API
│   ├── .env              your database details and login secret (never commit this)
│   └── src/
│       ├── routes/       catalogue, enquiries, auth, admin
│       ├── middleware/   sign-in check, photo upload, error handling
│       └── lib/          database pool and helpers
│
└── client/               React website + admin panel
    ├── public/logo.webp  your logo
    └── src/
        ├── config/site.js    ← brand, phone, WhatsApp number in ONE file
        ├── i18n/             Bangla translations
        ├── pages/            Home, Shop, Product, Projects, Support, About
        └── admin/            Login, Dashboard, Products, Categories,
                              Home slider, Enquiries, Settings
```

---

## Using the admin panel

Sign in at `/admin` with the email and password you chose during setup.

**Products** — Add product asks for a name (English and Bangla), category, model
number, price and stock. Everything else is optional:

* **Photo** — up to 4 MB. Shoot the product against a white wall. Until you
  upload one, the card shows a plain lettered tile. That is deliberate: no
  picture on this site is one you did not take, so nothing can misrepresent
  what you actually sell.
* **Specification sheet** — a list of rows you type yourself. The
  **Fill standard specs** button drops in the shared electrical block from the OBD
  catalogue (AC 85–265 V, PF > 0.96, THD < 8%, isolated driver, and so on) so you
  only have to fill in wattage and lumens.
* **Wattage / colour temperature** — leave blank and they are read from the spec
  sheet automatically. They power the filters on the shop page.
* **Best sellers** — ticking this puts the product in the home page row.

**Categories** — 10 are already loaded, taken from your two handwritten lists. You
can rename them, edit the Bangla names, reorder or add your own. Sub-categories
are one per line as `English | বাংলা`. A category can also be created straight
from the Add product page with the **+ New** button beside the category box.

**Home slider** — the five big slides at the top of the home page. Add a product,
drag the order with the ↑ ↓ buttons, remove one with the bin. Each slide is a real
product: its own photograph, its name in both languages, its price and a WhatsApp
button. There is also a star on every row of the Products table that does the same
thing in one click.

**Enquiries** — every WhatsApp and call button on the site writes a line here, so
you can see what people are asking about before the chat even arrives. The project
enquiry form lands here too, with the person's name and number. Mark each one
New → Quoted → Site visit → Sold as you work it.

**Settings** — phone, WhatsApp number, address, opening hours, delivery charges,
warranty text, the footer's about paragraph and the strip line at the top of every
page, plus Facebook and YouTube links. Change them here and the whole site
follows; no code editing.

---

## Changing the brand

Two places:

1. `client/src/config/site.js` — name, tagline, colours fallback, logo path.
2. `client/public/logo.webp` — replace with your own file, same name.

Contact details are better changed from **Admin → Settings**, since those are
stored in the database and take effect without rebuilding.

---

## Going live later

When you buy the domain and hosting:

1. `npm run build` — this creates `client/dist/`, the finished website files.
2. Put `client/dist/` where your host serves the site from.
3. Run the `server/` folder with Node (a VPS, or cPanel's *Setup Node.js App*).
4. In `server/.env` set `NODE_ENV=production`, the live `CLIENT_ORIGIN` and
   `PUBLIC_URL`, and a long random `JWT_SECRET`.
5. Point the site's `/api` and `/uploads` at the Node server.

**Note on shared cPanel hosting:** it is built for PHP, and Node.js apps only run
there if the host offers *Setup Node.js App*. Ask them before you buy. A small VPS
(around ৳600–1,200/month) runs this without any of that trouble.

---

## Troubleshooting

**`npm run setup` says it cannot connect to MySQL**
MySQL is not running, or the user/password is wrong. Start MySQL, then run
`npm run setup` again — it will not duplicate anything.

**The website loads but no products appear**
The API is not running or cannot reach MySQL. Check the `api` lines in the
terminal, and open http://localhost:4000/api/health — it should say
`{"ok":true,"db":"connected"}`.

**"Cannot reach the server" in the browser**
The API stopped. Run `npm run dev` again, or `npm --prefix server run dev` alone
to see its error.

**I forgot the admin password**
```bash
cd server
npm run setup
```
Enter the same email and it resets the password.

**Port 4000 or 5173 already in use**
Change `PORT` in `server/.env`, or the port in `client/vite.config.js`.

---

## Still to come from you

* Real prices — the 36 starter products carry Bangladesh market prices checked
  against BDStall / SmartDeal in September 2026, not your prices. Correct them
  in Admin → Products.
* Real photographs — 8 of your own photos are already in
  `server/uploads/products/`. The rest of the range still shows drawings.
  Two files there start with `_branded-` (Transtec tube, iPower bulb): they carry
  another company's brand, so they are NOT attached to any product. Attach them
  from Admin → Products only if you actually resell those brands.
* Domain and hosting.

Everything else is ready.
