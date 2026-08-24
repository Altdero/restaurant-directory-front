import { Restaurant } from '@core/models/restaurant.model';

import { buildRestaurantJsonLd } from './restaurant-json-ld';

const BASE_RESTAURANT: Restaurant = {
  id: 'r-1',
  owner: 'ana',
  name: 'La Trattoria',
  slug: 'la-trattoria',
  description: 'Cozy Italian spot.',
  categories: [],
  address: '123 Main St',
  city: 'Austin',
  state: 'TX',
  country: 'USA',
  postalCode: '78701',
  latitude: null,
  longitude: null,
  phone: '',
  email: '',
  website: '',
  priceRange: '$$',
  coverImage: '',
  averageRating: 0,
  totalReviews: 0,
  openingHours: {},
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const PAGE_URL = 'https://example.com/en/restaurants/r-1';

describe('buildRestaurantJsonLd', () => {
  it('maps the core fields into a schema.org Restaurant', () => {
    const json = buildRestaurantJsonLd(BASE_RESTAURANT, PAGE_URL) as Record<string, unknown>;

    expect(json).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      '@id': PAGE_URL,
      url: PAGE_URL,
      name: 'La Trattoria',
      description: 'Cozy Italian spot.',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'Austin',
        addressRegion: 'TX',
        postalCode: '78701',
        addressCountry: 'USA',
      },
    });
  });

  it('omits geo, aggregateRating and openingHoursSpecification when there is nothing to report', () => {
    const json = buildRestaurantJsonLd(BASE_RESTAURANT, PAGE_URL) as Record<string, unknown>;

    expect(json['geo']).toBeUndefined();
    expect(json['aggregateRating']).toBeUndefined();
    expect(json['openingHoursSpecification']).toBeUndefined();
    expect(json['image']).toBeUndefined();
    expect(json['telephone']).toBeUndefined();
  });

  it('includes geo only when both coordinates are present', () => {
    const json = buildRestaurantJsonLd(
      { ...BASE_RESTAURANT, latitude: 30.27, longitude: -97.74 },
      PAGE_URL,
    ) as Record<string, unknown>;

    expect(json['geo']).toEqual({
      '@type': 'GeoCoordinates',
      latitude: 30.27,
      longitude: -97.74,
    });
  });

  it('includes aggregateRating only when there is at least one review', () => {
    const json = buildRestaurantJsonLd(
      { ...BASE_RESTAURANT, averageRating: 4.5, totalReviews: 12 },
      PAGE_URL,
    ) as Record<string, unknown>;

    expect(json['aggregateRating']).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 12,
    });
  });

  it('maps openingHours to openingHoursSpecification only for the days present', () => {
    const json = buildRestaurantJsonLd(
      {
        ...BASE_RESTAURANT,
        openingHours: {
          mon: { open: '09:00', close: '22:00' },
          fri: { open: '09:00', close: '23:00' },
        },
      },
      PAGE_URL,
    ) as Record<string, unknown>;

    expect(json['openingHoursSpecification']).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Monday',
        opens: '09:00',
        closes: '22:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Friday',
        opens: '09:00',
        closes: '23:00',
      },
    ]);
  });

  it('maps categories to servesCuisine', () => {
    const json = buildRestaurantJsonLd(
      {
        ...BASE_RESTAURANT,
        categories: [
          {
            id: 'c-1',
            name: 'Italian',
            slug: 'italian',
            description: '',
            icon: '',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      PAGE_URL,
    ) as Record<string, unknown>;

    expect(json['servesCuisine']).toEqual(['Italian']);
  });
});
