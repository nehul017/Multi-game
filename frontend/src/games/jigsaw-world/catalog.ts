import type { JigsawPuzzleDef } from './types';

export const JIGSAW_PUZZLES: JigsawPuzzleDef[] = [
  {
    id: 'night-owl',
    title: 'Night Watch',
    blurb: 'A wide-eyed owl keeping the moonlit wood.',
    category: 'nature',
    src: '/images/jigsaw/night-owl.svg',
  },
  {
    id: 'poppy-mill',
    title: 'Poppy Mill',
    blurb: 'A windmill turning over a sea of poppies.',
    category: 'landscapes',
    src: '/images/jigsaw/poppy-mill.svg',
  },
  {
    id: 'cottage-glow',
    title: 'Lantern Cottage',
    blurb: 'Warm windows in a hillside night.',
    category: 'art',
    src: '/images/jigsaw/cottage-glow.svg',
  },
  {
    id: 'harbor-light',
    title: 'Harbor Light',
    blurb: 'A lighthouse holding the rocky shore.',
    category: 'travel',
    src: '/images/jigsaw/harbor-light.svg',
  },
  {
    id: 'bloom-portrait',
    title: 'Bloom Portrait',
    blurb: 'A quiet face framed in summer flowers.',
    category: 'portraits',
    src: '/images/jigsaw/bloom-portrait.svg',
  },
  {
    id: 'alpine-mirror',
    title: 'Alpine Mirror',
    blurb: 'Snow peaks doubled in a still lake.',
    category: 'landscapes',
    src: '/images/jigsaw/alpine-mirror.svg',
  },
  {
    id: 'coral-garden',
    title: 'Coral Garden',
    blurb: 'A bright reef under clear water.',
    category: 'nature',
    src: '/images/jigsaw/coral-garden.svg',
  },
  {
    id: 'amber-lane',
    title: 'Amber Lane',
    blurb: 'An autumn path through gold trees.',
    category: 'art',
    src: '/images/jigsaw/amber-lane.svg',
  },
];

export const puzzleById = (id: string): JigsawPuzzleDef => {
  const found = JIGSAW_PUZZLES.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown jigsaw ${id}`);
  return found;
};
