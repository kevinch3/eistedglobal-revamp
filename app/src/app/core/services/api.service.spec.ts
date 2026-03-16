import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  // ---------- Participants ----------
  it('should GET participants', () => {
    service.getParticipants().subscribe((d) => expect(d).toEqual([]));
    const req = httpTesting.expectOne(`${base}/participants`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET participants with type param', () => {
    service.getParticipants({ type: 'IND' }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === `${base}/participants` && r.params.get('type') === 'IND');
    req.flush([]);
  });

  it('should GET a single participant', () => {
    service.getParticipant(1).subscribe((p) => expect(p.name).toBe('A'));
    const req = httpTesting.expectOne(`${base}/participants/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ name: 'A' });
  });

  it('should POST a participant', () => {
    const payload = { name: 'New', type: 'IND' as const };
    service.createParticipant(payload).subscribe();
    const req = httpTesting.expectOne(`${base}/participants`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, ...payload });
  });

  it('should PUT a participant', () => {
    const payload = { name: 'Updated', type: 'IND' as const };
    service.updateParticipant(1, payload).subscribe();
    const req = httpTesting.expectOne(`${base}/participants/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, ...payload });
  });

  it('should DELETE a participant', () => {
    service.deleteParticipant(1).subscribe();
    const req = httpTesting.expectOne(`${base}/participants/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ---------- Categories ----------
  it('should GET categories', () => {
    service.getCategories().subscribe();
    const req = httpTesting.expectOne(`${base}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should POST a category', () => {
    service.createCategory({ name: 'Cat1' }).subscribe();
    const req = httpTesting.expectOne(`${base}/categories`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, name: 'Cat1' });
  });

  it('should PUT a category', () => {
    service.updateCategory(1, { name: 'Cat2' }).subscribe();
    const req = httpTesting.expectOne(`${base}/categories/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, name: 'Cat2' });
  });

  it('should DELETE a category', () => {
    service.deleteCategory(1).subscribe();
    const req = httpTesting.expectOne(`${base}/categories/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ---------- Editions ----------
  it('should GET editions', () => {
    service.getEditions().subscribe();
    httpTesting.expectOne(`${base}/editions`).flush([]);
  });

  it('should GET a single edition', () => {
    service.getEdition(2025).subscribe();
    httpTesting.expectOne(`${base}/editions/2025`).flush({ year: 2025 });
  });

  it('should POST an edition', () => {
    service.createEdition(2026).subscribe();
    const req = httpTesting.expectOne(`${base}/editions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ year: 2026 });
    req.flush({ year: 2026 });
  });

  it('should PUT an edition', () => {
    service.updateEdition(2025, { committee: 'ABC' }).subscribe();
    const req = httpTesting.expectOne(`${base}/editions/2025`);
    expect(req.request.method).toBe('PUT');
    req.flush({ year: 2025, committee: 'ABC' });
  });

  // ---------- Competitions ----------
  it('should GET competitions', () => {
    service.getCompetitions().subscribe();
    httpTesting.expectOne(`${base}/competitions`).flush([]);
  });

  it('should GET competitions with year param', () => {
    service.getCompetitions({ year: '2025' }).subscribe();
    const req = httpTesting.expectOne((r) => r.url === `${base}/competitions` && r.params.get('year') === '2025');
    req.flush([]);
  });

  it('should GET a single competition', () => {
    service.getCompetition('C1').subscribe();
    httpTesting.expectOne(`${base}/competitions/C1`).flush({ id: 'C1' });
  });

  it('should POST a competition', () => {
    const c = { id: 'C2', category_id: 1, year: 2025, type: 'IND' as const };
    service.createCompetition(c).subscribe();
    const req = httpTesting.expectOne(`${base}/competitions`);
    expect(req.request.method).toBe('POST');
    req.flush(c);
  });

  it('should PUT a competition', () => {
    service.updateCompetition('C1', { description: 'X' }).subscribe();
    const req = httpTesting.expectOne(`${base}/competitions/C1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 'C1', description: 'X' });
  });

  it('should DELETE a competition', () => {
    service.deleteCompetition('C1').subscribe();
    const req = httpTesting.expectOne(`${base}/competitions/C1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // ---------- Registrations ----------
  it('should GET registrations', () => {
    service.getRegistrations().subscribe();
    httpTesting.expectOne(`${base}/registrations`).flush([]);
  });

  it('should POST a registration', () => {
    const r = { participant_id: 1, competition_id: 'C1', year: 2025 };
    service.createRegistration(r as any).subscribe();
    const req = httpTesting.expectOne(`${base}/registrations`);
    expect(req.request.method).toBe('POST');
    req.flush(r);
  });

  it('should PATCH to drop a registration', () => {
    service.dropRegistration(1).subscribe();
    const req = httpTesting.expectOne(`${base}/registrations/1/drop`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ message: 'dropped' });
  });

  // ---------- Works ----------
  it('should GET works', () => {
    service.getWorks().subscribe();
    httpTesting.expectOne(`${base}/works`).flush([]);
  });

  it('should POST a work', () => {
    const w = { participant_id: 1, competition_id: 'C1', title: 'T' };
    service.createWork(w as any).subscribe();
    const req = httpTesting.expectOne(`${base}/works`);
    expect(req.request.method).toBe('POST');
    req.flush(w);
  });

  it('should PUT a work', () => {
    service.updateWork(1, { title: 'Updated' }).subscribe();
    const req = httpTesting.expectOne(`${base}/works/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, title: 'Updated' });
  });

  it('should DELETE a work', () => {
    service.deleteWork(1).subscribe();
    const req = httpTesting.expectOne(`${base}/works/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
