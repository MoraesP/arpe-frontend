import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { environment } from './environments/environment';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
// Vercel roteia via proxy reverso -- sem confiar nesses headers, o Angular
// nao consegue resolver o host publico real pra validar contra allowedHosts
// (angular.json) e cai no fallback vazio em vez de renderizar via SSR de
// verdade. Vercel e um proxy confiavel (nossa propria hospedagem).
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: ['x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-for'],
});

/**
 * Disallow rotas privadas/transacionais (nada de SEO ali, e conteúdo
 * dinâmico por sessão não deveria ser indexado) -- ver
 * docs/architecture/overview.md#seo.
 */
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Disallow: /admin',
      'Disallow: /carrinho',
      'Disallow: /checkout',
      'Disallow: /pedido',
      '',
      `Sitemap: ${environment.siteUrl}/sitemap.xml`,
    ].join('\n'),
  );
});

/**
 * Gerado dinamicamente (não é arquivo estático) porque a lista de produtos
 * muda o tempo todo -- busca direto na API pública do backend. Se a
 * chamada falhar, devolve só as páginas estáticas em vez de derrubar a
 * rota inteira.
 */
app.get('/sitemap.xml', async (_req, res) => {
  const paginasEstaticas = [
    { loc: `${environment.siteUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${environment.siteUrl}/produtos`, changefreq: 'daily', priority: '0.9' },
  ];

  let produtos: { id: string; createdAt: string }[] = [];
  try {
    const resposta = await fetch(`${environment.apiBaseUrl}/produtos`);
    if (resposta.ok) {
      produtos = await resposta.json();
    }
  } catch {
    // sitemap parcial (só páginas estáticas) é melhor que erro 500 -- o
    // crawler tenta de novo mais tarde
  }

  const urls = [
    ...paginasEstaticas.map((p) => `  <url><loc>${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`),
    ...produtos.map(
      (p) =>
        `  <url><loc>${environment.siteUrl}/produtos/${p.id}</loc><lastmod>${p.createdAt.slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ),
  ];

  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
