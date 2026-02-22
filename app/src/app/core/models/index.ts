export interface LoginResponse {
  token: string;
  name: string;
  username: string;
}

export interface Participant {
  id?: number;
  name: string;
  surname?: string;
  document_id?: string;
  birth_date?: string;
  nationality?: string;
  residence?: string;
  email?: string;
  phone?: string;
  type: 'IND' | 'GRU';
  active?: number;
}

export interface Category {
  id: number;
  name: string;
  name_welsh?: string;
}

export interface Edition {
  year: number;
  committee?: string;
  committee_img?: string;
  presenters?: string;
  presenters_img?: string;
}

export interface Competition {
  id: string;
  category_id: number;
  category_name?: string;
  category_name_welsh?: string;
  description?: string;
  language?: string;
  year: number;
  type: 'GRU' | 'IND';
  extra_text?: string;
  rank?: number;
  preliminary?: string;
}

export interface Registration {
  id?: number;
  participant_id: number;
  name?: string;
  surname?: string;
  type?: string;
  competition_id: string;
  comp_description?: string;
  pseudonym?: string;
  registered_at?: string;
  year: number;
  dropped?: number;
}

export interface Work {
  id?: number;
  participant_id: number;
  name?: string;
  surname?: string;
  display_name?: string;
  placement?: '1' | '2' | '3' | 'mencion';
  competition_id: string;
  title: string;
  date?: string;
  video_url?: string;
  photo_url?: string;
}
