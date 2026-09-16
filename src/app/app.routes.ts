import { Routes } from '@angular/router';
import { App } from './app';
import { ProjetComponent } from './pages/Entrepreneur/projet/projet';
import { InscriptionComponent } from './pages/inscription/inscription';
import { ConnexionComponent } from './pages/connexion/connexion';
import { HomeComponent } from './pages/home/home.component';
import { DepensesJustificatifs } from './pages/Entrepreneur/depenses-justificatifs/depenses-justificatifs';
import { DetailProjetComponent } from './pages/Entrepreneur/detail-projet/detail-projet';
import { OrcControle } from './pages/Entrepreneur/orc-controle/orc-controle';
import { MainLayout } from './pages/Entrepreneur/entrepreneur-layout/main-layout';
import { MaConstructionComponent } from './pages/Bailleur/ma-construction/ma-construction';
import { DashboardBailleur } from './pages/Bailleur/dashboard-bailleur/dashboard-bailleur';
import { BailleurLayout } from './pages/Bailleur/bailleur-layout/bailleur-layout';

export const routes: Routes = [
  //espace general
  { path: '', component: HomeComponent },
  { path: 'inscription', component: InscriptionComponent },
  { path: 'connexion', component: ConnexionComponent },
 
  // espace entrepreneur
  {
    path: 'entrepreneur',
    component: MainLayout,
    children: [
      {
        path: 'projet',
        component: ProjetComponent,
      },
      {
        path: 'depense',
        component: DepensesJustificatifs,
      },
      {
        path: 'detail',
        component: DetailProjetComponent,
      },
      {
        path: 'controle',
        component: OrcControle,
      },
    ],
  },

  {
    path: 'bailleur',
    component: BailleurLayout,
    children: [
      {
        path: 'construction',
        component: MaConstructionComponent,
      },
      {
        path: 'dashboard',
        component: DashboardBailleur,
      },
    ],
  },
];
