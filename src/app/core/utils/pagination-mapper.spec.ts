import { mapCountedPage, mapCursorPage } from './pagination-mapper';

interface RawItem {
  readonly value: number;
}

const double = (dto: RawItem): number => dto.value * 2;

describe('mapCountedPage', () => {
  it('maps every result and preserves the envelope fields', () => {
    const raw = {
      count: 2,
      next: 'next-url',
      previous: null,
      results: [{ value: 1 }, { value: 2 }],
    };

    expect(mapCountedPage(double)(raw)).toEqual({
      count: 2,
      next: 'next-url',
      previous: null,
      results: [2, 4],
    });
  });
});

describe('mapCursorPage', () => {
  it('maps every result and preserves next/previous with no count field', () => {
    const raw = { next: null, previous: 'prev-url', results: [{ value: 3 }] };

    expect(mapCursorPage(double)(raw)).toEqual({
      next: null,
      previous: 'prev-url',
      results: [6],
    });
  });
});
