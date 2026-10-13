import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VentaPorCategoria } from '../models/venta-por-categoria.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  ventasPorCategoria(): Observable<VentaPorCategoria[]> {
    return this.http.get<VentaPorCategoria[]>(
      `${this.url}/ventas-por-categoria`,
    );
  }
}