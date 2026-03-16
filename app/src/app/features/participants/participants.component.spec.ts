import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { ParticipantsComponent } from './participants.component';
import { ApiService } from '../../core/services/api.service';

describe('ParticipantsComponent', () => {
  let component: ParticipantsComponent;
  let httpTesting: HttpTestingController;
  let apiService: ApiService;

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
      imports: [ParticipantsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: translateStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ParticipantsComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(ApiService);
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load participants on init', () => {
    component.ngOnInit();
    const req = httpTesting.expectOne((r) => r.url.includes('/participants'));
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'A', type: 'IND' }]);
    expect(component.dataSource.data.length).toBe(1);
  });

  it('should apply text filter', () => {
    component.dataSource.data = [
      { id: 1, name: 'Alice', type: 'IND' as const },
      { id: 2, name: 'Bob', type: 'IND' as const },
    ];
    const event = { target: { value: 'alice' } } as unknown as Event;
    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('alice');
  });

  it('should pass type filter to API', () => {
    component.typeFilter = 'GRU';
    component.loadParticipants();
    const req = httpTesting.expectOne((r) => r.url.includes('/participants') && r.params.get('type') === 'GRU');
    req.flush([]);
  });

  it('should call deleteParticipant when confirmed', () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);
    vi.spyOn(apiService, 'deleteParticipant').mockReturnValue(of(undefined as any));
    vi.spyOn(component, 'loadParticipants').mockImplementation(() => {});

    component.delete({ id: 1, name: 'Test', type: 'IND' });
    expect(apiService.deleteParticipant).toHaveBeenCalledWith(1);
  });

  it('should not call deleteParticipant when cancelled', () => {
    (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);
    vi.spyOn(apiService, 'deleteParticipant');

    component.delete({ id: 1, name: 'Test', type: 'IND' });
    expect(apiService.deleteParticipant).not.toHaveBeenCalled();
  });
});
