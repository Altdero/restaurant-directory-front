import { Component, input } from '@angular/core';
import { OpeningHours, WeekDay } from '@core/models/restaurant.model';

const WEEKDAYS: readonly WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function dayLabel(day: WeekDay): string {
  switch (day) {
    case 'mon':
      return $localize`:@@openingHours.monday:Monday`;
    case 'tue':
      return $localize`:@@openingHours.tuesday:Tuesday`;
    case 'wed':
      return $localize`:@@openingHours.wednesday:Wednesday`;
    case 'thu':
      return $localize`:@@openingHours.thursday:Thursday`;
    case 'fri':
      return $localize`:@@openingHours.friday:Friday`;
    case 'sat':
      return $localize`:@@openingHours.saturday:Saturday`;
    case 'sun':
      return $localize`:@@openingHours.sunday:Sunday`;
  }
}

/** An absent weekday key means closed — never assume a missing entry is a data error. */
@Component({
  selector: 'app-opening-hours-table',
  template: `
    <table class="opening-hours-table">
      <tbody>
        @for (day of weekdays; track day) {
          <tr>
            <th scope="row">{{ dayLabel(day) }}</th>
            @if (openingHours()[day]; as hours) {
              <td>{{ hours.open }} – {{ hours.close }}</td>
            } @else {
              <td i18n="@@openingHours.closed">Closed</td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    .opening-hours-table {
      border-collapse: collapse;
      font: var(--mat-sys-body-medium);
      width: 100%;
    }

    th {
      text-align: left;
      font-weight: 500;
      padding: 0.125rem 1rem 0.125rem 0;
    }

    td {
      color: var(--mat-sys-on-surface-variant);
      padding: 0.125rem 0;
      text-align: end;
    }
  `,
})
export class OpeningHoursTable {
  readonly openingHours = input.required<OpeningHours>();

  protected readonly weekdays = WEEKDAYS;
  protected readonly dayLabel = dayLabel;
}
