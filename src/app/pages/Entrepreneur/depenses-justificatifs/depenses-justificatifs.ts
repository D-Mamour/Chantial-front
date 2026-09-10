import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AjoutDepense } from "../ajout-depense/ajout-depense";

interface Transaction {
  id: number;
  project: string;
  step: string;
  label: string;
  amount: string;
  date: string;
  status: 'Validé' | 'En attente' | 'Rejeté' | 'Non fourni';
}

@Component({
  selector: 'app-depenses-justificatifs',
  standalone: true,
  imports: [FormsModule, AjoutDepense],
  templateUrl: './depenses-justificatifs.html'
})
export class DepensesJustificatifs {

  searchTerm = '';

  selectedProject = 'Almadies';

  selectedStatus = 'Tous';

  currentPage = 1;

  showAddExpenseModal = false;

  transactions: Transaction[] = [

    {
      id: 1,
      project: 'Résidence Almadies',
      step: 'Fondations',
      label: 'Ciment Portland Valdah',
      amount: '2 500 000 FCFA',
      date: '12/03/2026',
      status: 'Validé'
    },

    {
      id: 2,
      project: 'École Pikine',
      step: 'Élévation',
      label: 'Fer à béton 12mm - Sénégal',
      amount: '4 200 000 FCFA',
      date: '10/03/2026',
      status: 'En attente'
    },

    {
      id: 3,
      project: 'Clinique Diamniadio',
      step: 'Second œuvre',
      label: 'Location tractopelle 3 jours',
      amount: '1 850 000 FCFA',
      date: '09/03/2026',
      status: 'Validé'
    },

    {
      id: 4,
      project: 'Résidence Almadies',
      step: 'Élévation',
      label: 'Facture graviers & granulats',
      amount: '3 100 000 FCFA',
      date: '08/03/2026',
      status: 'Rejeté'
    },

    {
      id: 5,
      project: 'Pont Kaolack',
      step: 'Fondations',
      label: 'Ferraillage & micropieux',
      amount: '12 500 000 FCFA',
      date: '05/03/2026',
      status: 'Validé'
    },

    {
      id: 6,
      project: 'Logements Rufisque',
      step: 'Fondations',
      label: 'Terrassement sablonneux',
      amount: '850 000 FCFA',
      date: '04/03/2026',
      status: 'Non fourni'
    },

    {
      id: 7,
      project: 'Centre Commercial Thiès',
      step: 'Fondations',
      label: 'Achat briques creuses',
      amount: '1 200 000 FCFA',
      date: '02/03/2026',
      status: 'Validé'
    },

    {
      id: 8,
      project: 'École Pikine',
      step: 'Fondations',
      label: "Main d'œuvre coffrage",
      amount: '1 500 000 FCFA',
      date: '28/02/2026',
      status: 'En attente'
    }

  ];


  get filteredTransactions(): Transaction[] {

    return this.transactions.filter(transaction => {

      const search = this.searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        transaction.project.toLowerCase().includes(search) ||
        transaction.step.toLowerCase().includes(search) ||
        transaction.label.toLowerCase().includes(search);

      const matchesProject =
        this.selectedProject === 'Tous' ||
        transaction.project.includes(this.selectedProject);

      const matchesStatus =
        this.selectedStatus === 'Tous' ||
        this.getStatusKey(transaction.status) === this.selectedStatus;

      return (
        matchesSearch &&
        matchesProject &&
        matchesStatus
      );

    });

  }


  private getStatusKey(
    status: Transaction['status']
  ): string {

    switch (status) {

      case 'Validé':
        return 'Valide';

      case 'En attente':
        return 'Attente';

      case 'Rejeté':
        return 'Rejete';

      case 'Non fourni':
        return 'NonFourni';

      default:
        return '';

    }

  }


  addExpense(): void {
    console.log('Ajouter une dépense');
  }


  consult(transaction: Transaction): void {
    console.log('Consulter :', transaction);
  }


  edit(transaction: Transaction): void {
    console.log('Éditer :', transaction);
  }


  goToPage(page: number): void {
    this.currentPage = page;
  }


  previousPage(): void {

    if (this.currentPage > 1) {
      this.currentPage--;
    }

  }


  nextPage(): void {
    this.currentPage++;
  }

ouvrirAjoutDepense(): void {
  this.showAddExpenseModal = true;
}

fermerAjoutDepense(): void {
  this.showAddExpenseModal = false;
}

onExpenseAdded(depense: any): void {

  console.log('Nouvelle dépense :', depense);

  // API
  // this.expenseService.create(depense).subscribe(...)

  this.showAddExpenseModal = false;
}


}