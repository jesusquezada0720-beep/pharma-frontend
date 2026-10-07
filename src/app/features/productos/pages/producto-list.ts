import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { Categoria } from '../../categorias/models/categoria.model';
import { CategoriaService } from '../../categorias/services/categoria-service';

import { Direccion, OrdenProducto, Producto } from '../models/producto.model';
import { ProductoService } from '../services/producto-service';

import { mensajeError } from '../../../core/utils/http-error';

@Component({
  selector: 'app-producto-list',
  standalone: true,

  imports: [RouterLink, DecimalPipe],

  templateUrl: './producto-list.html',

  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit {
  private readonly productoService = inject(ProductoService);

  private readonly categoriaService = inject(CategoriaService);

  readonly categoriaId = input<string>();

  readonly productos = signal<Producto[]>([]);

  readonly categorias = signal<Categoria[]>([]);

  readonly cargando = signal(false);

  readonly error = signal<string | null>(null);

  readonly pagina = signal(0);

  readonly tamanio = signal(10);

  readonly totalElementos = signal(0);

  readonly totalPaginas = signal(0);

  readonly ultima = signal(true);

  readonly ordenarPor = signal<OrdenProducto>('nombre');

  readonly direccion = signal<Direccion>('asc');

  readonly categoriaFiltro = signal<number | null>(null);

  ngOnInit(): void {
    const cat = this.categoriaId();

    if (cat) {
      this.categoriaFiltro.set(Number(cat));
      this.tamanio.set(100);
    }

    this.cargarCategorias();
    this.cargar();
  }

  nombreFiltro(): string {
    const id = this.categoriaFiltro();

    return this.categorias().find((c) => c.id === id)?.nombre ?? String(id);
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
      },
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.productoService
      .listar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion())
      .subscribe({
        next: (respuesta) => {
          this.productos.set(respuesta.contenido);

          this.totalElementos.set(respuesta.totalElementos);

          this.totalPaginas.set(respuesta.totalPaginas);

          this.ultima.set(respuesta.ultima);

          this.cargando.set(false);
        },

        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));

          this.cargando.set(false);
        },
      });
  }

  cambiarTamanio(valor: string): void {
    this.tamanio.set(Number(valor));

    this.pagina.set(0);

    this.cargar();
  }

  ordenar(campo: OrdenProducto): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update((actual) => (actual === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);

      this.direccion.set('asc');
    }

    this.pagina.set(0);

    this.cargar();
  }

  irAPagina(numero: number): void {
    if (numero < 0) {
      return;
    }

    if (this.totalPaginas() > 0 && numero >= this.totalPaginas()) {
      return;
    }

    this.pagina.set(numero);

    this.cargar();
  }

  anterior(): void {
    this.irAPagina(this.pagina() - 1);
  }

  siguiente(): void {
    this.irAPagina(this.pagina() + 1);
  }

  filtrarPorCategoria(valor: string): void {
    this.categoriaFiltro.set(valor ? Number(valor) : null);
  }

  productosFiltrados(): Producto[] {
    const categoriaId = this.categoriaFiltro();

    if (categoriaId === null) {
      return this.productos();
    }

    return this.productos().filter((producto) => producto.categoriaId === categoriaId);
  }

  darDeBaja(producto: Producto): void {
    if (!producto.estado) {
      return;
    }

    const confirmar = window.confirm(`¿Dar de baja el producto "${producto.nombre}"?`);

    if (!confirmar) {
      return;
    }

    this.productoService.darDeBaja(producto.id).subscribe({
      next: () => {
        this.cargar();
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
      },
    });
  }
}
