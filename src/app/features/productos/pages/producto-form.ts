import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { erroresDeValidacion, mensajeError } from '../../../core/utils/http-error';

import { Categoria } from '../../categorias/models/categoria.model';
import { CategoriaService } from '../../categorias/services/categoria-service';

import { ProductoRequest } from '../models/producto.model';
import { ProductoService } from '../services/producto-service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css',
})
export class ProductoForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly productoService = inject(ProductoService);

  private readonly categoriaService = inject(CategoriaService);

  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  readonly categorias = signal<Categoria[]>([]);

  readonly cargando = signal(false);

  readonly guardando = signal(false);

  readonly error = signal<string | null>(null);

  readonly erroresServidor = signal<Record<string, string>>({});

  readonly esEdicion = signal(false);

  readonly id = signal<number | null>(null);

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],

    precio: [0, [Validators.required, Validators.min(0.01)]],

    stock: [0, [Validators.required, Validators.min(0)]],

    estado: [true],

    categoriaId: [0, [Validators.required, Validators.min(1)]],
  });

  readonly opciones = computed(() => this.categorias());

  readonly hayCategoriasActivas = computed(() =>
    this.categorias().some((categoria) => categoria.estado),
  );

  readonly categoriaElegida = computed(() => {
    const id = Number(this.form.controls.categoriaId.value);

    return this.categorias().find((categoria) => categoria.id === id) ?? null;
  });

  readonly categoriaInactiva = computed(() => {
    const categoria = this.categoriaElegida();

    return categoria !== null && !categoria.estado;
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);

      if (!Number.isNaN(id) && id > 0) {
        this.id.set(id);
        this.esEdicion.set(true);

        this.cargarEdicion(id);

        return;
      }
    }

    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});

    this.categoriaService.listar().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias.filter((categoria) => categoria.estado));

        this.cargando.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));

        this.cargando.set(false);
      },
    });
  }

  cargarEdicion(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});

    forkJoin({
      categorias: this.categoriaService.listar(),
      producto: this.productoService.obtener(id),
    }).subscribe({
      next: ({ categorias, producto }) => {
        const categoriasPermitidas = categorias.filter(
          (categoria) => categoria.estado || categoria.id === producto.categoriaId,
        );

        this.categorias.set(categoriasPermitidas);

        this.form.patchValue({
          nombre: producto.nombre,
          precio: producto.precio,
          stock: producto.stock,
          estado: producto.estado,
          categoriaId: producto.categoriaId,
        });

        this.cargando.set(false);
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));

        this.cargando.set(false);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid || this.categoriaInactiva()) {
      this.form.markAllAsTouched();

      return;
    }

    const valor = this.form.getRawValue();

    const dto: ProductoRequest = {
      nombre: valor.nombre.trim(),
      precio: Number(valor.precio),
      stock: Number(valor.stock),
      estado: valor.estado,
      categoriaId: Number(valor.categoriaId),
    };

    this.guardando.set(true);
    this.error.set(null);
    this.erroresServidor.set({});

    const id = this.id();

    if (id !== null) {
      this.productoService.actualizar(id, dto).subscribe({
        next: () => {
          this.guardando.set(false);

          this.router.navigate(['/productos']);
        },

        error: (err: HttpErrorResponse) => {
          this.procesarError(err);
        },
      });
    } else {
      this.productoService.crear(dto).subscribe({
        next: () => {
          this.guardando.set(false);

          this.router.navigate(['/productos']);
        },

        error: (err: HttpErrorResponse) => {
          this.procesarError(err);
        },
      });
    }
  }

  private procesarError(err: HttpErrorResponse): void {
    this.guardando.set(false);

    const validaciones = erroresDeValidacion(err);

    this.erroresServidor.set(validaciones);

    if (Object.keys(validaciones).length > 0) {
      this.error.set(Object.values(validaciones).join(' '));

      return;
    }

    this.error.set(mensajeError(err));
  }

  cancelar(): void {
    this.router.navigate(['/productos']);
  }
}
