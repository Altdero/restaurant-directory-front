import { Restaurant, WeekDay } from '@core/models/restaurant.model';

const SCHEMA_DAYS: Record<WeekDay, string> = {
  mon: 'https://schema.org/Monday',
  tue: 'https://schema.org/Tuesday',
  wed: 'https://schema.org/Wednesday',
  thu: 'https://schema.org/Thursday',
  fri: 'https://schema.org/Friday',
  sat: 'https://schema.org/Saturday',
  sun: 'https://schema.org/Sunday',
};

/**
 * Maps a `Restaurant` to a schema.org `Restaurant` JSON-LD object. `geo` is
 * included only when coordinates aren't `null` — the same condition
 * `RestaurantHero.mapsUrl()` branches on for its Maps deep link, just for a
 * different consumer. `aggregateRating` is omitted entirely when there are
 * no reviews yet — a `reviewCount: 0` block is worse than no block at all
 * per Google's structured-data guidelines. `priceRange` needs no mapping:
 * this API's own `$`/`$$`/`$$$`/`$$$$` scale is a valid schema.org value
 * as-is.
 */
export function buildRestaurantJsonLd(restaurant: Restaurant, pageUrl: string): object {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': pageUrl,
    url: pageUrl,
    name: restaurant.name,
    description: restaurant.description,
    priceRange: restaurant.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address,
      addressLocality: restaurant.city,
      addressRegion: restaurant.state,
      postalCode: restaurant.postalCode,
      addressCountry: restaurant.country,
    },
  };

  if (restaurant.coverImage) {
    schema['image'] = restaurant.coverImage;
  }
  if (restaurant.phone) {
    schema['telephone'] = restaurant.phone;
  }
  if (restaurant.email) {
    schema['email'] = restaurant.email;
  }
  if (restaurant.website) {
    schema['sameAs'] = restaurant.website;
  }
  if (restaurant.categories.length > 0) {
    schema['servesCuisine'] = restaurant.categories.map((category) => category.name);
  }
  if (restaurant.latitude !== null && restaurant.longitude !== null) {
    schema['geo'] = {
      '@type': 'GeoCoordinates',
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    };
  }
  if (restaurant.totalReviews > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: restaurant.averageRating,
      reviewCount: restaurant.totalReviews,
    };
  }
  const days = Object.keys(restaurant.openingHours) as WeekDay[];
  if (days.length > 0) {
    schema['openingHoursSpecification'] = days.map((day) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAYS[day],
      opens: restaurant.openingHours[day]!.open,
      closes: restaurant.openingHours[day]!.close,
    }));
  }

  return schema;
}
