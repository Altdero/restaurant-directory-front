import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Category } from '@core/models/category.model';
import { Restaurant } from '@core/models/restaurant.model';

import { RestaurantCover } from './restaurant-cover';

const CATEGORY: Category = {
  id: 'c-1',
  name: 'Italian',
  slug: 'italian',
  description: '',
  icon: '',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

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

describe('RestaurantCover', () => {
  let fixture: ComponentFixture<RestaurantCover>;

  function createFixture(restaurant: Restaurant, isAuthenticated = false): void {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(RestaurantCover);
    fixture.componentRef.setInput('restaurant', restaurant);
    fixture.componentRef.setInput('isAuthenticated', isAuthenticated);
    fixture.detectChanges();
  }

  it('should create', () => {
    createFixture(BASE);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the cover image when coverImage is set', () => {
    createFixture({ ...BASE, coverImage: 'https://example.com/cover.jpg' });

    expect(fixture.nativeElement.querySelector('img.cover')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.cover.placeholder')).toBeNull();
  });

  it('renders the placeholder when coverImage is empty', () => {
    createFixture(BASE);

    expect(fixture.nativeElement.querySelector('img.cover')).toBeNull();
    expect(fixture.nativeElement.querySelector('.cover.placeholder')).toBeTruthy();
  });

  it('renders category pills when categories are present', () => {
    createFixture({ ...BASE, categories: [CATEGORY] });

    const pills = fixture.nativeElement.querySelectorAll('.category-pills li');
    expect(pills.length).toBe(1);
    expect(pills[0].textContent).toContain(CATEGORY.name);
  });

  it('omits the category-pills list when categories is empty', () => {
    createFixture(BASE);

    expect(fixture.nativeElement.querySelector('.category-pills')).toBeNull();
  });

  it('passes isAuthenticated through to FavoriteButton (anonymous visitor gets a login link)', () => {
    createFixture(BASE, false);

    expect(fixture.nativeElement.querySelector('.heart-overlay a')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.heart-overlay button')).toBeNull();
  });

  it('emits toggleFavorite when the favorite button is toggled', () => {
    createFixture(BASE, true);
    const emitted = vi.fn();
    fixture.componentInstance.toggleFavorite.subscribe(emitted);

    (fixture.nativeElement.querySelector('.heart-overlay button') as HTMLButtonElement).click();

    expect(emitted).toHaveBeenCalled();
  });
});
