import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

export interface SeoData {
  /** Sem o sufixo " | ArPe" -- entra automaticamente. */
  title: string;
  description: string;
  /** Caminho absoluto (ex: "/produtos/123") usado pra montar og:url e o link canonical. */
  path: string;
  image?: string;
  type?: 'website' | 'product';
}

const JSON_LD_ID = 'seo-jsonld';

/**
 * Title/description/Open Graph/canonical + JSON-LD por página -- Title e
 * Meta do Angular já são isomórficos (funcionam durante o SSR), então as
 * tags saem no HTML renderizado pelo servidor, não só depois de hidratar
 * no browser (o que não adiantaria nada pra indexação). Ver
 * docs/architecture/overview.md#seo.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  atualizar(data: SeoData): void {
    const tituloCompleto = `${data.title} | ArPe`;
    const url = `${environment.siteUrl}${data.path}`;

    // Limpo aqui pra nunca sobrar o JSON-LD de uma página anterior (ex:
    // Product de um produto) quando o usuário navega pra uma página que
    // não chama definirJsonLd() de novo (ex: home) -- quem precisa dele
    // chama definirJsonLd() logo em seguida, na mesma sequência síncrona.
    this.removerJsonLd();

    this.title.setTitle(tituloCompleto);
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ property: 'og:title', content: tituloCompleto });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:locale', content: 'pt_BR' });
    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
    }

    this.atualizarCanonical(url);
  }

  /** Product/Organization/etc -- ver https://schema.org. Substitui o JSON-LD anterior, se houver. */
  definirJsonLd(json: object): void {
    this.removerJsonLd();
    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(json);
    this.document.head.appendChild(script);
  }

  removerJsonLd(): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
  }

  private atualizarCanonical(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
