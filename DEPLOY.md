# OBD LIGHTING LTD — লাইভে নেওয়ার গাইড

---

## ০. আগে এই একটা জিনিস দেখুন

হোস্টিং কেনার পর cPanel-এ ঢুকে খুঁজুন: **Setup Node.js App**

- **আছে** → নিচের **পথ ক** (shared hosting)
- **নাই** → নিচের **পথ খ** (VPS লাগবে)

এই সাইট Node.js দিয়ে চলে, PHP দিয়ে না। শুধু PHP হোস্টিং-এ এটা চলবে না।
হোস্টিং কোম্পানিকে জিজ্ঞেস করুন: *"Does my plan support Node.js applications
and MySQL?"* উত্তর না হলে টাকা ফেরত চেয়ে VPS নিন — সবচেয়ে ছোট VPS
(১ GB RAM) যথেষ্ট, মাসে ৳৬০০–১২০০।

---

## ১. আগে নিজের কম্পিউটারে বিল্ড করুন

প্রজেক্ট ফোল্ডারে টার্মিনাল খুলে:

```bash
npm run build
```

এতে `client/dist/` ফোল্ডার তৈরি হবে — এটাই ওয়েবসাইটের ফাইনাল ফাইল।

---

## পথ ক — cPanel (Setup Node.js App আছে)

### ১. ডেটাবেজ বানান
cPanel → **MySQL Databases**
- Database: `obd_lighting`
- নতুন user বানিয়ে সেটাকে database-এ **ALL PRIVILEGES** দিন
- ইউজারনেম, পাসওয়ার্ড, আর database-এর পুরো নাম লিখে রাখুন
  (cPanel সাধারণত `youracct_obd_lighting` এরকম নাম দেয়)

### ২. টেবিল বানান
`server/.env` এ database-এর তথ্য বসিয়ে নিজের কম্পিউটার থেকে এক কমান্ডেই:

```bash
npm run db:push
```

অথবা হাতে: cPanel → **phpMyAdmin** → database সিলেক্ট → **Import** →
আগে `database/schema.sql`, তারপর `database/seed.sql`।

### ৩. ফাইল আপলোড
cPanel → **File Manager**
- `server/` ফোল্ডারটা আপলোড করুন `/home/youracct/obd-api/` তে
  (`node_modules` বাদ দিয়ে — ওটা সার্ভারে ইনস্টল হবে)
- `client/dist/` এর **ভিতরের সব ফাইল** আপলোড করুন `public_html/` এ

### ৪. Node app চালু
cPanel → **Setup Node.js App** → Create Application
- Node version: **18 বা তার বেশি**
- Application root: `obd-api`
- Application startup file: `src/index.js`
- **Run NPM Install** বাটনে চাপ দিন

Environment variables (একই পেজে যোগ করুন):

```
NODE_ENV       = production
PORT           = 4000
DB_HOST        = localhost
DB_USER        = আপনার cPanel MySQL ইউজার
DB_PASSWORD    = আপনার পাসওয়ার্ড
DB_NAME        = youracct_obd_lighting
JWT_SECRET     = (নিচের কমান্ডে বানানো লম্বা এলোমেলো লেখা)
CLIENT_ORIGIN  = https://yourdomain.com
PUBLIC_URL     = https://yourdomain.com
```

JWT_SECRET বানাতে নিজের কম্পিউটারে:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Start App** চাপুন।

### ৫. /api আর /uploads কে Node-এ পাঠান
`public_html/.htaccess` ফাইলে লিখুন:

```apache
RewriteEngine On

# API আর ছবির অনুরোধ Node সার্ভারে
RewriteRule ^(api|uploads)/(.*)$ http://127.0.0.1:4000/$1/$2 [P,L]

# বাকি সব React কে (রিফ্রেশ করলে 404 হবে না)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### ৬. অ্যাডমিন অ্যাকাউন্ট
cPanel → **Terminal** (থাকলে):
```bash
cd ~/obd-api && npm run setup
```
না থাকলে নিজের কম্পিউটারে `node server/scripts/hash-password.js` চালিয়ে
hash বানিয়ে phpMyAdmin দিয়ে `admins` টেবিলে সারি যোগ করুন
(role অবশ্যই `admin`)।

---

## পথ খ — VPS (Ubuntu)

SSH দিয়ে ঢুকে, এক এক করে:

```bash
# ১. দরকারি সফটওয়্যার
sudo apt update && sudo apt install -y nginx mysql-server git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# ২. ডেটাবেজ
sudo mysql -e "CREATE DATABASE obd_lighting CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER 'obd'@'localhost' IDENTIFIED BY 'একটা-শক্ত-পাসওয়ার্ড';"
sudo mysql -e "GRANT ALL ON obd_lighting.* TO 'obd'@'localhost'; FLUSH PRIVILEGES;"

# ৩. কোড তুলুন (zip আপলোড করে unzip, বা git clone)
cd /var/www && sudo unzip ~/obd-lighting.zip && cd obd-lighting
sudo chown -R $USER:$USER /var/www/obd-lighting

# ৪. সেটআপ — MySQL user obd, পাসওয়ার্ড উপরেরটা, admin ইমেইল-পাসওয়ার্ড
npm run setup

# ৫. ওয়েবসাইট বিল্ড
npm run build

# ৬. API সবসময় চালু রাখুন
cd server && pm2 start src/index.js --name obd-api && pm2 save && pm2 startup
```

`server/.env` খুলে ঠিক করুন:
```
NODE_ENV=production
CLIENT_ORIGIN=https://yourdomain.com
PUBLIC_URL=https://yourdomain.com
```
তারপর `pm2 restart obd-api`

### nginx
`sudo nano /etc/nginx/sites-available/obd` :

```nginx
server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;

  root /var/www/obd-lighting/client/dist;
  index index.html;

  # React রাউটিং — রিফ্রেশ করলে 404 হবে না
  location / { try_files $uri $uri/ /index.html; }

  # API আর আপলোড করা ছবি
  location ~ ^/(api|uploads)/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 8M;      # ছবি আপলোডের জন্য
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/obd /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### HTTPS (ফ্রি)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## ২. ডোমেইন

হোস্টিং-এর দেওয়া nameserver ডোমেইনে বসান, অথবা A record দিন:

| Type | Name | Value |
|---|---|---|
| A | @ | সার্ভারের IP |
| A | www | সার্ভারের IP |

ছড়াতে ২৪ ঘণ্টা পর্যন্ত লাগতে পারে।

---

## ৩. লাইভ হওয়ার পর — চেকলিস্ট

- [ ] `https://yourdomain.com` খোলে
- [ ] `https://yourdomain.com/api/health` লেখে `{"ok":true,"db":"connected"}`
- [ ] প্রোডাক্টের ছবি দেখা যায়
- [ ] `/admin` এ লগইন হয়
- [ ] Admin থেকে নতুন প্রোডাক্ট যোগ হয়, ছবি আপলোড হয়
- [ ] WhatsApp বাটন কাজ করে
- [ ] ফোনে খুলে দেখুন

---

## ৪. পরে কিছু বদলালে

```bash
# নিজের কম্পিউটারে
npm run build
# client/dist এর ফাইল আবার আপলোড

# সার্ভার কোড বদলালে (VPS)
pm2 restart obd-api
```

---

## ৫. লাইভে যাওয়ার আগে অবশ্যই

1. **অ্যাডমিন পাসওয়ার্ড বদলান** — `obd12345` চ্যাটে লেখা হয়ে গেছে।
   Admin → Settings → Change your password
2. **multer** — ২.x এ আপগ্রেড করা হয়েছে (১.x এ নিরাপত্তা সমস্যা ছিল)।
   সার্ভারে `npm install` চালালেই নতুনটা বসবে।
3. **JWT_SECRET** — কমপক্ষে ৩২ অক্ষরের এলোমেলো লেখা হতে হবে। ছোট বা ফাঁকা
   দিলে প্রোডাকশনে সার্ভার ইচ্ছা করেই চালু হবে না।
4. **`server/.env` কখনো কাউকে পাঠাবেন না** — ডেটাবেজের পাসওয়ার্ড ওখানে।
5. **ডেটাবেজ ব্যাকআপ** — phpMyAdmin → Export, বা VPS-এ:
   `mysqldump -u obd -p obd_lighting > backup.sql`
