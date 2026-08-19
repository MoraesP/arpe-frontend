import { Component, inject } from '@angular/core';
import { Carrinho } from '../../../core/services/carrinho';
import { MoedaPipe } from '../../pipes/moeda-pipe';

/** Botao de carrinho no header -- abre o drawer lateral (nao navega direto). */
@Component({
  selector: 'app-carrinho-mini',
  imports: [MoedaPipe],
  templateUrl: './carrinho-mini.html',
  styleUrl: './carrinho-mini.scss',
})
export class CarrinhoMini {
  protected readonly carrinho = inject(Carrinho);
}
