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
  function createFixture(restaurant: Restaurant) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(RestaurantHero);
    fixture.componentRef.setInput('restaurant', restaurant);
    fixture.detectChanges();
    return fixture;
  }

  function mapsUrl(restaurant: Restaurant): string {
    return createFixture(restaurant).componentInstance['mapsUrl']();
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

  it('omits the Contact block when phone, email and website are all empty', () => {
    const fixture = createFixture(BASE);

    expect(fixture.nativeElement.textContent).not.toContain('Contact');
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it('renders only the contact fields that are present', () => {
    const fixture = createFixture({ ...BASE, phone: '+52 55 1234 5678' });

    // The "Open in Maps" link also carries target="_blank", so a count of 1
    // (not 0) is what proves the website link — the only other one — is absent.
    expect(fixture.nativeElement.textContent).toContain('Contact');
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('a[target="_blank"]').length).toBe(1);
  });
});
