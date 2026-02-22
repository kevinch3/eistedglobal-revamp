import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Participant, Category, Edition, Competition, Registration, Work } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---------- Participants ----------
  getParticipants(params?: { type?: string; q?: string }): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.base}/participants`, { params: params as Record<string, string> });
  }
  getParticipant(id: number): Observable<Participant> {
    return this.http.get<Participant>(`${this.base}/participants/${id}`);
  }
  createParticipant(p: Participant): Observable<Participant> {
    return this.http.post<Participant>(`${this.base}/participants`, p);
  }
  updateParticipant(id: number, p: Participant): Observable<Participant> {
    return this.http.put<Participant>(`${this.base}/participants/${id}`, p);
  }
  deleteParticipant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/participants/${id}`);
  }

  // ---------- Categories ----------
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }
  createCategory(c: Omit<Category, 'id'>): Observable<Category> {
    return this.http.post<Category>(`${this.base}/categories`, c);
  }
  updateCategory(id: number, c: Omit<Category, 'id'>): Observable<Category> {
    return this.http.put<Category>(`${this.base}/categories/${id}`, c);
  }
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }

  // ---------- Editions ----------
  getEditions(): Observable<Edition[]> {
    return this.http.get<Edition[]>(`${this.base}/editions`);
  }
  getEdition(year: number): Observable<Edition> {
    return this.http.get<Edition>(`${this.base}/editions/${year}`);
  }
  createEdition(year: number): Observable<Edition> {
    return this.http.post<Edition>(`${this.base}/editions`, { year });
  }
  updateEdition(year: number, data: Partial<Edition>): Observable<Edition> {
    return this.http.put<Edition>(`${this.base}/editions/${year}`, data);
  }

  // ---------- Competitions ----------
  getCompetitions(params?: { year?: string; type?: string }): Observable<Competition[]> {
    return this.http.get<Competition[]>(`${this.base}/competitions`, { params: params as Record<string, string> });
  }
  getCompetition(id: string): Observable<Competition> {
    return this.http.get<Competition>(`${this.base}/competitions/${id}`);
  }
  createCompetition(c: Competition): Observable<Competition> {
    return this.http.post<Competition>(`${this.base}/competitions`, c);
  }
  updateCompetition(id: string, c: Partial<Competition>): Observable<Competition> {
    return this.http.put<Competition>(`${this.base}/competitions/${id}`, c);
  }
  deleteCompetition(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/competitions/${id}`);
  }

  // ---------- Registrations ----------
  getRegistrations(params?: { year?: string; comp?: string; participant?: string }): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.base}/registrations`, { params: params as Record<string, string> });
  }
  createRegistration(r: Registration): Observable<Registration> {
    return this.http.post<Registration>(`${this.base}/registrations`, r);
  }
  updateRegistration(id: number, data: Partial<Registration>): Observable<Registration> {
    return this.http.put<Registration>(`${this.base}/registrations/${id}`, data);
  }
  dropRegistration(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/registrations/${id}/drop`, {});
  }

  // ---------- Works ----------
  getWorks(params?: { comp?: string; participant?: string }): Observable<Work[]> {
    return this.http.get<Work[]>(`${this.base}/works`, { params: params as Record<string, string> });
  }
  createWork(w: Work): Observable<Work> {
    return this.http.post<Work>(`${this.base}/works`, w);
  }
  updateWork(id: number, w: Partial<Work>): Observable<Work> {
    return this.http.put<Work>(`${this.base}/works/${id}`, w);
  }
  deleteWork(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/works/${id}`);
  }
}
