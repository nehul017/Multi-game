import type { JigsawPuzzleDef } from './types';

export const JIGSAW_PUZZLES: JigsawPuzzleDef[] = [
  {
    id: 'night-owl',
    title: 'Night Watch',
    blurb: 'A wide-eyed owl keeping watch over the moonlit woods.',
    category: 'nature',
    src: '/images/jigsaw/night-owl.jpg',
  },
  {
    id: 'poppy-mill',
    title: 'Poppy Mill',
    blurb: 'A windmill turning over a sea of poppies.',
    category: 'landscapes',
    src: '/images/jigsaw/poppy-mill.jpg',
  },
  {
    id: 'cottage-glow',
    title: 'Lantern Cottage',
    blurb: 'Warm windows glowing on a hillside night.',
    category: 'art',
    src: '/images/jigsaw/cottage-glow.jpg',
  },
  {
    id: 'harbor-light',
    title: 'Harbor Light',
    blurb: 'A lighthouse holding the rocky shore at sunset.',
    category: 'travel',
    src: '/images/jigsaw/harbor-light.jpg',
  },
  {
    id: 'bloom-portrait',
    title: 'Bloom Portrait',
    blurb: 'A quiet face framed in summer flowers.',
    category: 'portraits',
    src: '/images/jigsaw/bloom-portrait.jpg',
  },
  {
    id: 'alpine-mirror',
    title: 'Alpine Mirror',
    blurb: 'Snow peaks doubled in a still mountain lake.',
    category: 'landscapes',
    src: '/images/jigsaw/alpine-mirror.jpg',
  },
  {
    id: 'coral-garden',
    title: 'Coral Garden',
    blurb: 'A bright reef under sunlit water.',
    category: 'nature',
    src: '/images/jigsaw/coral-garden.jpg',
  },
  {
    id: 'amber-lane',
    title: 'Amber Lane',
    blurb: 'An autumn path through gold trees.',
    category: 'art',
    src: '/images/jigsaw/amber-lane.jpg',
  },
];

export const puzzleById = (id: string): JigsawPuzzleDef => {
  const found = JIGSAW_PUZZLES.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown jigsaw ${id}`);
  return found;
};
