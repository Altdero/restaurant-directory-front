import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Restaurant } from '@core/models/restaurant.model';

import { RestaurantHero } from './restaurant-hero';

const BASE: Restaurant = {
  id: 'r-1',
  owner: 'owner1',
  name: 'La Trattoria',
  slug: 'la-trattoria',
  description: '',
  categories: [],
  address: '123 Main St',
  city: 'Mexico City',
  state: '',
  country: 'Mexico',
  postalCode: '',
  latitude: null,
  longitude: null,
  phone: '',
  email: '',
  website: '',
  priceRange: '$$',
  coverImage: '',
  averageRating: 4,
  totalReviews: 2,
  openingHours: {},
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('RestaurantHero', () => {
  function mapsUrl(restaurant: Restaurant): string {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(RestaurantHero);
    fixture.componentRef.setInput('restaurant', restaurant);
    fixture.detectChanges();
    return fixture.componentInstance['mapsUrl']();
  }

  it('links to a coordinate-based Maps search when lat/lng are present', () => {
    const url = mapsUrl({ ...BASE, latitude: 19.4326, longitude: -99.1332 });
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=19.4326,-99.1332');
  });

  it('falls back to the URL-encoded address when coordinates are null', () => {
    const url = mapsUrl(BASE);
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent('123 Main St, Mexico City, Mexico'),
    );
  });
});
