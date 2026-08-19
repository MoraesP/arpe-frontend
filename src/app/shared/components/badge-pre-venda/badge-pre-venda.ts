import { Component, input } from '@angular/core';
import { MoedaPipe } from '../../pipes/moeda-pipe';

/** Selo de pre-venda com o valor de entrada exigido -- ver docs/PRD.md 2.1. */
@Component({
  selector: 'app-badge-pre-venda',
  imports: [MoedaPipe],
  templateUrl: './badge-pre-venda.html',
  styleUrl: './badge-pre-venda.scss',
})
export class BadgePreVenda {
  readonly presaleDepositAmountCents = input.required<number>();
}
