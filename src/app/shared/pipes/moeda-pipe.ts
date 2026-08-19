import { Pipe, PipeTransform } from '@angular/core';

/** Converte um valor em centavos (BIGINT no backend) para "R$ 29,90". */
@Pipe({
  name: 'moeda',
})
export class MoedaPipe implements PipeTransform {
  transform(cents: number | null | undefined): string {
    if (cents == null) {
      return '';
    }
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
