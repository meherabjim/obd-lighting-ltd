OBD Lighting — update pack
==========================

এই ZIP-টা পুরো প্রজেক্ট নয়। শুধু যেগুলো বদলেছে সেই ফাইলগুলো আছে।

কী করবেন
--------
1. ZIP-টা Extract করুন।
2. ভিতরের ফোল্ডারের সবকিছু (database, client, server, README.md) কপি করে
   আপনার obd-lighting ফোল্ডারের উপরে Paste করুন — Windows জিজ্ঞেস করলে
   "Replace the files in the destination" দিন।
3. VS Code-এর টার্মিনালে:

       npm run setup
       npm run dev

   setup আবার MySQL ইউজার/পাসওয়ার্ড আর admin ইমেইল-পাসওয়ার্ড চাইবে —
   আগেরগুলোই দিন। ডেটাবেজ নতুন করে সাজাবে (১০ ক্যাটাগরি, ৩৬ প্রোডাক্ট)।

What changed
------------
* 10 categories only (your two handwritten lists), 36 products with prices
* Company name is "OBD Lighting" — no "Ltd." anywhere
* Footer text, about text, Facebook / YouTube links are now editable in
  Admin -> Settings
* Hero slider hardened (pause on hover, 1/5 counter, never blanks)
* Admin -> Add product: visual picker for the drawing + "Suggest" SKU button
* An error screen instead of a white page if anything breaks
* 8 of your own photographs wired to products

Photos
------
server/uploads/products/ now holds your photos. Attached to:
  bulb-a-e27.jpg              -> AC Bulb 9W E27
  bulb-a-dc.jpg               -> DC Bulb 9W 12V
  cfl-spiral.jpg              -> Spiral Energy Saving Bulb 25W (new)
  downlight-surface-white.jpg -> Surface Downlight 12W White (new)
  downlight-surface-black.jpg -> Surface Downlight 12W Black & Gold (new)
  flood-ip66.jpg              -> all four Flood Lights
  batten-slim.jpg             -> Slim Batten 36W 4ft (new)
  shade-double.jpg            -> Industrial Single & Double Shade

NOT attached to anything, on purpose:
  _branded-transtec-tube.png  (shows TRANSTEC's brand and packaging)
  _branded-ipower-bulb.jpg    (shows iPOWER's brand)
These are other companies' trademarks. Put them on the site only if you
actually resell those brands — Admin -> Products -> Edit -> Photo.
