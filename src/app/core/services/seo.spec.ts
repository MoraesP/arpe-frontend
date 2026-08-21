import { TestBed } from '@angular/core/testing';
import { Seo } from './seo';

describe('Seo', () => {
  function criarServico(): Seo {
    TestBed.configureTestingModule({});
    // limpa resíduo que possa ter vindo de outro arquivo de spec (ex:
    // Detalhe, que também seta og:image) -- document é o real do browser,
    // compartilhado por toda a suíte, ver nota no afterEach abaixo.
    document.querySelector('meta[property="og:image"]')?.remove();
    return TestBed.inject(Seo);
  }

  afterEach(() => {
    // document é o real do browser (Karma) e não reseta entre specs --
    // sem isso, og:image de um teste (ou de outro arquivo de spec, ex:
    // Detalhe) vaza pro próximo, já que Meta.updateTag() só atualiza/cria,
    // nunca remove uma tag que deixou de fazer sentido.
    document.getElementById('seo-jsonld')?.remove();
    document.querySelector('meta[property="og:image"]')?.remove();
  });

  it('atualizar() define título, description e Open Graph', () => {
    const seo = criarServico();
    seo.atualizar({ title: 'Teste', description: 'Descrição teste', path: '/teste' });

    expect(document.title).toBe('Teste | ArPe');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Descrição teste',
    );
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Teste | ArPe',
    );
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
  });

  it('atualizar() usa og:type="product" quando informado', () => {
    const seo = criarServico();
    seo.atualizar({ title: 'Produto', description: 'Desc', path: '/produtos/1', type: 'product' });

    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('product');
  });

  it('atualizar() define og:image só quando informado', () => {
    const seo = criarServico();
    seo.atualizar({ title: 'A', description: 'B', path: '/a' });
    expect(document.querySelector('meta[property="og:image"]')).toBeNull();

    seo.atualizar({ title: 'A', description: 'B', path: '/a', image: 'https://x.com/img.jpg' });
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://x.com/img.jpg',
    );
  });

  it('atualizar() cria e depois só atualiza o link canonical, nunca duplica', () => {
    const seo = criarServico();
    seo.atualizar({ title: 'A', description: 'B', path: '/primeira' });
    seo.atualizar({ title: 'A', description: 'B', path: '/segunda' });

    const links = document.querySelectorAll('link[rel="canonical"]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toContain('/segunda');
  });

  it('definirJsonLd() injeta um script application/ld+json com o conteúdo dado', () => {
    const seo = criarServico();
    seo.definirJsonLd({ '@type': 'Product', name: 'X' });

    const script = document.getElementById('seo-jsonld');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(script!.textContent!)).toEqual({ '@type': 'Product', name: 'X' });
  });

  it('definirJsonLd() chamado de novo substitui o anterior, não duplica', () => {
    const seo = criarServico();
    seo.definirJsonLd({ a: 1 });
    seo.definirJsonLd({ a: 2 });

    expect(document.querySelectorAll('#seo-jsonld').length).toBe(1);
    expect(JSON.parse(document.getElementById('seo-jsonld')!.textContent!)).toEqual({ a: 2 });
  });

  it('atualizar() limpa o JSON-LD de uma chamada anterior (ex: saindo da página de produto)', () => {
    const seo = criarServico();
    seo.definirJsonLd({ a: 1 });
    seo.atualizar({ title: 'A', description: 'B', path: '/a' });

    expect(document.getElementById('seo-jsonld')).toBeNull();
  });
});
