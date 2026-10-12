HOW TO ADD REAL PRODUCT PHOTOS
================================

Drop a photo into this folder for any saree, named after its ID, and it
will automatically replace that saree's generated colour swatch — on the
homepage bestsellers, the full collections grid, and its own product page.
No code changes needed, and any saree without a photo yet just keeps
showing its colour swatch (nothing breaks).

Filename must match the "id" field in js/data.js exactly:

  sp-001.jpg   Kalyani Kalash Bridal Paithani
  sp-002.jpg   Asawali Vine Festive Paithani
  sp-003.jpg   Shirodak Ivory Reception Paithani
  sp-004.jpg   Kalichandrakala Classic Paithani
  sp-005.jpg   Rani Pink Office-Silk Paithani
  sp-006.jpg   Basant Yellow Haldi Paithani
  sp-007.jpg   Peshwai Maroon Diwali Paithani
  sp-008.jpg   Neel Kamal Reception Paithani
  sp-009.jpg   Gift-Box Mor Butti Paithani
  sp-010.jpg   Ajanta Red Bridal Paithani

Technical notes:
- Shoot or crop each photo in portrait orientation (roughly 3:4, e.g.
  1200x1600px) — that's the shape the cards and product page use.
- JPG, ideally under ~300KB after compression (TinyPNG.com or
  Squoosh.app) so the collection grid stays fast with 10 photos loading
  at once.
- Only use photography you own or have a paid licence for — your own
  shoot, or a photographer's work you've paid usage rights on.
- Add as many or as few as you have ready — sp-001.jpg alone works fine;
  the other 9 will just keep showing their colour swatch until you add
  photos for them too.
- Once you have real photos for the whole catalog, it's worth eventually
  replacing js/data.js's SAREES array with your real stock list (real
  names, prices, stock counts) — see the main README's "Next steps".
