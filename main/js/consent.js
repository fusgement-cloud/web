/*
 * Consentimiento de cookies + Google Analytics 4 (Fusgement)
 *
 * Funcionamiento ("modo básico" de Consent Mode):
 *  - Mientras la persona no acepte, NO se carga nada de Google ni se instala ninguna cookie.
 *  - Si acepta, se carga Google Analytics 4 y se instalan _ga y _ga_<ID>.
 *  - Si rechaza, o retira el consentimiento más tarde, se bloquea GA y se borran sus cookies.
 *  - La elección se guarda 24 meses en localStorage (clave "fusgement_consent").
 *
 * PARA ACTIVARLO: sustituye GA_ID por el ID de medición de tu flujo web de GA4.
 * Mientras valga "G-XXXXXXXXXX", este archivo no hace nada (no muestra banner ni carga Google).
 */
(function () {
  'use strict';

  var GA_ID = 'G-48E8WRV4N5';                      // <-- ÚNICO valor a cambiar
  var STORAGE_KEY = 'fusgement_consent';
  var MAX_AGE_MS = 730 * 24 * 60 * 60 * 1000;      // 24 meses (buena práctica de la AEPD)

  if (GA_ID === 'G-XXXXXXXXXX' || !/^G-[A-Z0-9]{6,12}$/.test(GA_ID)) { return; }

  var es = (document.documentElement.lang || 'es').toLowerCase().indexOf('en') !== 0;
  var T = es ? {
    region: 'Aviso de cookies',
    text: 'Usamos cookies de análisis (Google Analytics) para saber cuántas personas visitan la web y qué páginas consultan. Solo las activamos si las aceptas.',
    more: 'Más información',
    accept: 'Aceptar',
    reject: 'Rechazar',
    settings: 'Configurar cookies',
    policy: '/es/legal.html#cookies'
  } : {
    region: 'Cookie notice',
    text: 'We use analytics cookies (Google Analytics) to learn how many people visit the site and which pages they view. We only enable them if you accept.',
    more: 'More information',
    accept: 'Accept',
    reject: 'Reject',
    settings: 'Cookie settings',
    policy: '/en/legal.html#cookies'
  };

  /* ---------- Almacenamiento de la elección ---------- */
  var memory = null;
  function readChoice() {
    var raw = null;
    try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (e) { raw = memory; }
    if (!raw) { return null; }
    try {
      var c = JSON.parse(raw);
      if (typeof c.a !== 'boolean' || typeof c.t !== 'number') { return null; }
      if (Date.now() - c.t > MAX_AGE_MS) { return null; }
      return c;
    } catch (e) { return null; }
  }
  function saveChoice(accepted) {
    var raw = JSON.stringify({ v: 1, a: accepted, t: Date.now() });
    memory = raw;
    try { window.localStorage.setItem(STORAGE_KEY, raw); } catch (e) { /* modo privado */ }
  }

  /* ---------- Google Analytics 4 ---------- */
  var gaLoaded = false;
  function loadGA() {
    window['ga-disable-' + GA_ID] = false;
    if (gaLoaded) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      return;
    }
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }

  function deleteGACookies() {
    var host = location.hostname;
    var parts = host.split('.');
    var domains = [host, '.' + host];
    if (parts.length > 2) { domains.push('.' + parts.slice(-2).join('.')); }
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].replace(/^\s+|\s+$/g, '');
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        var gone = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = gone;
        domains.forEach(function (d) { document.cookie = gone + '; domain=' + d; });
      }
    });
  }

  function disableGA() {
    window['ga-disable-' + GA_ID] = true;
    if (window.gtag) { window.gtag('consent', 'update', { analytics_storage: 'denied' }); }
    deleteGACookies();
  }

  /* ---------- Banner ---------- */
  var banner = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text) { n.textContent = text; }
    return n;
  }

  function hideBanner() {
    if (!banner) { return; }
    banner.parentNode.removeChild(banner);
    banner = null;
    document.body.style.paddingBottom = '';
  }

  function showBanner(focusIt) {
    if (banner) { return; }
    banner = el('section', 'cc-banner');
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', T.region);

    var inner = el('div', 'cc-inner');
    var p = el('p', 'cc-text', T.text + ' ');
    var more = el('a', null, T.more);
    more.href = T.policy;
    p.appendChild(more);

    var actions = el('div', 'cc-actions');
    // Mismo formato y mismo nivel visual: exigido por la guía de la AEPD.
    var reject = el('button', 'cc-btn', T.reject);
    var accept = el('button', 'cc-btn', T.accept);
    reject.type = 'button';
    accept.type = 'button';

    reject.addEventListener('click', function () {
      saveChoice(false); disableGA(); hideBanner(); focusSettings();
    });
    accept.addEventListener('click', function () {
      saveChoice(true); loadGA(); hideBanner(); focusSettings();
    });

    actions.appendChild(reject);
    actions.appendChild(accept);
    inner.appendChild(p);
    inner.appendChild(actions);
    banner.appendChild(inner);
    document.body.appendChild(banner);
    document.body.style.paddingBottom = banner.offsetHeight + 'px';
    if (focusIt) { reject.focus(); }
  }

  /* ---------- Enlace "Configurar cookies" ---------- */
  function focusSettings() {
    var a = document.querySelector('[data-cookie-settings]');
    if (a) { a.focus(); }
  }

  function addSettingsLink() {
    var box = document.querySelector('.footer .legal');
    if (!box || box.querySelector('[data-cookie-settings]')) { return; }
    box.appendChild(document.createTextNode(' | '));
    var a = el('a', null, T.settings);
    a.href = '#';
    a.setAttribute('data-cookie-settings', '');
    box.appendChild(a);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (t) { e.preventDefault(); showBanner(true); return; }
    // Medición de clics en correo (solo con consentimiento)
    var m = e.target.closest ? e.target.closest('a[href^="mailto:"]') : null;
    if (m && gaLoaded && !window['ga-disable-' + GA_ID]) { window.gtag('event', 'contact_email_click'); }
  });

  /* ---------- Arranque ---------- */
  function init() {
    addSettingsLink();
    var c = readChoice();
    if (!c) { showBanner(false); }
    else if (c.a) { loadGA(); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
