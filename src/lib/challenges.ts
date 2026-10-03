/**
 * Glassbook
 * Copyright 2026 bitfischer.de
 *
 * @author  bitfischer.de
 * @version 1.0.0
 * @license MIT
 */

export const challengeDimensions = [
  'subject',
  'technique',
  'style',
  'focalLength',
  'lighting',
  'constraint'
] as const;
export type ChallengeDimension = (typeof challengeDimensions)[number];
export type ChallengeEntry = {
  id: string;
  label: string;
  hint: string;
  tags: string[];
  requires?: string[];
  excludes?: string[];
  difficulty: 'easy' | 'medium' | 'bold';
};
export type FocalLengthEntry = ChallengeEntry & { mm: number };
export type MatchingLens = { id: number; name: string; focalMinMm: number; focalMaxMm: number };
export type PhotographyChallenge = {
  seed: string;
  subject: ChallengeEntry;
  technique: ChallengeEntry;
  style: ChallengeEntry;
  focalLength: FocalLengthEntry;
  lighting: ChallengeEntry;
  constraint: ChallengeEntry;
  matchingLenses: MatchingLens[];
  usedOwnedFocalLength: boolean;
};

const hints: Record<string, string> = {
  reflections: 'Use a reflective surface to reveal two layers of the scene.',
  shadows: 'Make the shadow, rather than its source, the main subject.',
  strangers: 'Ask permission and make a brief environmental portrait.',
  'motion-blur': 'Let movement draw a deliberate line through the frame.',
  panning: 'Follow a moving subject so it stays sharp against a streaked background.',
  silhouette: 'Expose for the background and reduce the subject to shape.',
  'negative-space': 'Leave most of the frame quiet so the subject can breathe.',
  'golden-hour': 'Work with low, warm, directional sunlight.',
  'one-frame-only': 'Pause, compose carefully, and take exactly one exposure.'
};
const specialTags: Record<string, string[]> = {
  'night-traffic': ['night', 'motion'],
  stars: ['night', 'outdoor'],
  moon: ['night', 'distant'],
  wildlife: ['outdoor', 'distant', 'motion'],
  sports: ['motion', 'people'],
  strangers: ['people'],
  insects: ['close'],
  textures: ['close', 'abstract'],
  architecture: ['geometry']
};
const easy = new Set(['street-signs', 'coffee', 'shadows', 'windows', 'hands', 'pets']);
const bold = new Set(['strangers', 'night-traffic', 'sports', 'wildlife', 'self-portrait']);
function make(labels: string[], prefix: string): ChallengeEntry[] {
  return labels.map((label) => {
    const bare = label
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return {
      id: `${prefix}-${bare}`,
      label,
      hint: hints[bare] ?? `Find an unexpected way to use ${label.toLowerCase()}.`,
      tags: specialTags[bare] ?? ['general'],
      difficulty: easy.has(bare) ? 'easy' : bold.has(bare) ? 'bold' : 'medium'
    };
  });
}

export const challengeCatalogue = {
  subject: make(
    [
      'Reflections',
      'Shadows',
      'Windows',
      'Doors',
      'Staircases',
      'Bridges',
      'Alleyways',
      'Street signs',
      'Shop fronts',
      'Markets',
      'Cafés',
      'Coffee',
      'Food preparation',
      'Hands',
      'Strangers',
      'Friends',
      'Family rituals',
      'Self portrait',
      'Pets',
      'Birds',
      'Wildlife',
      'Insects',
      'Flowers',
      'Leaves',
      'Trees',
      'Roots',
      'Rocks',
      'Water',
      'Rain',
      'Puddles',
      'Clouds',
      'Fog',
      'Snow',
      'Wind',
      'Sunrise',
      'Sunset',
      'Moon',
      'Stars',
      'Night traffic',
      'Bicycles',
      'Trains',
      'Buses',
      'Boats',
      'Cars',
      'Sports',
      'Playgrounds',
      'Construction',
      'Abandoned places',
      'Old tools',
      'New technology',
      'Books',
      'Musical instruments',
      'Clothing',
      'Shoes',
      'Jewellery',
      'Kitchen objects',
      'Bathroom objects',
      'Desk objects',
      'Toys',
      'Collections',
      'Letters and type',
      'Numbers',
      'Patterns',
      'Textures',
      'Symmetry',
      'Leading lines',
      'Circles',
      'Triangles',
      'Red objects',
      'Blue objects',
      'One bright color',
      'Transparent objects',
      'Metal',
      'Glass',
      'Wood',
      'Fabric',
      'Smoke',
      'Steam',
      'Bubbles',
      'Silhouettes',
      'Crowds',
      'Solitude',
      'Conversation',
      'Work',
      'Rest',
      'Movement',
      'Stillness',
      'Contrasts',
      'Repetition',
      'Imperfection',
      'Decay',
      'Growth',
      'Scale',
      'Tiny details',
      'Architecture',
      'Public art',
      'Local history',
      'A familiar route',
      'Your neighborhood',
      'Something overlooked',
      'A personal keepsake',
      'Morning routine',
      'Evening routine'
    ],
    'subject'
  ),
  technique: make(
    [
      'Motion blur',
      'Panning',
      'Intentional camera movement',
      'Long exposure',
      'Short exposure',
      'Silhouette',
      'Reflection layering',
      'Shoot through glass',
      'Shoot through fabric',
      'Frame within a frame',
      'Leading lines',
      'Negative space',
      'Fill the frame',
      'Dutch angle',
      'Top-down view',
      'Ground-level view',
      'Worm’s-eye view',
      'Bird’s-eye view',
      'Close focus',
      'Hyperfocal focus',
      'Selective focus',
      'Deep focus',
      'Focus on foreground',
      'Focus on background',
      'Backlighting',
      'Side lighting',
      'High-key exposure',
      'Low-key exposure',
      'Underexpose',
      'Overexpose',
      'Expose for highlights',
      'Expose for shadows',
      'Multiple exposure',
      'Foreground bokeh',
      'Background bokeh',
      'Pattern interruption',
      'Color contrast',
      'Tonal contrast',
      'Forced perspective',
      'Environmental portrait',
      'Candid moment',
      'Minimal composition',
      'Layered composition',
      'Centered composition',
      'Rule of thirds'
    ],
    'technique'
  ),
  style: make(
    [
      'Documentary',
      'Cinematic',
      'Minimalist',
      'Abstract',
      'Graphic',
      'Fine art',
      'Editorial',
      'Photojournalistic',
      'Street photography',
      'Environmental portrait',
      'Still life',
      'Black and white',
      'Monochrome',
      'Muted color',
      'Vivid color',
      'Pastel',
      'High contrast',
      'Low contrast',
      'Dreamlike',
      'Mysterious',
      'Playful',
      'Quiet',
      'Melancholic',
      'Joyful',
      'Nostalgic',
      'Futuristic',
      'Raw and imperfect',
      'Clean and precise',
      'Geometric',
      'Organic',
      'Vintage postcard',
      'Film noir',
      'Magazine cover',
      'Visual diary'
    ],
    'style'
  ),
  focalLength: [
    14, 16, 20, 24, 28, 35, 40, 50, 55, 58, 65, 75, 85, 90, 100, 105, 135, 180, 200, 300
  ].map((mm) => ({
    id: `focal-${mm}`,
    label: `${mm} mm`,
    hint:
      mm <= 28
        ? 'Embrace context and foreground depth.'
        : mm >= 100
          ? 'Compress distance and isolate details.'
          : 'Use this natural perspective deliberately.',
    tags: [mm <= 28 ? 'wide' : mm >= 85 ? 'telephoto' : 'normal'],
    difficulty: 'medium' as const,
    mm
  })),
  lighting: make(
    [
      'Golden hour',
      'Blue hour',
      'Midday sun',
      'Open shade',
      'Window light',
      'Doorway light',
      'Backlight',
      'Side light',
      'Front light',
      'Rim light',
      'Dappled light',
      'Overcast light',
      'Foggy light',
      'Rainy reflections',
      'Candlelight',
      'Firelight',
      'Streetlight',
      'Neon light',
      'Shop-window glow',
      'Car headlights',
      'Single lamp',
      'Desk lamp',
      'Phone screen light',
      'Projector light',
      'Flash bounced off a wall',
      'Direct on-camera flash',
      'Off-camera flash',
      'Light painting',
      'Silhouette at dusk',
      'Available light only',
      'Mixed color temperatures',
      'Hard shadows',
      'Soft diffused light',
      'Reflected light'
    ],
    'lighting'
  ),
  constraint: make(
    [
      'One frame only',
      'Five frames only',
      'Stay in one spot',
      'Walk only one block',
      'Shoot from waist height',
      'Shoot from ground level',
      'Keep the horizon out',
      'Include the horizon',
      'No cropping later',
      'Square composition',
      'Vertical frames only',
      'Horizontal frames only',
      'Subject at the edge',
      'Subject dead center',
      'No people',
      'Include one person',
      'Include three layers',
      'Use one dominant color',
      'Avoid saturated colors',
      'Use only shadows',
      'Use only reflections',
      'No straight lines',
      'Only straight lines',
      'Leave half the frame empty',
      'Fill every corner',
      'Photograph through something',
      'Wait for a gesture',
      'Wait for two elements to align',
      'Return after ten minutes',
      'Make three variations',
      'Do not move your feet',
      'Change your height each frame',
      'Manual focus only',
      'Use the widest aperture',
      'Use f/8 or smaller',
      'Use 1/15 second',
      'Use 1/1000 second',
      'Keep ISO at base',
      'Embrace high ISO grain',
      'No looking at the screen',
      'Finish in fifteen minutes',
      'Spend at least thirty minutes',
      'Stay within ten meters',
      'Include a foreground obstruction',
      'Hide the subject partly',
      'Make scale ambiguous',
      'Tell a story in one image',
      'Create a diptych',
      'Repeat one shape',
      'Break one pattern',
      'Make the ordinary look monumental',
      'Make the large look tiny'
    ],
    'constraint'
  )
};
function randomFor(seed: string) {
  let state = 2166136261;
  for (const c of seed) {
    state ^= c.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}
function compatible(entry: ChallengeEntry, chosen: ChallengeEntry[]) {
  const all = new Set(chosen.flatMap((item) => item.tags));
  return (
    !(entry.excludes?.some((tag) => all.has(tag)) ?? false) &&
    (entry.requires?.every((tag) => all.has(tag)) ?? true)
  );
}
export function composeChallenge(
  seed: string,
  lenses: MatchingLens[] = [],
  locked: Partial<Pick<PhotographyChallenge, ChallengeDimension>> = {}
): PhotographyChallenge {
  const random = randomFor(seed);
  const chosen: ChallengeEntry[] = [];
  const result = {} as Pick<PhotographyChallenge, ChallengeDimension>;
  for (const dimension of challengeDimensions) {
    const fixed = locked[dimension];
    if (fixed) {
      result[dimension] = fixed as never;
      chosen.push(fixed);
      continue;
    }
    let pool: ChallengeEntry[] = challengeCatalogue[dimension];
    if (dimension === 'focalLength' && lenses.length) {
      const owned = challengeCatalogue.focalLength.filter(({ mm }) =>
        lenses.some((lens) => lens.focalMinMm <= mm && lens.focalMaxMm >= mm)
      );
      if (owned.length) pool = owned;
    }
    const filtered = pool.filter((entry) => compatible(entry, chosen));
    const choices = filtered.length ? filtered : pool;
    const choice = choices[Math.floor(random() * choices.length)];
    result[dimension] = choice as never;
    chosen.push(choice);
  }
  const matchingLenses = lenses.filter(
    (lens) => lens.focalMinMm <= result.focalLength.mm && lens.focalMaxMm >= result.focalLength.mm
  );
  return { seed, ...result, matchingLenses, usedOwnedFocalLength: matchingLenses.length > 0 };
}
