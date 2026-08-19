import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Carrinho } from '../../../core/services/carrinho';
import { MoedaPipe } from '../../pipes/moeda-pipe';

/** Carrinho visivel no topo em qualquer pagina -- ver docs/PRD.md 2.2. */
@Component({
  selector: 'app-carrinho-mini',
  imports: [RouterLink, MoedaPipe],
  templateUrl: './carrinho-mini.html',
  styleUrl: './carrinho-mini.scss',
})
export class CarrinhoMini {
  protected readonly carrinho = inject(Carrinho);
}
