import { Component } from '@angular/core';

@Component({
  selector: 'app-ma-construction',
  standalone: true,
  templateUrl: './ma-construction.html',
})
export class MaConstructionComponent {

  activeTab = 'Vue d’ensemble';

  tabs = [
    'Vue d’ensemble',
    'Avancement',
    'Dépenses',
    'Justificatifs',
    'Analyse',
    'Historique'
  ];

  activities = [
    {
      icon: 'document',
      time: 'Il y a 2 heures',
      author: 'Entreprise Bâtipro SARL',
      text: "Justificatif de lot 'Ferraillage' soumis"
    },
    {
      icon: 'clipboard',
      time: 'Hier, 17:00',
      author: 'Contrôleur Technique',
      text: 'Rapport d’avancement Gros œuvre mis à jour (62%)'
    },
    {
      icon: 'check',
      time: '18 Mai 2025',
      author: 'Mike Andrew (Bailleur)',
      text: 'Paiement validé - 3 100 000 FCFA'
    }
  ];

  expenses = [
    {
      date: '22 Mai 2025',
      designation: 'Facture Ciment CPJ45 - 50 tonnes',
      amount: '4 250 000 F',
      status: 'En attente'
    },
    {
      date: '15 Mai 2025',
      designation: 'Acompte Fer à béton HA 12 & 14',
      amount: '3 100 000 F',
      status: 'Vérifié'
    },
    {
      date: '10 Mai 2025',
      designation: 'Prestation terrassement & nivellement',
      amount: '1 800 000 F',
      status: 'Vérifié'
    },
    {
      date: '02 Mai 2025',
      designation: 'Facture Granulats & Sable - Lot Gros Œuvre',
      amount: '2 200 000 F',
      status: 'Rejeté'
    }
  ];

  attentionPoints = [
    {
      type: 'warning',
      label: 'Vérifier',
      title: 'Justificatif à vérifier',
      description: 'Facture ciment - Lot Gros œuvre'
    },
    {
      type: 'danger',
      label: 'Alerte Budget',
      title: 'Écart constaté',
      description: 'Dépassement budget poste ferraillage +12%'
    },
    {
      type: 'planning',
      label: 'Planning',
      title: 'Risque de retard',
      description: 'Retard livraison matériaux toiture - 5 jours'
    }
  ];

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Vérifié':
        return 'bg-emerald-100 text-emerald-600';

      case 'En attente':
        return 'bg-amber-100 text-amber-600';

      case 'Rejeté':
        return 'bg-red-100 text-red-500';

      default:
        return 'bg-slate-100 text-slate-500';
    }
  }
}