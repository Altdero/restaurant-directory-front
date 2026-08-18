import { TestBed } from '@angular/core/testing';
import { OpeningHours } from '@core/models/restaurant.model';

import { OpeningHoursTable } from './opening-hours-table';

describe('OpeningHoursTable', () => {
  function rows(openingHours: OpeningHours): string[] {
    const fixture = TestBed.createComponent(OpeningHoursTable);
    fixture.componentRef.setInput('openingHours', openingHours);
    fixture.detectChanges();
    return Array.from(fixture.nativeElement.querySelectorAll('tr')).map((row) =>
      Array.from((row as HTMLElement).querySelectorAll('th, td'))
        .map((cell) => cell.textContent?.trim())
        .join(' '),
    );
  }

  it('shows the hours for a day present in the schedule', () => {
    const result = rows({ mon: { open: '09:00', close: '22:00' } });
    expect(result[0]).toBe('Monday 09:00–22:00');
  });

  it('shows Closed for a day absent from the schedule, not an error', () => {
    const result = rows({ mon: { open: '09:00', close: '22:00' } });
    expect(result[1]).toBe('Tuesday Closed');
  });

  it('renders all seven days regardless of how few are scheduled', () => {
    const result = rows({});
    expect(result).toHaveLength(7);
    expect(result.every((row) => row.endsWith('Closed'))).toBe(true);
  });
});
