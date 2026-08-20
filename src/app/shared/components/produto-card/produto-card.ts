import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, fotoCapa } from '../../../features/catalogo/models/product';
import { MoedaPipe } from '../../pipes/moeda-pipe';
import { BadgePreVenda } from '../badge-pre-venda/badge-pre-venda';

@Component({
  selector: 'app-produto-card',
  imports: [RouterLink, MoedaPipe, BadgePreVenda],
  templateUrl: './produto-card.html',
  styleUrl: './produto-card.scss',
})
export class ProdutoCard {
  readonly produto = input.required<Product>();
  protected readonly fotoCapa = fotoCapa;
}
