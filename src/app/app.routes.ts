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

      {
        path: 'detail',
        loadComponent: () =>
          import('./pages/Entrepreneur/detail-projet/detail-projet')
        .then(m => m.DetailProjetComponent)
      },

      {
        path: 'controle',
        loadComponent: () =>
          import('./pages/Entrepreneur/orc-controle/orc-controle')
            .then(m => m.OrcControle)
      },

      {
        path: 'justificatifs',
        loadComponent: () =>
          import('./pages/Entrepreneur/depenses-justificatifs/depenses-justificatifs')
            .then(m => m.DepensesJustificatifs)
      },

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