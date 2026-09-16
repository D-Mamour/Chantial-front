import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { InscriptionComponent } from './pages/inscription/inscription';
import { ConnexionComponent } from './pages/connexion/connexion';
import { MainLayout } from './pages/Entrepreneur/entrepreneur-layout/main-layout'; 
import { ProjetComponent } from './pages/Entrepreneur/projet/projet';
import { DepensesJustificatifs } from './pages/Entrepreneur/depenses-justificatifs/depenses-justificatifs';
import { DetailProjetComponent } from './pages/Entrepreneur/detail-projet/detail-projet';
import { OrcControle } from './pages/Entrepreneur/orc-controle/orc-controle';
import { Notifications } from './pages/Entrepreneur/notification/notifications';
import { DashboardBailleur } from './pages/Bailleur/dashboard-bailleur/dashboard-bailleur';
import { MaConstructionComponent } from './pages/Bailleur/ma-construction/ma-construction';
import { DemandeModalComponent } from './pages/Bailleur/demande/demande';
import { AdminComponent } from './pages/Administrateur/admin/admin';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'inscription', component: InscriptionComponent },
  { path: 'connexion', component: ConnexionComponent },
  {
    path: 'entrepreneur',
    component: MainLayout,
    canActivate: [authGuard, roleGuard(['ENTREPRENEUR'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'projet' },
      { path: 'projet', component: ProjetComponent },
      { path: 'depense', component: DepensesJustificatifs },
      { path: 'detail', component: DetailProjetComponent },
      { path: 'controle', component: OrcControle },
      { path: 'notifications', component: Notifications },
    ],
  },
  {
    path: 'bailleur',
    canActivate: [authGuard, roleGuard(['BAILLEUR'])],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardBailleur },
      { path: 'construction', component: MaConstructionComponent },
      { path: 'demande', component: DemandeModalComponent },
    ],
  },
  {
    path: 'administrateur',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard(['ADMINISTRATEUR'])],
  },
  { path: '**', redirectTo: '' },
];
