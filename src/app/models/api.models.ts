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
export interface Justificatif {
  id: string;
  depense: string;
  fichier: string;
  type_document: string;
  date_ajout: string;
}

export interface DocumentProjet {
  id: string;
  projet: string;
  ajoute_par: string;
  nom: string;
  type_document: string;
  fichier: string;
  texte_extrait: string;
  est_indexe: boolean;
  date_ajout: string;
}
export interface ExtractionOCR {
  id: string;
  justificatif: string;
  numero_document: string;
  fournisseur: string;
  date_document: string | null;
  montant_extrait: string | null;
  texte_extrait: string;
  date_extraction: string;
}
export interface Analyse {
  id: string;
  projet: string;
  niveau_risque: string;
  score_risque: string | null;
  resume: string;
  date_analyse: string;
}
export interface Anomalie {
  id: string;
  projet: string;
  depense: string | null;
  type_anomalie: string;
  description: string;
  niveau: string;
  statut: string;
  date_detection: string;
}
export interface Recommandation {
  id: string;
  projet: string;
  analyse: string | null;
  titre: string;
  description: string;
  priorite: string;
  date_creation: string;
}
export interface Demande {
  id: string;
  projet: string;
  depense: string | null;
  auteur: string;
  destinataire: string;
  type_demande: string;
  message: string;
  reponse: string;
  statut: string;
  date_creation: string;
}
export interface Alerte {
  id: string;
  utilisateur: string;
  projet: string | null;
  type_alerte: string;
  message: string;
  niveau: string;
  est_lue: boolean;
  date_creation: string;
}
export interface Historique {
  id: string;
  utilisateur: string | null;
  projet_id: string | null;
  action: string;
  description: string;
  donnees: any;
  date_action: string;
}
export interface IndicateursFinanciers {
  budget_initial: string;
  avenants_approuves: string;
  budget_reference: string;
  depenses_validees: string;
  avancement_physique: string;
  consommation_budgetaire: string;
  ecart_points: string;
  EV: string;
  AC: string;
  CPI: string | null;
  alerte_critique: string | boolean;
}
export interface Avenant {
  id: string;
  projet: string;
  auteur: string;
  titre: string;
  motif: string;
  montant: string;
  impact_delai_jours: number;
  document?: string;
  statut: string;
  commentaire_decision: string;
  date_creation: string;
  date_decision: string | null;
}
export interface PreuveTerrain {
  id: string;
  projet: string;
  etape: string | null;
  auteur: string;
  fichier: string;
  commentaire: string;
  latitude: string | null;
  longitude: string | null;
  hash_fichier: string;
  analyse_visuelle: any;
  date_capture: string | null;
  date_ajout: string;
}
export interface SituationTravaux {
  id: string;
  projet: string;
  etape: string;
  auteur: string;
  pourcentage: string;
  montant_situation: string;
  commentaire: string;
  statut: string;
  decide_par: string | null;
  commentaire_decision: string;
  date_soumission: string;
  date_decision: string | null;
}
