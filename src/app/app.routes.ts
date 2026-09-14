import { Routes } from '@angular/router';
import { App } from './app';
import { ProjetComponent } from './pages/Entrepreneur/projet/projet';
import { InscriptionComponent } from './pages/inscription/inscription';
import { ConnexionComponent } from './pages/connexion/connexion';
import { HomeComponent } from './pages/home/home.component';
import { DepensesJustificatifs } from './pages/Entrepreneur/depenses-justificatifs/depenses-justificatifs';
import { DetailProjetComponent } from './pages/Entrepreneur/detail-projet/detail-projet';
import { OrcControle } from './pages/Entrepreneur/orc-controle/orc-controle';
import { MainLayout } from './pages/main-layout/main-layout';

export const routes: Routes = [
  //espace general
  { path: '', component: HomeComponent },
  { path: 'inscription', component: InscriptionComponent },
  { path: 'connexion', component: ConnexionComponent },

  // espace entrepreneur
  {
    path: 'entrepreneur',
    component: MainLayout,
    children : [
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
];
