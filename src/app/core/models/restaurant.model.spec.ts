import { CategoryDto } from './category.model';
import { RestaurantDto, toRestaurant } from './restaurant.model';

const categoryDto: CategoryDto = {
  id: 'cat-1',
  name: 'Mexican',
  slug: 'mexican',
  description: '',
  icon: '🌮',
  is_active: true,
  created_at: '2026-08-07T21:30:32.680664-06:00',
  updated_at: '2026-08-07T21:30:32.680664-06:00',
};

function makeRestaurantDto(overrides: Partial<RestaurantDto> = {}): RestaurantDto {
  return {
    id: 'r-1',
    owner: 'owner1',
    name: 'La Trattoria',
    slug: 'la-trattoria',
    description: '',
    categories: [categoryDto],
    address: '123 Main St',
    city: 'Mexico City',
    state: '',
    country: 'Mexico',
    postal_code: '',
    latitude: null,
    longitude: null,
    phone: '555-1234',
    email: '',
    website: '',
    price_range: '$$',
    cover_image: '',
    average_rating: '2.00',
    total_reviews: 1,
    opening_hours: { mon: { open: '09:00', close: '22:00' } },
    is_active: true,
    created_at: '2026-08-07T21:47:14.886171-06:00',
    updated_at: '2026-08-07T22:30:21.816382-06:00',
    ...overrides,
  };
}

describe('toRestaurant', () => {
  it('camelCases fields and parses the nested category array', () => {
    const restaurant = toRestaurant(makeRestaurantDto());

    expect(restaurant.postalCode).toBe('');
    expect(restaurant.priceRange).toBe('$$');
    expect(restaurant.categories).toHaveLength(1);
    expect(restaurant.categories[0]).toMatchObject({
      id: 'cat-1',
      name: 'Mexican',
      isActive: true,
    });
  });

  it('parses average_rating (a decimal string) into a number', () => {
    const restaurant = toRestaurant(makeRestaurantDto({ average_rating: '4.60' }));
    expect(restaurant.averageRating).toBe(4.6);
  });

  it('preserves null latitude/longitude instead of parsing null as a decimal', () => {
    const restaurant = toRestaurant(makeRestaurantDto({ latitude: null, longitude: null }));
    expect(restaurant.latitude).toBeNull();
    expect(restaurant.longitude).toBeNull();
  });

  it('parses non-null latitude/longitude decimal strings into numbers', () => {
    const restaurant = toRestaurant(
      makeRestaurantDto({ latitude: '19.432608', longitude: '-99.133209' }),
    );
    expect(restaurant.latitude).toBeCloseTo(19.432608);
    expect(restaurant.longitude).toBeCloseTo(-99.133209);
  });

  it('parses timestamps into Date instances', () => {
    const restaurant = toRestaurant(makeRestaurantDto());
    expect(restaurant.createdAt).toBeInstanceOf(Date);
    expect(restaurant.updatedAt).toBeInstanceOf(Date);
  });
});
