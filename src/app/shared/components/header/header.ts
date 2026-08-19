import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CarrinhoMini } from '../carrinho-mini/carrinho-mini';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CarrinhoMini],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
