import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProdutoService } from '../../services/produto-service';
import { ProdutoCard } from '../../../../shared/components/produto-card/produto-card';

@Component({
  selector: 'app-home',
  imports: [ProdutoCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly produtoService = inject(ProdutoService);

  protected readonly destaques = toSignal(this.produtoService.destaque(), { initialValue: [] });
}
