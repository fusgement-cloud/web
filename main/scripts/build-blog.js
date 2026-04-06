const fs   = require('fs');
const path = require('path');

let matter, marked;
try {
  matter = require('gray-matter');
  marked = require('marked').marked;
} catch(e) {
  console.error('Faltan dependencias. Ejecuta: npm install gray-matter marked');
  process.exit(1);
}

const SITE_URL = 'https://fusgement.com';
const AUTHOR   = 'Alberto Trujillo Sanz';

// Rutas relativas a la raíz del repo
const ROOT     = path.resolve(__dirname, '..');      // main/
const POSTS_ES = path.join(ROOT, '_posts', 'es');
const POSTS_EN = path.join(ROOT, '_posts', 'en');
const OUT_ES   = path.join(ROOT, 'es', 'blog');
const OUT_EN   = path.join(ROOT, 'en', 'blog');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatDate(dateStr, lang) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function categoryLabel(cat, lang) {
  const map = {
    es: {
      'gestion-proyectos':    'Gestión de proyectos',
      'ingenieria-electrica': 'Ingeniería eléctrica',
      'ingenieria':           'Ingeniería',
      'consultoria':          'Consultoría'
    },
    en: {
      'project-management':     'Project Management',
      'electrical-engineering': 'Electrical Engineering',
      'engineering':            'Engineering',
      'consulting':             'Consulting'
    }
  };
  return (map[lang] && map[lang][cat]) || cat;
}

function header(lang) {
  const es = lang === 'es';
  return `<header class="site-header">
  <div class="header-inner">
    <div class="logo-area">
      <img src="/images/fusgement logo6 fondo.png"
           alt="Fusgement – ${es ? 'Gestión de proyectos e ingeniería eléctrica' : 'Project management and electrical engineering'}"
           class="logo">
      <div>
        <div class="lema">FUSGEMENT - ${es ? 'La fusión de la coordinación con la optimización' : 'The fusion of coordination with optimization'}</div>
        <div class="small">Project Management, Engineering &amp; Consulting Group</div>
      </div>
    </div>
    <nav class="idiomas" aria-label="${es ? 'Selector de idioma' : 'Language selector'}">
      <a href="/${es ? 'es' : 'en'}/blog/" class="lang-btn active">${ es ? 'ES' : 'EN'}</a>
      <a href="/${es ? 'en' : 'es'}/blog/" class="lang-btn">${es ? 'EN' : 'ES'}</a>
    </nav>
  </div>
</header>`;
}

function nav(lang) {
  const es = lang === 'es';
  const links = es ? [
    ['/es/index.html','Inicio'],
    ['/es/direccion-de-proyectos.html','Dirección de proyectos'],
    ['/es/ingenieria-electrica.html','Ingeniería eléctrica'],
    ['/es/ingenieria.html','Ingeniería'],
    ['/es/otros-servicios.html','Otros servicios'],
    ['/es/quienes-somos.html','Quiénes somos'],
    ['/es/clientes.html','Clientes'],
    ['/es/contacto.html','Contacto'],
    ['/es/blog/','Blog'],
  ] : [
    ['/en/index.html','Home'],
    ['/en/projectmanagement.html','Project Management'],
    ['/en/electrical.html','Electrical Engineering'],
    ['/en/engineering.html','Engineering'],
    ['/en/otherservices.html','Other Services'],
    ['/en/aboutus.html','About Us'],
    ['/en/customers.html','Clients'],
    ['/en/contact.html','Contact'],
    ['/en/blog/','Blog'],
  ];
  return `<nav class="nav-bar" aria-label="${es ? 'Navegación principal' : 'Main navigation'}">
  <div class="nav-inner">
    ${links.map(([href,label]) =>
      `<div class="nav-innerindividual"><a href="${href}">${label}</a></div>`
    ).join('\n    ')}
  </div>
</nav>`;
}

function footer(lang) {
  const es = lang === 'es';
  return `<footer class="footer" role="contentinfo">
  <div class="container">
    <div class="footer-left small">&copy; <span id="year"></span> Fusgement – fusgement.com</div>
    <div class="footer-right legal">
      <a href="/${es?'es':'en'}/legal.html">${es?'Aviso legal':'Legal notice'}</a> |
      <a href="/${es?'es':'en'}/legal.html#privacidad">${es?'Política de privacidad':'Privacy policy'}</a> |
      <a href="/${es?'es':'en'}/legal.html#cookies">${es?'Política de cookies':'Cookie policy'}</a>
    </div>
  </div>
</footer>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>`;
}

function aside(lang) {
  const es = lang === 'es';
  return `<aside class="aside card small">
    <h2>${es ? 'Contacto rápido' : 'Quick contact'}</h2>
    <p><a href="mailto:fusgement@fusgement.com">fusgement@fusgement.com</a></p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0.9rem 0;">
    <p style="font-size:0.8rem;color:var(--muted);margin-bottom:0.5rem;">${es?'Servicios':'Services'}</p>
    <nav>
      <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:0.35rem;">
        ${es ? `
        <li><a href="/es/direccion-de-proyectos.html" style="font-size:0.84rem;color:var(--primary);">→ Dirección de proyectos</a></li>
        <li><a href="/es/ingenieria-electrica.html" style="font-size:0.84rem;color:var(--primary);">→ Ingeniería eléctrica</a></li>
        <li><a href="/es/ingenieria.html" style="font-size:0.84rem;color:var(--primary);">→ Ingeniería</a></li>
        <li><a href="/es/otros-servicios.html" style="font-size:0.84rem;color:var(--primary);">→ Otros servicios</a></li>
        ` : `
        <li><a href="/en/projectmanagement.html" style="font-size:0.84rem;color:var(--primary);">→ Project Management</a></li>
        <li><a href="/en/electrical.html" style="font-size:0.84rem;color:var(--primary);">→ Electrical Engineering</a></li>
        <li><a href="/en/engineering.html" style="font-size:0.84rem;color:var(--primary);">→ Engineering</a></li>
        <li><a href="/en/otherservices.html" style="font-size:0.84rem;color:var(--primary);">→ Other Services</a></li>
        `}
      </ul>
    </nav>
  </aside>`;
}

function buildPost(postData, lang, outDir) {
  const { title, slug, date, description, category, image, image_alt,
          author, published, en_slug, es_slug, content } = postData;

  if (!published) return;

  const es      = lang === 'es';
  const outFile = path.join(outDir, `${slug}.html`);
  const pageUrl = `${SITE_URL}/${es?'es':'en'}/blog/${slug}.html`;
  const altSlug = es ? en_slug : es_slug;
  const altLang = es ? 'en' : 'es';
  const altUrl  = altSlug
    ? `${SITE_URL}/${altLang}/blog/${altSlug}.html`
    : `${SITE_URL}/${altLang}/blog/`;

  ensureDir(outDir);

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Fusgement</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="${lang}" href="${pageUrl}">
  <link rel="alternate" hreflang="${altLang}" href="${altUrl}">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/es/blog/">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/blog.css">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title} | Fusgement">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image ? SITE_URL+image : SITE_URL+'/images/fusgement_logo6_fondo_y_letras.png'}">
  <meta property="og:locale" content="${es ? 'es_ES' : 'en_GB'}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${title}",
    "description": "${description}",
    "url": "${pageUrl}",
    "datePublished": "${date}",
    "dateModified": "${date}",
    "author": { "@type": "Person", "name": "${author || AUTHOR}" },
    "publisher": {
      "@type": "Organization",
      "name": "Fusgement",
      "url": "${SITE_URL}",
      "logo": "${SITE_URL}/images/fusgement_logo6_fondo_y_letras.png"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "${es?'Inicio':'Home'}", "item": "${SITE_URL}/${es?'es':'en'}/index.html" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "${SITE_URL}/${es?'es':'en'}/blog/" },
      { "@type": "ListItem", "position": 3, "name": "${title}", "item": "${pageUrl}" }
    ]
  }
  </script>
</head>
<body>
${header(lang)}
${nav(lang)}
<main class="main container">
  <article class="content card" itemscope itemtype="https://schema.org/BlogPosting">
    <nav aria-label="${es?'Ruta de navegación':'Breadcrumb'}" class="breadcrumb">
      <a href="/${es?'es':'en'}/index.html">${es?'Inicio':'Home'}</a>
      <span>›</span>
      <a href="/${es?'es':'en'}/blog/">Blog</a>
      <span>›</span>
      <span>${title}</span>
    </nav>
    <div class="post-meta">
      <span class="post-category">${categoryLabel(category, lang)}</span>
      <span class="post-date"><time datetime="${date}" itemprop="datePublished">${formatDate(date, lang)}</time></span>
      <span class="post-author" itemprop="author">${author || AUTHOR}</span>
    </div>
    <h1 itemprop="headline">${title}</h1>
    ${image ? `<figure class="post-hero-image"><img src="${image}" alt="${image_alt || title}" loading="eager" itemprop="image"></figure>` : ''}
    <div class="post-content" itemprop="articleBody">${content}</div>
    <div class="post-cta">
      <p>${es ? '¿Le ha resultado útil este artículo? Contáctenos para hablar de su proyecto.' : 'Found this article useful? Get in touch to discuss your project.'}</p>
      <a href="/${es?'es':'en'}/${es?'contacto':'contact'}.html" class="btn-cta">${es ? 'Contactar ahora' : 'Get in touch'}</a>
    </div>
    <div class="post-back">
      <a href="/${es?'es':'en'}/blog/">← ${es?'Volver al blog':'Back to blog'}</a>
    </div>
  </article>
  ${aside(lang)}
</main>
${footer(lang)}
</body>
</html>`;

  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`✓ Generado: ${outFile}`);
  return postData;
}

function buildIndex(posts, lang, outDir) {
  const es      = lang === 'es';
  const outFile = path.join(outDir, 'index.html');
  const pageUrl = `${SITE_URL}/${es?'es':'en'}/blog/`;

  ensureDir(outDir);

  const postCards = posts
    .filter(p => p.published)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(p => `
    <article class="blog-card">
      ${p.image ? `<a href="/${es?'es':'en'}/blog/${p.slug}.html" class="blog-card-img-link">
        <img src="${p.image}" alt="${p.image_alt || p.title}" loading="lazy">
      </a>` : ''}
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span class="post-category">${categoryLabel(p.category, lang)}</span>
          <time datetime="${p.date}">${formatDate(p.date, lang)}</time>
        </div>
        <h2><a href="/${es?'es':'en'}/blog/${p.slug}.html">${p.title}</a></h2>
        <p>${p.description}</p>
        <a href="/${es?'es':'en'}/blog/${p.slug}.html" class="blog-read-more">${es ? 'Leer artículo →' : 'Read article →'}</a>
      </div>
    </article>`).join('\n');

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${es ? 'Blog | Gestión de proyectos e ingeniería eléctrica' : 'Blog | Project Management & Electrical Engineering'} | Fusgement</title>
  <meta name="description" content="${es
    ? 'Artículos técnicos sobre gestión de proyectos, PMO, ingeniería eléctrica y consultoría. Conocimiento práctico del equipo de Fusgement.'
    : 'Technical articles on project management, PMO, electrical engineering and consulting. Practical knowledge from the Fusgement team.'}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="${lang}" href="${pageUrl}">
  <link rel="alternate" hreflang="${es?'en':'es'}" href="${SITE_URL}/${es?'en':'es'}/blog/">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/es/blog/">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/blog.css">
</head>
<body>
${header(lang)}
${nav(lang)}
<main class="main container">
  <article class="content card">
    <nav aria-label="${es?'Ruta de navegación':'Breadcrumb'}" class="breadcrumb">
      <a href="/${es?'es':'en'}/index.html">${es?'Inicio':'Home'}</a>
      <span>›</span>
      <span>Blog</span>
    </nav>
    <div class="section-label">Blog</div>
    <h1 style="margin-top:0.2rem;">${es ? 'Artículos sobre gestión de proyectos e ingeniería' : 'Articles on project management and engineering'}</h1>
    <p style="color:var(--muted);font-size:0.93rem;margin-bottom:1.8rem;">${es
      ? 'Conocimiento técnico práctico del equipo de Fusgement sobre gestión de proyectos, PMO, ingeniería eléctrica y consultoría.'
      : 'Practical technical knowledge from the Fusgement team on project management, PMO, electrical engineering and consulting.'}</p>
    ${posts.filter(p=>p.published).length === 0
      ? `<p style="color:var(--muted);">${es ? 'Próximamente, primeros artículos.' : 'First articles coming soon.'}</p>`
      : `<div class="blog-grid">${postCards}</div>`}
  </article>
  ${aside(lang)}
</main>
${footer(lang)}
</body>
</html>`;

  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`✓ Generado: ${outFile}`);
}

function readPosts(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const { data, content } = matter(raw);
      return { ...data, content: marked(content) };
    });
}

console.log('Construyendo blog...');
console.log('Posts ES:', POSTS_ES);
console.log('Posts EN:', POSTS_EN);

const postsEs = readPosts(POSTS_ES);
const postsEn = readPosts(POSTS_EN);

postsEs.forEach(p => buildPost(p, 'es', OUT_ES));
postsEn.forEach(p => buildPost(p, 'en', OUT_EN));

buildIndex(postsEs, 'es', OUT_ES);
buildIndex(postsEn, 'en', OUT_EN);

console.log(`\nBlog generado: ${postsEs.length} artículos ES, ${postsEn.length} artículos EN`);
