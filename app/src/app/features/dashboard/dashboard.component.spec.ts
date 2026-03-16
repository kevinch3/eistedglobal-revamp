import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DashboardComponent } from './dashboard.component';
import { environment } from '../../../environments/environment';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let httpTesting: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: { instant: (k: string) => k, use: vi.fn(), get: vi.fn(), onTranslationChange: { subscribe: vi.fn() }, onLangChange: { subscribe: vi.fn() }, onDefaultLangChange: { subscribe: vi.fn() } } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have quickLinks populated', () => {
    expect(component.quickLinks.length).toBe(4);
  });

  it('should fetch stats on init', () => {
    component.ngOnInit();

    httpTesting.expectOne(`${base}/participants`).flush([{ id: 1 }, { id: 2 }]);
    httpTesting.expectOne(`${base}/competitions`).flush([{ id: 'C1' }]);
    httpTesting.expectOne(`${base}/registrations`).flush([]);
    httpTesting.expectOne(`${base}/works`).flush([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const stats = component.stats();
    expect(stats.length).toBe(4);
    expect(stats.find((s) => s.key === 'dashboard.participants')?.value).toBe(2);
    expect(stats.find((s) => s.key === 'dashboard.competitions')?.value).toBe(1);
    expect(stats.find((s) => s.key === 'dashboard.registrations')?.value).toBe(0);
    expect(stats.find((s) => s.key === 'dashboard.works')?.value).toBe(3);
  });
});
