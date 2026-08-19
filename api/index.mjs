// Entry point da funcao serverless do Vercel -- Vercel nao esta detectando
// o servidor de SSR do Angular automaticamente (ver commit anterior sobre
// index.csr.html), entao expomos a funcao explicitamente aqui e roteamos
// tudo pra ela via vercel.json.
import { reqHandler } from '../dist/frontend/server/server.mjs';

export default function handler(req, res) {
  return reqHandler(req, res);
}
