import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppLogo } from './app-logo';

describe('AppLogo', () => {
  let component: AppLogo;
  let fixture: ComponentFixture<AppLogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLogo],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppLogo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
