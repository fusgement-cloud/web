const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://fusgement.com';
const POSTS_DIRS = ['_posts/es', '_posts/en'];

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getPostUrls() {
  const urls = [];

  for (const dir of POSTS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const lang = dir.includes('/es') ? 'es' : 'en';
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      // Nombre esperado: YYYY-MM-DD-slug.md
      const match = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
      if (!match) continue;
      const [, date, slug] = match;
      urls.push({
        url: `${BASE_URL}/${lang}/blog/${slug}.html`,
        lastmod: date,
      });
    }
  }

  return urls;
}

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: `${BASE_URL}/`,    lastmod: today },
    { url: `${BASE_URL}/es/`, lastmod: today },
    { url: `${BASE_URL}/en/`, lastmod: today },
  ];

  const postUrls = getPostUrls();
  const allUrls = [...staticPages, ...postUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(({ url, lastmod }) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === BASE_URL + '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  const outputPath = path.join('main', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`✅ Sitemap generado en ${outputPath} con ${allUrls.length} URLs`);
}

generateSitemap();
