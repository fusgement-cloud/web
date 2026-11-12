(() => {
  const targets = document.querySelectorAll(
    'main section, main figure, .reveal-on-scroll'
  );
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  targets.forEach(target => target.classList.add('reveal-on-scroll', 'reveal-fade-up'));

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(target => target.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    const intersectingEntries = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => {
        const position = a.target.compareDocumentPosition(b.target);
        return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

    intersectingEntries.forEach((entry, index) => {
      window.setTimeout(() => {
        entry.target.classList.add('is-revealed');
      }, index * 250);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.15 });

  targets.forEach(target => observer.observe(target));
  document.documentElement.classList.add('reveal-ready');
})();
