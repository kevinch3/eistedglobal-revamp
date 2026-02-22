import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Persona, Categoria, Anio, Competencia, Inscripto, Obra } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---------- Personas ----------
  getPersonas(params?: { tipo?: string; q?: string }): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.base}/personas`, { params: params as Record<string, string> });
  }
  getPersona(id: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.base}/personas/${id}`);
  }
  createPersona(p: Persona): Observable<Persona> {
    return this.http.post<Persona>(`${this.base}/personas`, p);
  }
  updatePersona(id: number, p: Persona): Observable<Persona> {
    return this.http.put<Persona>(`${this.base}/personas/${id}`, p);
  }
  deletePersona(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/personas/${id}`);
  }

  // ---------- Categorias ----------
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.base}/categorias`);
  }
  createCategoria(c: Omit<Categoria, 'id_cat'>): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.base}/categorias`, c);
  }
  updateCategoria(id: number, c: Omit<Categoria, 'id_cat'>): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.base}/categorias/${id}`, c);
  }
  deleteCategoria(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/categorias/${id}`);
  }

  // ---------- Anios ----------
  getAnios(): Observable<Anio[]> {
    return this.http.get<Anio[]>(`${this.base}/anios`);
  }
  getAnio(id: number): Observable<Anio> {
    return this.http.get<Anio>(`${this.base}/anios/${id}`);
  }
  createAnio(id_anio: number): Observable<Anio> {
    return this.http.post<Anio>(`${this.base}/anios`, { id_anio });
  }
  updateAnio(id: number, data: Partial<Anio>): Observable<Anio> {
    return this.http.put<Anio>(`${this.base}/anios/${id}`, data);
  }

  // ---------- Competencias ----------
  getCompetencias(params?: { anio?: string; grupind?: string }): Observable<Competencia[]> {
    return this.http.get<Competencia[]>(`${this.base}/competencias`, { params: params as Record<string, string> });
  }
  getCompetencia(id: string): Observable<Competencia> {
    return this.http.get<Competencia>(`${this.base}/competencias/${id}`);
  }
  createCompetencia(c: Competencia): Observable<Competencia> {
    return this.http.post<Competencia>(`${this.base}/competencias`, c);
  }
  updateCompetencia(id: string, c: Partial<Competencia>): Observable<Competencia> {
    return this.http.put<Competencia>(`${this.base}/competencias/${id}`, c);
  }
  deleteCompetencia(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/competencias/${id}`);
  }

  // ---------- Inscriptos ----------
  getInscriptos(params?: { anio?: string; comp?: string; persona?: string }): Observable<Inscripto[]> {
    return this.http.get<Inscripto[]>(`${this.base}/inscriptos`, { params: params as Record<string, string> });
  }
  createInscripto(i: Inscripto): Observable<Inscripto> {
    return this.http.post<Inscripto>(`${this.base}/inscriptos`, i);
  }
  updateInscripto(id: number, data: Partial<Inscripto>): Observable<Inscripto> {
    return this.http.put<Inscripto>(`${this.base}/inscriptos/${id}`, data);
  }
  darBajaInscripto(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/inscriptos/${id}/baja`, {});
  }

  // ---------- Obras ----------
  getObras(params?: { comp?: string; persona?: string }): Observable<Obra[]> {
    return this.http.get<Obra[]>(`${this.base}/obras`, { params: params as Record<string, string> });
  }
  createObra(o: Obra): Observable<Obra> {
    return this.http.post<Obra>(`${this.base}/obras`, o);
  }
  updateObra(id: number, o: Partial<Obra>): Observable<Obra> {
    return this.http.put<Obra>(`${this.base}/obras/${id}`, o);
  }
  deleteObra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/obras/${id}`);
  }
}
