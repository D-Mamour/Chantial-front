import { Component } from '@angular/core';
import { DeclarerAvancement } from '../declarer-avancement/declarer-avancement';
import { AjoutEtape } from "../ajout-etape/ajout-etape";
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-residence-almadies',
  standalone: true,
  imports: [DeclarerAvancement, AjoutEtape],
  templateUrl: './detail-projet.html',
})

export class DetailProjetComponent {

  showProgressModal = false;

  @ViewChild('addStepModal')
  addStepModal!: AjoutEtape;



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

   openAddStepModal(): void {
    this.addStepModal.open();
  }


  onStepAdded(step: any): void {

    console.log('Étape reçue :', step);

    // Ici tu pourras appeler ton service API
    // this.projectService.addStep(step).subscribe(...)

  }

}
