export interface JwtPayload {
  userId: number;
  username: string;
}

export interface Persona {
  id_persona?: number;
  nombre: string;
  apellido?: string;
  dni?: string;
  fecha_nac?: string;
  nacionalidad?: string;
  residencia?: string;
  email?: string;
  telefono?: string;
  tipo: 'IND' | 'GRU';
  activo?: number;
}

export interface Competencia {
  id_comp: string;
  categoria: number;
  descripcion?: string;
  idioma?: string;
  fk_anio: number;
  grupind: 'GRU' | 'IND';
  xt_texto?: string;
  rank?: number;
  preliminar?: string;
}

export interface Inscripto {
  id_inscripto?: number;
  fk_persona: number;
  fk_comp: string;
  seudonimo?: string;
  fecha_inscrip?: string;
  anio_insc: number;
  baja?: number;
}

export interface Obra {
  id_obra?: number;
  fk_particip: number;
  mod_particip?: string;
  puesto?: '1' | '2' | '3' | 'mencion';
  competencia: string;
  nom_obra: string;
  fecha?: string;
  video_urls?: string;
  photo_urls?: string;
}
