import { Component } from '@angular/core';
import { DeclarerAvancement } from '../declarer-avancement/declarer-avancement';
import { AjoutEtape } from "../ajout-etape/ajout-etape";

@Component({
  selector: 'app-residence-almadies',
  standalone: true,
  imports: [DeclarerAvancement, AjoutEtape],
  templateUrl: './detail-projet.html',
})

export class DetailProjetComponent {

  showProgressModal = false;
  showAddStepModal = false;

  ouvrirDeclaration(): void {
    this.showProgressModal = true;
  }

  fermerDeclaration(): void {
    this.showProgressModal = false;
  }

  avancementDeclare(declaration: any): void {

    console.log('Déclaration reçue :', declaration);

    this.showProgressModal = false;

    // Plus tard :
    // appel API
    // actualisation de l'avancement
  }

  ouvrirAjoutEtape(): void {
  this.showAddStepModal = true;
}

fermerAjoutEtape(): void {
  this.showAddStepModal = false;
}

onStepAdded(etape: any): void {
  console.log('Nouvelle étape :', etape);

  this.showAddStepModal = false;

  // appel API ici
}

}
