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
      'consultoria':          'Consultoría',
      'entrevista':           'Entrevista'
    },
    en: {
      'project-management':     'Project Management',
      'electrical-engineering': 'Electrical Engineering',
      'engineering':            'Engineering',
      'consulting':             'Consulting',
      'interview':              'Interview'
    }
  };
  return (map[lang] && map[lang][cat]) || cat;
}

function header(lang, currentPath, alternatePath) {
  const es = lang === 'es';
  const links = es ? [
    ['/es/index.html','Inicio'],
    ['/es/direccion-de-proyectos.html','Dirección de proyectos'],
    ['/es/ingenieria.html','Servicios de ingeniería'],
    ['/es/quienes-somos.html','Quiénes somos'],
    ['/es/clientes.html','Clientes'],
    ['/es/blog/','Blog'],
    ['https://cms.fusgement.com','Proveedores'],
  ] : [
    ['/en/index.html','Home'],
    ['/en/projectmanagement.html','Project Management'],
    ['/en/engineering.html','Engineering Services'],
    ['/en/aboutus.html','About Us'],
    ['/en/customers.html','Clients'],
    ['/en/blog/','Blog'],
    ['https://cms.fusgement.com','Suppliers'],
  ];
  return `<header class="site-header">
  <div class="header-inner">
    <a href="/${es ? 'es' : 'en'}/index.html" class="logo-area" aria-label="${es ? 'Fusgement Inicio' : 'Fusgement Home'}">
      <img src="/images/fusgement-logo-cuadrado.png"
           alt="Fusgement – ${es ? 'Gestión de proyectos e ingeniería eléctrica' : 'Project management and electrical engineering'}"
           class="logo">
      <span class="brand-text">
        <span class="lema">FUSGEMENT</span>
        <span class="sub-lema">Project Management, Engineering &amp; Consulting Group</span>
      </span>
    </a>
    <nav class="nav-links" aria-label="${es ? 'Navegación principal' : 'Main navigation'}">
      ${links.map(([href,label]) =>
        `<a href="${href}" class="nav-link${href === `/${es ? 'es' : 'en'}/blog/` ? ' active' : ''}"${href === `/${es ? 'es' : 'en'}/blog/` ? ' aria-current="page"' : ''}${href.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`
      ).join('\n      ')}
    </nav>
    <div class="nav-actions">
      <nav class="lang-switch" aria-label="${es ? 'Selector de idioma' : 'Language selector'}">
        <a href="${es ? currentPath : alternatePath}" class="lang-btn${es ? ' active' : ''}"${es ? ' aria-current="page"' : ''} title="Versión en Español">ES</a>
        <a href="${es ? alternatePath : currentPath}" class="lang-btn${es ? '' : ' active'}"${es ? '' : ' aria-current="page"'} title="English version">EN</a>
      </nav>
      <a href="/${es ? 'es/contacto' : 'en/contact'}.html" class="btn-navbar-cta">
        <span>${es ? 'Contactar' : 'Contact'}</span>
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </a>
    </div>
  </div>
</header>`;
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
  const currentPath = `/${es?'es':'en'}/blog/${slug}.html`;
  const alternatePath = altSlug
    ? `/${altLang}/blog/${altSlug}.html`
    : `/${altLang}/blog/`;

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
  <link rel="alternate" hreflang="x-default" href="${es ? pageUrl : altUrl}">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/blog.css">
  <link rel="stylesheet" href="/css/site-enhancements.css">
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
  <script src="/js/consent.js" defer></script>
  <script src="/js/scroll-reveal.js" defer></script>
</head>
<body>
${header(lang, currentPath, alternatePath)}
<main class="main container full-width">
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
  <link rel="stylesheet" href="/css/index-2026.css">
  <link rel="stylesheet" href="/css/blog.css">
  <link rel="stylesheet" href="/css/site-enhancements.css">
  <script src="/js/consent.js" defer></script>
  <script src="/js/scroll-reveal.js" defer></script>
</head>
<body>
${header(lang, `/${es?'es':'en'}/blog/`, `/${es?'en':'es'}/blog/`)}
<main class="main container full-width">
  <article class="content card">
    <header class="hero-head">
      <p class="eyebrow">${es ? 'Blog de Fusgement' : 'The Fusgement blog'}</p>
      <h1>${es ? 'Artículos sobre <em>gestión de proyectos e ingeniería</em>' : 'Articles on <em>project management and engineering</em>'}</h1>
      <p class="hero-trust">${es
        ? 'Conocimiento técnico práctico del equipo de Fusgement sobre gestión de proyectos, PMO, ingeniería eléctrica y consultoría.'
        : 'Practical technical knowledge from the Fusgement team on project management, PMO, electrical engineering and consulting.'}</p>
      <div class="hero-cta">
        <a class="btn-cta" href="/${es?'es/contacto':'en/contact'}.html">${es ? 'Hablemos de su proyecto' : 'Let’s discuss your project'}</a>
        <a class="btn-ghost" href="#${es?'articulos':'articles'}">${es ? 'Ver artículos' : 'Explore articles'}</a>
      </div>
    </header>
    <section id="${es?'articulos':'articles'}" class="reveal-on-scroll reveal-fade-up">
      <div class="section-label">${es ? 'Publicaciones recientes' : 'Recent articles'}</div>
      <h2>${es ? 'Ideas prácticas para sus proyectos' : 'Practical insight for your projects'}</h2>
      ${posts.filter(p=>p.published).length === 0
        ? `<p style="color:var(--muted);">${es ? 'Próximamente, primeros artículos.' : 'First articles coming soon.'}</p>`
        : `<div class="blog-grid">${postCards}</div>`}
    </section>
    <section class="reveal-on-scroll reveal-fade-up">
      <div class="cta-band">
        <div>
          <p>${es ? '¿Necesita apoyo para llevar su proyecto a buen puerto?' : 'Need support to move your project forward?'}
            <span>${es ? 'Cuéntenos qué necesita y exploraremos cómo podemos ayudarle.' : 'Tell us what you need and we’ll explore how we can help.'}</span>
          </p>
        </div>
        <a class="btn-cta" href="/${es?'es/contacto':'en/contact'}.html">${es ? 'Contactar ahora' : 'Contact us'}</a>
      </div>
    </section>
  </article>
</main>
${footer(lang)}
<a class="fab-cta" href="/${es?'es/contacto':'en/contact'}.html">${es ? 'Contactar ahora' : 'Contact now'}</a>
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
