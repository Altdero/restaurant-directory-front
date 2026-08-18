import { TestBed } from '@angular/core/testing';

import { PaginatorBar } from './paginator-bar';

describe('PaginatorBar', () => {
  function createFixture(page: number, count = 30, pageSize = 12) {
    const fixture = TestBed.createComponent(PaginatorBar);
    fixture.componentRef.setInput('count', count);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.componentRef.setInput('page', page);
    fixture.detectChanges();
    return fixture;
  }

  function buttons(fixture: ReturnType<typeof createFixture>): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  it('disables Previous on the first page', () => {
    const fixture = createFixture(1);
    expect(buttons(fixture)[0].disabled).toBe(true);
    expect(buttons(fixture)[1].disabled).toBe(false);
  });

  it('disables Next on the last page', () => {
    const fixture = createFixture(3);
    expect(buttons(fixture)[0].disabled).toBe(false);
    expect(buttons(fixture)[1].disabled).toBe(true);
  });

  it('emits page - 1 when Previous is clicked', () => {
    const fixture = createFixture(2);
    const emitted = vi.fn();
    fixture.componentInstance.pageChange.subscribe(emitted);

    buttons(fixture)[0].click();

    expect(emitted).toHaveBeenCalledWith(1);
  });

  it('emits page + 1 when Next is clicked', () => {
    const fixture = createFixture(2);
    const emitted = vi.fn();
    fixture.componentInstance.pageChange.subscribe(emitted);

    buttons(fixture)[1].click();

    expect(emitted).toHaveBeenCalledWith(3);
  });

  it('treats a zero count as a single page, not zero pages', () => {
    const fixture = createFixture(1, 0);
    expect(buttons(fixture)[1].disabled).toBe(true);
  });
});
