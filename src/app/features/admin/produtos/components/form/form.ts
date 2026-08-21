import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminProdutoService, ProductRequest } from '../../services/admin-produto-service';
import { ProductPhoto } from '../../../../catalogo/models/product';

const MAX_FOTOS = 5;

@Component({
  selector: 'app-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './form.html',
  styleUrl: './form.scss',
})
export class Form {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminProdutoService = inject(AdminProdutoService);

  protected readonly produtoId = this.route.snapshot.paramMap.get('id');
  protected readonly modoEdicao = this.produtoId !== null;

  protected readonly name = signal('');
  protected readonly slug = signal('');
  protected readonly description = signal('');
  protected readonly priceReais = signal<number | null>(null);
  protected readonly quantity = signal<number | null>(null);
  protected readonly weightGrams = signal<number | null>(null);
  protected readonly lengthCm = signal<number | null>(null);
  protected readonly widthCm = signal<number | null>(null);
  protected readonly heightCm = signal<number | null>(null);
  protected readonly isPresale = signal(false);
  protected readonly presaleDepositReais = signal<number | null>(null);
  protected readonly isFeatured = signal(false);
  protected readonly isActive = signal(true);
  protected readonly tagsTexto = signal('');

  protected readonly fotos = signal<ProductPhoto[]>([]);
  protected readonly enviandoFoto = signal(false);
  protected readonly erroFoto = signal<string | null>(null);
  protected readonly arrastandoSobre = signal(false);
  protected readonly maxFotos = MAX_FOTOS;

  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  constructor() {
    if (this.produtoId) {
      this.carregando.set(true);
      this.adminProdutoService.buscarPorId(this.produtoId).subscribe({
        next: (produto) => {
          this.name.set(produto.name);
          this.slug.set(produto.slug);
          this.description.set(produto.description ?? '');
          this.priceReais.set(produto.priceCents / 100);
          this.quantity.set(produto.quantity);
          this.weightGrams.set(produto.weightGrams);
          this.lengthCm.set(produto.lengthCm);
          this.widthCm.set(produto.widthCm);
          this.heightCm.set(produto.heightCm);
          this.isPresale.set(produto.isPresale);
          this.presaleDepositReais.set(
            produto.presaleDepositAmountCents !== null
              ? produto.presaleDepositAmountCents / 100
              : null,
          );
          this.isFeatured.set(produto.isFeatured);
          this.isActive.set(produto.isActive);
          this.tagsTexto.set(produto.tags.map((t) => t.name).join(', '));
          this.fotos.set(produto.photos);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar o produto.');
          this.carregando.set(false);
        },
      });
    }
  }

  salvar(): void {
    this.erro.set(null);

    if (this.isPresale() && this.presaleDepositReais() === null) {
      this.erro.set('Produto de pré-venda exige valor de entrada.');
      return;
    }

    const request: ProductRequest = {
      name: this.name(),
      slug: this.slug(),
      description: this.description() || null,
      priceCents: Math.round((this.priceReais() ?? 0) * 100),
      quantity: this.quantity() ?? 0,
      weightGrams: this.weightGrams() ?? 0,
      lengthCm: this.lengthCm() ?? 0,
      widthCm: this.widthCm() ?? 0,
      heightCm: this.heightCm() ?? 0,
      isPresale: this.isPresale(),
      presaleDepositAmountCents: this.isPresale()
        ? Math.round((this.presaleDepositReais() ?? 0) * 100)
        : null,
      isFeatured: this.isFeatured(),
      isActive: this.isActive(),
      tags: this.tagsTexto()
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    };

    this.salvando.set(true);
    const acao = this.produtoId
      ? this.adminProdutoService.editar(this.produtoId, request)
      : this.adminProdutoService.criar(request);

    acao.subscribe({
      next: () => this.router.navigate(['/admin/produtos']),
      error: (err: HttpErrorResponse) => {
        this.erro.set(err.error?.detail ?? 'Não foi possível salvar o produto.');
        this.salvando.set(false);
      },
    });
  }

  selecionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.enviarFoto(file);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.arrastandoSobre.set(false);
    this.enviarFoto(event.dataTransfer?.files?.[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.arrastandoSobre.set(true);
  }

  onDragLeave(): void {
    this.arrastandoSobre.set(false);
  }

  removerFoto(photoId: string): void {
    if (!this.produtoId) {
      return;
    }
    this.erroFoto.set(null);
    this.adminProdutoService.removerFoto(this.produtoId, photoId).subscribe({
      next: (produto) => this.fotos.set(produto.photos),
      error: (err: HttpErrorResponse) => {
        this.erroFoto.set(err.error?.detail ?? 'Não foi possível remover a foto.');
      },
    });
  }

  marcarFavorita(photoId: string): void {
    if (!this.produtoId) {
      return;
    }
    this.erroFoto.set(null);
    this.adminProdutoService.marcarFavorita(this.produtoId, photoId).subscribe({
      next: (produto) => this.fotos.set(produto.photos),
      error: (err: HttpErrorResponse) => {
        this.erroFoto.set(err.error?.detail ?? 'Não foi possível marcar a foto como favorita.');
      },
    });
  }

  private enviarFoto(file: File | undefined): void {
    if (!file || !this.produtoId || this.fotos().length >= MAX_FOTOS) {
      return;
    }

    this.erroFoto.set(null);
    this.enviandoFoto.set(true);

    this.adminProdutoService.adicionarFoto(this.produtoId, file).subscribe({
      next: (produto) => {
        this.fotos.set(produto.photos);
        this.enviandoFoto.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.erroFoto.set(err.error?.detail ?? 'Não foi possível enviar a foto.');
        this.enviandoFoto.set(false);
      },
    });
  }
}
