export const environment = {
  production: true,
  // Preenchido via variavel de ambiente no deploy (Vercel) -- ver
  // docs/architecture/overview.md. Placeholder ate o backend estar publicado.
  apiBaseUrl: 'https://arpe-backend.onrender.com/api',
  // Placeholder -- trocar pela Public Key de PRODUCAO do Mercado Pago antes
  // do primeiro deploy real (a de teste nao processa pagamento de verdade).
  mercadoPagoPublicKey: 'TEST-533ae908-2715-4709-afab-a1542e8d308c',
};
