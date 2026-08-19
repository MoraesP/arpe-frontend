export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  // Public Key nao e secreta -- vai pro navegador de qualquer forma (SDK do
  // Payment Brick). Valor de teste, ver ADR 0003.
  mercadoPagoPublicKey: 'TEST-533ae908-2715-4709-afab-a1542e8d308c',
};
