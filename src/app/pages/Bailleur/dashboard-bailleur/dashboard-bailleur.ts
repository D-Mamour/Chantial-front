import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-bailleur',
  standalone: true,
  templateUrl: './dashboard-bailleur.html',
})
export class DashboardBailleur {

  stats = [
    {
      title: 'Avancement Global',
      value: '45%',
      icon: 'progress',
      trend: '+5%',
      subtitle: '',
      type: 'progress'
    },
    {
      title: 'Budget Prévu',
      value: '120M',
      suffix: 'FCFA',
      icon: 'budget',
      subtitle: 'Total estimé du projet',
      type: 'budget'
    },
    {
      title: 'Dépenses Réelles',
      value: '54M',
      suffix: 'FCFA',
      icon: 'expense',
      badge: '45% du budget',
      type: 'expense'
    },
    {
      title: 'Solde Restant',
      value: '66M',
      suffix: 'FCFA',
      icon: 'wallet',
      subtitle: 'Fonds disponibles',
      type: 'balance'
    }
  ];

  timeline = [
    {
      number: 1,
      title: 'Fondations',
      status: 'completed'
    },
    {
      number: 2,
      title: 'Gros œuvre',
      status: 'current'
    },
    {
      number: 3,
      title: 'Toiture',
      status: 'pending'
    },
    {
      number: 4,
      title: 'Second œuvre',
      status: 'pending'
    },
    {
      number: 5,
      title: 'Finitions',
      status: 'pending'
    },
    {
      number: 6,
      title: 'Réception',
      status: 'pending'
    }
  ];

  attentionPoints = [
    {
      type: 'document',
      badge: 'Vérifier',
      badgeClass: 'yellow',
      title: 'Justificatif à vérifier',
      description: 'Facture ciment - Lot Gros œuvre'
    },
    {
      type: 'alert',
      badge: 'Alerte Budget',
      badgeClass: 'red',
      title: 'Écart constaté',
      description: 'Dépassement budget poste ferraillage +12%'
    },
    {
      type: 'planning',
      badge: 'Planning',
      badgeClass: 'yellow',
      title: 'Risque de retard',
      description: 'Retard livraison matériaux toiture - 5 jours'
    }
  ];

  voirDetails(point: any): void {
    console.log('Détail :', point);
  }
}