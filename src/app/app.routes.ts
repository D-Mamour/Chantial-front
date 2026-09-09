import { Routes } from '@angular/router';
import { App } from './app';
import { ProjetComponent } from './pages/Entrepreneur/projet/projet';

export const routes: Routes = [

  {
    path: '',
    component: App,
    children: [

      {
        path: 'projet',
        loadComponent: () =>
          import('./pages/Entrepreneur/projet/projet')
            .then(m => m.ProjetComponent)
      },

    //   {
    //     path: 'depenses',
    //     loadComponent: () =>
    //       import('./pages/depenses/depenses.component')
    //         .then(m => m.DepensesComponent)
    //   },

    //   {
    //     path: 'justificatifs',
    //     loadComponent: () =>
    //       import('./pages/justificatifs/justificatifs.component')
    //         .then(m => m.JustificatifsComponent)
    //   },

    //   {
    //     path: 'analyses',
    //     loadComponent: () =>
    //       import('./pages/analyses/analyses.component')
    //         .then(m => m.AnalysesComponent)
    //   },

    //   {
    //     path: 'parametres',
    //     loadComponent: () =>
    //       import('./pages/parametres/parametres.component')
    //         .then(m => m.ParametresComponent)
    //   },

    //   {
    //     path: 'profil',
    //     loadComponent: () =>
    //       import('./pages/profil/profil.component')
    //         .then(m => m.ProfilComponent)
    //   }

    ]
  }

];