import { Component } from '@angular/core';
import { CreerProjet } from '../creer-projet/creer-projet';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mes-projets',
  standalone: true,
  imports: [CreerProjet, RouterLink],
  templateUrl: './projet.html',
  styleUrl: './projet.css'
})
export class ProjetComponent {

  activeFilter = 'Tous';
  CreerProjet = false;


  filters = [
    'Tous',
    'En cours',
    'Terminés',
    'En retard'
  ];

  ouvrirModalProjet(): void {
    this.CreerProjet = true;
  }


  fermerModalProjet(): void {
    this.CreerProjet = false;
  }


  projetCree(projet: any): void {

    console.log('Nouveau projet reçu :', projet);

    // Plus tard :
    // appel API Django/FastAPI
    // puis actualisation de la liste des projets

    this.CreerProjet = false;
  }


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