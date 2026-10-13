import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { mensajeError } from '../../../../core/utils/http-error';
import { VentaPorCategoria } from '../../models/venta-por-categoria.model';
import { ReporteService } from '../../services/reporte-service';

@Component({
  selector: 'app-ventas-por-categoria',
  imports: [CurrencyPipe],
  templateUrl: './ventas-por-categoria.html',
  styleUrl: './ventas-por-categoria.css',
})
export class VentasPorCategoria implements OnInit {
  private readonly reporteService = inject(ReporteService);

  protected readonly datos = signal<VentaPorCategoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly totalUnidades = () =>
    this.datos().reduce((total, item) => total + item.unidades, 0);

  protected readonly totalMonto = () =>
    this.datos().reduce((total, item) => total + item.monto, 0);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.reporteService.ventasPorCategoria().subscribe({
      next: datos => {
        this.datos.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }
}