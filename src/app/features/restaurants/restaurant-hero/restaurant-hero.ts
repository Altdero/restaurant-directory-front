import { Component, computed, input } from '@angular/core';
import { Restaurant } from '@core/models/restaurant.model';
import { OpeningHoursTable } from '@shared/components/opening-hours-table/opening-hours-table';

const MAPS_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=';

/**
 * No embedded map (see PLAN.md's "Maps" resolved decision) — a deep link
 * to Google Maps instead. Coordinates are `null` for every restaurant in
 * the live API today, so the address-fallback branch is what actually
 * renders right now; the coordinate branch is groundwork for when the
 * backend starts populating `latitude`/`longitude`.
 */
@Component({
  selector: 'app-restaurant-hero',
  imports: [OpeningHoursTable],
  templateUrl: './restaurant-hero.html',
  styles: `
    .details {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-width: 24rem;
      padding: 1.5rem;
      background-color: var(--mat-sys-surface-container-low);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      box-shadow: var(--app-card-shadow);
    }

    .divider {
      height: 1px;
      background-color: var(--mat-sys-outline-variant);
    }

    .label {
      margin: 0 0 0.5rem;
      font: var(--mat-sys-label-medium);
      font-family: 'Inter Variable', sans-serif;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant);
    }

    address {
      font-style: normal;
    }

    .detail-group a {
      color: var(--mat-sys-primary);
      font-weight: 500;
      text-decoration: none;
    }

    .detail-group p {
      margin: 0;
    }
  `,
})
export class RestaurantHero {
  readonly restaurant = input.required<Restaurant>();

  protected readonly mapsUrl = computed(() => {
    const restaurant = this.restaurant();
    if (restaurant.latitude !== null && restaurant.longitude !== null) {
      return `${MAPS_SEARCH_URL}${restaurant.latitude},${restaurant.longitude}`;
    }
    const fullAddress = [restaurant.address, restaurant.city, restaurant.state, restaurant.country]
      .filter(Boolean)
      .join(', ');
    return `${MAPS_SEARCH_URL}${encodeURIComponent(fullAddress)}`;
  });
}
