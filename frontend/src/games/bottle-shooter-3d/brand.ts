export const BOTTLE_SHOOTER_BRAND = {
  name: 'Bottle Shooter 3D',
  tagline: 'Test your aim. Break every bottle.',
  description: 'Take aim, break glass, and master every shot.',
  slug: 'bottle-shooter-3d',
  category: 'Shooting',
  difficulty: 'Medium',
} as const;

export const bottleShooterHref = (path = ''): string =>
  `/games/${BOTTLE_SHOOTER_BRAND.slug}${path}`;
