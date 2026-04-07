const fs = require('fs');
const path = require('path');
 
const BASE_URL = 'https://fusgement.com';
const POSTS_DIRS = [
{ dir: 'main/_posts/es', lang: 'es' },
{ dir: 'main/_posts/en', lang: 'en' },
];
const SITEMAP_PATH = path.join('main', 'sitemap.xml');
 
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
 
// Lee los slugs de posts que ya están en el sitemap para no duplicar
function getExistingSlugs(sitemapContent) {
  const matches = sitemapContent.match(/<loc>(https:\/\/fusgement\.com\/(es|en)\/blog\/[^<]+)<\/loc>/g) || [];
  return new Set(matches.map(m => m.replace(/<\/?loc>/g, '')));
}
 
function getPostEntries() {
  const entries = [];
 
  // Primero recogemos todos los posts de ambos idiomas para cruzar hreflang
  const postsByLang = { es: {}, en: {} };
 
  for (const { dir, lang } of POSTS_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
 
    for (const file of files) {
      const match = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
      if (!match) continue;
      const [, date, slug] = match;
 
      // Leer el frontmatter para obtener el slug del idioma alternativo
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const altSlugMatch = content.match(/(?:en_slug|es_slug):\s*["']?([^"'\n]+)["']?/);
      const altSlug = altSlugMatch ? altSlugMatch[1].trim() : null;
 
      postsByLang[lang][slug] = { date, altSlug };
    }
  }
 
  // Generar entradas con hreflang cruzado
  for (const [lang, posts] of Object.entries(postsByLang)) {
    const altLang = lang === 'es' ? 'en' : 'es';
 
    for (const [slug, { date, altSlug }] of Object.entries(posts)) {
      const loc = `${BASE_URL}/${lang}/blog/${slug}.html`;
      const altLoc = altSlug ? `${BASE_URL}/${altLang}/blog/${altSlug}.html` : null;
 
      let hreflang = `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(loc)}"/>\n`;
      if (altLoc) {
        hreflang += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${escapeXml(altLoc)}"/>\n`;
      }
 
      entries.push({
        loc,
        lastmod: date,
        hreflang,
      });
    }
  }
 
  return entries;
}
 
function generateSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`❌ No se encontró ${SITEMAP_PATH}. Asegúrate de que existe el sitemap base.`);
    process.exit(1);
  }
 
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const existingSlugs = getExistingSlugs(sitemap);
  const postEntries = getPostEntries();
 
  const newEntries = postEntries.filter(e => !existingSlugs.has(e.loc));
 
  if (newEntries.length === 0) {
    console.log('ℹ️  No hay posts nuevos que añadir al sitemap.');
    return;
  }
 
  const newUrlBlocks = newEntries.map(({ loc, lastmod, hreflang }) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
${hreflang}    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');
 
  // Inserta los nuevos bloques justo antes del cierre </urlset>
  sitemap = sitemap.replace('</urlset>', `${newUrlBlocks}\n</urlset>`);
 
  fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');
  console.log(`✅ Sitemap actualizado: ${newEntries.length} post(s) nuevo(s) añadido(s).`);
  newEntries.forEach(e => console.log(`   → ${e.loc}`));
}
 
generateSitemap();
