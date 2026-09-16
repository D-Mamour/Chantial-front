import { Component } from '@angular/core';

@Component({
  selector: 'app-mes-projets',
  standalone: true,
  imports: [],
  templateUrl: './orc-controle.html',
  styleUrl: './orc-controle.css'
})
export class OrcControle {

  activeFilter = 'Tous';

  filters = [
    'Tous',
    'En cours',
    'Terminés',
    'En retard'
  ];

  projects = [
    {
      title: 'Villa Almadies',
      location: 'Almadies, Dakar',
      bailleur: 'M. Abdoulaye Diallo',
      status: 'En cours',
      progress: 68,
      budget: '85 000 000 FCFA',
      expenses: '54 200 000 FCFA',
      remaining: '30 800 000 FCFA',
      stage: 'Gros œuvre – Élévation murs',
      endDate: '15 Mars 2027',
      late: false
    },

    {
      title: 'Immeuble R+3 Parcelles',
      location: 'Parcelles Assainies, Dakar',
      bailleur: 'SCI Les Parcelles',
      status: 'En retard',
      progress: 42,
      budget: '120 000 000 FCFA',
      expenses: '58 300 000 FCFA',
      remaining: '61 700 000 FCFA',
      stage: 'Fondations – Semelles filantes',
      endDate: '30 Juin 2027',
      late: true
    },

    {
      title: 'Maison familiale Rufisque',
      location: 'Rufisque, Dakar',
      bailleur: 'Mme Fatou Sow',
      status: 'En cours',
      progress: 15,
      budget: '40 000 000 FCFA',
      expenses: '15 000 000 FCFA',
      remaining: '25 000 000 FCFA',
      stage: 'Terrassement',
      endDate: '20 Décembre 2027',
      late: false
    }
  ];

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }
}