import { Routes } from '@angular/router';
import { PlacarComponent } from './features/placar/placar.component';

export const routes: Routes = [
  { path: '', component: PlacarComponent },
  { path: '**', redirectTo: '' },
];
