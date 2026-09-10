export const COIL_BRAND = {
  name: 'Coil Rush',
  tagline: 'Grow. Outsmart. Survive.',
  slug: 'snake-multiplayer',
  routeSlug: 'coil-rush',
} as const;

export const isCoilRushSlug = (slug: string): boolean =>
  slug === COIL_BRAND.slug || slug === COIL_BRAND.routeSlug;

export const coilHref = (path = ''): string => `/games/${COIL_BRAND.routeSlug}${path}`;
