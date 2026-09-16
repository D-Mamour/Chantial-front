export type Role = 'ENTREPRENEUR' | 'BAILLEUR' | 'ADMINISTRATEUR';

export interface Utilisateur {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  telephone: string;
  role: Role;
  statut: string;
  date_creation: string;
}
export interface AuthResponse {
  access: string;
  refresh: string;
  utilisateur: Utilisateur;
}

export interface Projet {
  id: string;
  entrepreneur: string;
  bailleur: string;
  nom: string;
  description: string;
  localisation: string;
  budget_previsionnel: string;
  date_debut: string;
  date_fin_prevue: string;
  statut: string;
  date_creation: string;
}
export interface Etape {
  id: string;
  projet: string;
  nom: string;
  description: string;
  ordre: number;
  budget_previsionnel: string;
  date_debut_prevue: string;
  date_fin_prevue: string;
}
export interface Avancement {
  id: string;
  etape: string;
  auteur: string;
  pourcentage: string;
  commentaire: string;
  date_declaration: string;
}
export interface Depense {
  id: string;
  etape: string;
  auteur: string;
  libelle: string;
  montant: string;
  date_depense: string;
  fournisseur: string;
  statut: string;
  date_creation: string;
}
