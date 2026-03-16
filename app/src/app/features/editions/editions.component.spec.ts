import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { EditionsComponent } from './editions.component';
import { ApiService } from '../../core/services/api.service';
import { environment } from '../../../environments/environment';

describe('EditionsComponent', () => {
  let component: EditionsComponent;
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
    await TestBed.configureTestingModule({
      imports: [EditionsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: translateStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EditionsComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load editions on init', () => {
    component.ngOnInit();
    httpTesting.expectOne(`${base}/editions`).flush([{ year: 2025 }, { year: 2024 }]);
    expect(component.editions().length).toBe(2);
  });

  it('should have showAdd defaulting to false', () => {
    expect(component.showAdd).toBe(false);
  });

  it('should not create edition when form is invalid', () => {
    vi.spyOn(apiService, 'createEdition');
    component.addForm.controls.year.setValue(0);
    component.createEdition();
    expect(apiService.createEdition).not.toHaveBeenCalled();
  });

  it('should call createEdition when form is valid', () => {
    vi.spyOn(apiService, 'createEdition').mockReturnValue(of({ year: 2027 }));
    vi.spyOn(component, 'load').mockImplementation(() => {});
    component.addForm.setValue({ year: 2027 });
    component.createEdition();
    expect(apiService.createEdition).toHaveBeenCalledWith(2027);
  });

  it('should call updateEdition on saveEdition', () => {
    vi.spyOn(apiService, 'updateEdition').mockReturnValue(of({ year: 2025 }));
    component.saveEdition({ year: 2025, committee: 'ABC' });
    expect(apiService.updateEdition).toHaveBeenCalledWith(2025, {
      committee: 'ABC',
      committee_img: undefined,
      presenters: undefined,
      presenters_img: undefined,
    });
  });
});
