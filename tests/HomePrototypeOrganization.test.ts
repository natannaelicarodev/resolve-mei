import {
  createInitialOrganization,
  favoriteModule,
  hideModule,
  moveModule,
  restoreModule,
} from '@/features/home/prototype/organization';

const ids = ['panorama', 'activity', 'pulse'];

describe('Home prototype organization', () => {
  it('moves modules without losing or duplicating identities', () => {
    const initial = createInitialOrganization(ids);
    const moved = moveModule(initial, 'pulse', 0);

    expect(moved.order).toEqual(['pulse', 'panorama', 'activity']);
    expect(new Set(moved.order).size).toBe(ids.length);
  });

  it('favorites, hides, and restores a module deterministically', () => {
    const initial = createInitialOrganization(ids);
    const favorite = favoriteModule(initial, 'activity');
    const hidden = hideModule(favorite, 'activity');
    const restored = restoreModule(hidden, 'activity');

    expect(favorite.favorites).toEqual(['activity']);
    expect(hidden.order).toEqual(['panorama', 'pulse']);
    expect(hidden.hidden).toEqual(['activity']);
    expect(restored.order).toEqual(ids);
    expect(restored.hidden).toEqual([]);
    expect(restored.favorites).toEqual(['activity']);
  });

  it('ignores unknown modules and clamps destination indexes', () => {
    const initial = createInitialOrganization(ids);

    expect(moveModule(initial, 'missing', 1)).toEqual(initial);
    expect(moveModule(initial, 'panorama', 99).order).toEqual([
      'activity',
      'pulse',
      'panorama',
    ]);
  });
});
