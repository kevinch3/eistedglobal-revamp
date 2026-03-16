import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { WorksComponent } from './works.component';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

describe('WorksComponent', () => {
  let component: WorksComponent;
  let httpTesting: HttpTestingController;
  let apiService: ApiService;
  const base = environment.apiUrl;

  const translateStub = {
    instant: (k: string) => k,
    use: vi.fn(),
    get: vi.fn().mockReturnValue(of('')),
    onTranslationChange: new Subject(),
    onLangChange: new Subject(),
    onDefaultLangChange: new Subject(),
  };

  beforeEach(async () => {
    window.confirm = vi.fn();

    await TestBed.configureTestingModule({
      imports: [WorksComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: translateStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(WorksComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load editions and works on init', () => {
    component.ngOnInit();
    httpTesting.expectOne(`${base}/editions`).flush([{ year: 2025 }]);
    httpTesting.expectOne(`${base}/works`).flush([{ id: 1, title: 'W1' }]);
    expect(component.editions().length).toBe(1);
    expect(component.dataSource.data.length).toBe(1);
  });

  it('should apply text filter', () => {
    const event = { target: { value: 'test' } } as unknown as Event;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('test');
  });

  it('should clear comp filter on year change', () => {
    component.compFilter = 'C1';
    component.yearFilter = 2025;
    component.onYearChange();
    expect(component.compFilter).toBe('');
    httpTesting.expectOne((r) => r.url === `${base}/competitions`).flush([]);
    httpTesting.expectOne(`${base}/works`).flush([]);
  });

  it('should clear competitions when yearFilter is empty', () => {
    component.yearFilter = '';
    component.onYearChange();
    expect(component.competitions()).toEqual([]);
    httpTesting.expectOne(`${base}/works`).flush([]);
  });

  it('should return correct placement labels', () => {
    expect(component.placementLabel('1')).toBe('works.placements.place');
    expect(component.placementLabel('mencion')).toBe('works.placements.mencion');
  });

  it('should return correct placement colors', () => {
    expect(component.placementColor('1')).toBe('warn');
    expect(component.placementColor('2')).toBe('accent');
    expect(component.placementColor('3')).toBe('primary');
  });

  it('should not call deleteWork when cancelled', () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);
    vi.spyOn(apiService, 'deleteWork');
    component.delete({ id: 1, participant_id: 1, competition_id: 'C1', title: 'T' });
    expect(apiService.deleteWork).not.toHaveBeenCalled();
  });

  it('should call deleteWork when confirmed', () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
    vi.spyOn(apiService, 'deleteWork').mockReturnValue(of(undefined as any));
    vi.spyOn(component, 'load').mockImplementation(() => {});
    component.delete({ id: 1, participant_id: 1, competition_id: 'C1', title: 'T' });
    expect(apiService.deleteWork).toHaveBeenCalledWith(1);
  });
});
