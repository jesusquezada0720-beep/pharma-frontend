import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);

  protected readonly respuesta = signal<PaginaResponse<Cliente> | null>(null);
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal('apellidos');
  protected readonly direccion = signal<'asc' | 'desc'>('asc');

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');

  protected readonly clientes = computed(() => this.respuesta()?.contenido ?? []);
  protected readonly filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.clientes().filter((c) => {
      const nombreCompleto = `${c.nombres} ${c.apellidos}`.toLowerCase();
      const apellidoPrimero = `${c.apellidos} ${c.nombres}`.toLowerCase();
      return (
        c.dni.includes(texto) || nombreCompleto.includes(texto) || apellidoPrimero.includes(texto)
      );
    });
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService
      .listar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion())
      .subscribe({
        next: (datos) => {
          this.respuesta.set(datos);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  anterior(): void {
    if (this.pagina() > 0) {
      this.pagina.update((p) => p - 1);
      this.cargar();
    }
  }

  siguiente(): void {
    if (!this.respuesta()?.ultima) {
      this.pagina.update((p) => p + 1);
      this.cargar();
    }
  }

  cambiarTamanio(valor: number): void {
    this.tamanio.set(valor);
    this.pagina.set(0);
    this.cargar();
  }

  ordenar(campo: string): void {
    if (this.ordenarPor() === campo) {
      this.direccion.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }
    this.pagina.set(0);
    this.cargar();
  }

  protected flecha(campo: string): string {
    if (this.ordenarPor() !== campo) {
      return '';
    }
    return this.direccion() === 'asc' ? '▲' : '▼';
  }

  darDeBaja(cliente: Cliente): void {
    if (!confirm(`¿Dar de baja a ${cliente.nombres} ${cliente.apellidos}?`)) {
      return;
    }
    this.error.set(null);
    this.clienteService.eliminar(cliente.id).subscribe({
      next: () => this.cargar(),
      error: (err: HttpErrorResponse) => this.error.set(mensajeError(err)),
    });
  }
}
