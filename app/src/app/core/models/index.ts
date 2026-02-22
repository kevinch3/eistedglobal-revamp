export interface LoginResponse {
  token: string;
  nombre: string;
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

export interface Categoria {
  id_cat: number;
  nombre: string;
  nomcym?: string;
}

export interface Anio {
  id_anio: number;
  comision?: string;
  comision_img?: string;
  presentadores?: string;
  presentadores_img?: string;
}

export interface Competencia {
  id_comp: string;
  categoria: number;
  cat_nombre?: string;
  cat_nomcym?: string;
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
  nombre?: string;
  apellido?: string;
  tipo?: string;
  fk_comp: string;
  comp_descripcion?: string;
  seudonimo?: string;
  fecha_inscrip?: string;
  anio_insc: number;
  baja?: number;
}

export interface Obra {
  id_obra?: number;
  fk_particip: number;
  nombre?: string;
  apellido?: string;
  mod_particip?: string;
  puesto?: '1' | '2' | '3' | 'mencion';
  competencia: string;
  nom_obra: string;
  fecha?: string;
  video_urls?: string;
  photo_urls?: string;
}
