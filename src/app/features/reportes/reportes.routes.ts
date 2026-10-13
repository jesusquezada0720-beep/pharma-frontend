import { Routes } from '@angular/router';
import { VentasPorCategoria } from './pages/ventas-por-categoria/ventas-por-categoria';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    component: VentasPorCategoria,
    title: 'Reporte de ventas por categoría',
  },
];