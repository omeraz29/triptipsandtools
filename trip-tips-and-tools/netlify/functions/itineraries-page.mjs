export default async (req) => {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Itineraries • Trip Tips and Tools</title>
  <link rel="stylesheet" href="/styles.css" />
  <style>
    .feature.photo-card {
      position: relative; overflow: hidden; min-height: 260px;
      background-size: cover; background-position: center;
      border-radius: 16px; display: flex; flex-direction: column;
      justify-content: flex-end; padding: 0;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .feature.photo-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
    .feature.photo-card::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.82) 100%);
      border-radius: inherit; z-index: 0;
    }
    .feature.photo-card .card-content { position: relative; z-index: 1; padding: 20px; }
    .feature.photo-card .title { color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
    .feature.photo-card .desc { color: rgba(255,255,255,0.85); text-shadow: 0 1px 3px rgba(0,0,0,0.4); margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="nav">
    <div class="nav-inner">
      <a class="brand" href="/index.html">
        <div class="logo"></div>
        <div>Trip Tips and Tools</div>
      </a>
      <div class="navlinks">
        <a class="pill" href="/itineraries">Itineraries</a>
        <a class="pill" href="/expense-tool.html">Expense Tool</a>
        <a class="pill" href="/index.html">Home</a>
      </div>
    </div>
  </div>
  <div class="container section">
    <div class="h2">Itineraries</div>
    <p class="muted" style="margin-top:0">Detailed day-by-day travel plans with costs, activities, and tips.</p>
    <div class="grid3">
      <div class="feature photo-card" style="background-image: url('/images/Japan/Day2.webp')">
        <div class="card-content">
          <div class="title">Japan (11 Days): Tokyo → Kyoto → Osaka</div>
          <p class="desc">Shibuya base, go-karts, baseball + karaoke, Mt. Fuji stop, Kyoto classics, Osaka nightlife.</p>
          <a class="btn ghost" href="/japan-itinerary.html">View itinerary</a>
        </div>
      </div>
      <div class="feature">
        <div class="title">Costa Rica (9 Days)</div>
        <p class="desc">San José → Manuel Antonio → Monteverde → Arenal → Tamarindo. Car rental, ziplining, volcano, hot springs, Pacific beach.</p>
        <div style="height:10px"></div>
        <a class="btn ghost" href="/costa-rica-itinerary.html">View itinerary</a>
      </div>
      <div class="feature">
        <div class="title">Spain (10 Days)</div>
        <p class="desc">Barcelona → Palma de Mallorca → Madrid. Gaudí, Mediterranean beaches, hidden coves, and world-class nightlife.</p>
        <div style="height:10px"></div>
        <a class="btn ghost" href="/spain-itinerary.html">View itinerary</a>
      </div>
    </div>
    <div style="height:14px"></div>
    <div class="notice">New itineraries are added regularly. Check back for more destinations!</div>
  </div>
  <div class="container footer">
    <div class="muted">This site contains affiliate links. We may earn a small commission if you book through them, at no extra cost to you.</div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
};

export const config = {
  path: "/itineraries",
  preferStatic: false
};
