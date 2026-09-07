export const HOME_SECTION_IDS = ['categories', 'new', 'multiplayer'] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export function parseHomeSection(href: string): string | null {
  if (href === '/') return '';
  if (href.startsWith('/#') || href.startsWith('#')) {
    return href.replace(/^\/?#/, '');
  }
  return null;
}

export function getHomeHash(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hash.replace('#', '');
}

function headerOffset(): number {
  const header = document.querySelector('header');
  if (header instanceof HTMLElement) {
    return header.getBoundingClientRect().height + 12;
  }
  return 76;
}

export function setHomeHash(section: string, mode: 'push' | 'replace' = 'push') {
  if (typeof window === 'undefined') return;
  const next = section ? `/#${section}` : '/';
  const current = `${window.location.pathname}${window.location.hash}`;
  if (
    current === next ||
    (window.location.pathname === '/' && window.location.hash === (section ? `#${section}` : ''))
  ) {
    return;
  }
  if (mode === 'replace') {
    window.history.replaceState(null, '', next);
  } else {
    window.history.pushState(null, '', next);
  }
  window.dispatchEvent(new Event('hashchange'));
}

export function scrollToHomeSection(section: string): boolean {
  if (typeof window === 'undefined') return false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth';

  if (!section) {
    window.scrollTo({ top: 0, behavior });
    return true;
  }

  const el = document.getElementById(section);
  if (!el) return false;

  const top = Math.max(0, window.scrollY + el.getBoundingClientRect().top - headerOffset());
  window.scrollTo({ top, behavior });
  return true;
}

export function goToHomeSection(section: string, mode: 'push' | 'replace' = 'push') {
  const attempt = (tries: number) => {
    if (scrollToHomeSection(section)) {
      setHomeHash(section, mode);
      return;
    }
    if (tries > 0) {
      window.setTimeout(() => attempt(tries - 1), 80);
    }
  };
  attempt(10);
}
