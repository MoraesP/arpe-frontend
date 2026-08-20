import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

@Component({ selector: 'app-dummy', template: '' })
class Dummy {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: Dummy },
          { path: 'admin', component: Dummy },
        ]),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exibe header/footer/carrinho/cookie-consent em rotas do site público', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
    expect(compiled.querySelector('app-footer')).toBeTruthy();
    expect(compiled.querySelector('app-cart-drawer')).toBeTruthy();
    expect(compiled.querySelector('app-cookie-consent')).toBeTruthy();
  });

  it('esconde header/footer/carrinho/cookie-consent em rotas /admin (layout próprio do AdminShell)', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeFalsy();
    expect(compiled.querySelector('app-footer')).toBeFalsy();
    expect(compiled.querySelector('app-cart-drawer')).toBeFalsy();
    expect(compiled.querySelector('app-cookie-consent')).toBeFalsy();
  });
});
