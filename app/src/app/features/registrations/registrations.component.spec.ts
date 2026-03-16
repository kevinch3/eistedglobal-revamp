import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { RegistrationsComponent } from './registrations.component';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

describe('RegistrationsComponent', () => {
  let component: RegistrationsComponent;
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
      imports: [RegistrationsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: translateStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegistrationsComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load editions and registrations on init', () => {
    component.ngOnInit();
    httpTesting.expectOne(`${base}/editions`).flush([{ year: 2025 }]);
    httpTesting.expectOne(`${base}/registrations`).flush([{ id: 1 }]);
    expect(component.editions().length).toBe(1);
    expect(component.dataSource.data.length).toBe(1);
  });

  it('should apply text filter', () => {
    const event = { target: { value: 'test' } } as unknown as Event;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('test');
  });

  it('should load registrations with year filter', () => {
    component.yearFilter = '2025';
    component.load();
    const req = httpTesting.expectOne((r) => r.url === `${base}/registrations` && r.params.get('year') === '2025');
    req.flush([]);
  });

  it('should not call dropRegistration when cancelled', () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);
    vi.spyOn(apiService, 'dropRegistration');
    component.drop({ id: 1, participant_id: 1, competition_id: 'C1', year: 2025 });
    expect(apiService.dropRegistration).not.toHaveBeenCalled();
  });

  it('should call dropRegistration when confirmed', () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
    vi.spyOn(apiService, 'dropRegistration').mockReturnValue(of({ message: 'ok' }));
    vi.spyOn(component, 'load').mockImplementation(() => {});
    component.drop({ id: 1, participant_id: 1, competition_id: 'C1', year: 2025 });
    expect(apiService.dropRegistration).toHaveBeenCalledWith(1);
  });
});
