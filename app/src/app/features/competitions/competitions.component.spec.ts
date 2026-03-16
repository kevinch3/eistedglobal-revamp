import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { CompetitionsComponent } from './competitions.component';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

describe('CompetitionsComponent', () => {
  let component: CompetitionsComponent;
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
      imports: [CompetitionsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: translateStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CompetitionsComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load editions and competitions on init', () => {
    component.ngOnInit();
    httpTesting.expectOne(`${base}/editions`).flush([{ year: 2025 }]);
    httpTesting.expectOne(`${base}/competitions`).flush([{ id: 'C1' }]);
    expect(component.editions().length).toBe(1);
    expect(component.dataSource.data.length).toBe(1);
  });

  it('should apply text filter', () => {
    const event = { target: { value: 'test' } } as unknown as Event;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('test');
  });

  it('should load competitions with year filter', () => {
    component.yearFilter = '2025';
    component.load();
    const req = httpTesting.expectOne((r) => r.url === `${base}/competitions` && r.params.get('year') === '2025');
    req.flush([]);
  });

  it('should not call deleteCompetition when cancelled', () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);
    vi.spyOn(apiService, 'deleteCompetition');
    component.delete({ id: 'C1', category_id: 1, year: 2025, type: 'IND' });
    expect(apiService.deleteCompetition).not.toHaveBeenCalled();
  });

  it('should call deleteCompetition when confirmed', () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
    vi.spyOn(apiService, 'deleteCompetition').mockReturnValue(of(undefined as any));
    vi.spyOn(component, 'load').mockImplementation(() => {});
    component.delete({ id: 'C1', category_id: 1, year: 2025, type: 'IND' });
    expect(apiService.deleteCompetition).toHaveBeenCalledWith('C1');
  });
});
