/**
 * Mascara e validacao de digito verificador de CPF/CNPJ (algoritmo oficial,
 * modulo 11) -- espelha CpfCnpjValidator.java do backend, que valida de
 * novo por ser fronteira publica da API (nao confia so nessa validacao do
 * frontend).
 */

export function formatarCpfCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14);

  if (digitos.length <= 11) {
    return digitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return digitos
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function isCpfCnpjValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '');
  if (digitos.length === 11) {
    return isCpfValido(digitos);
  }
  if (digitos.length === 14) {
    return isCnpjValido(digitos);
  }
  return false;
}

function isCpfValido(cpf: string): boolean {
  if (todosDigitosIguais(cpf)) {
    return false;
  }
  const d1 = digitoVerificador(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(cpf.slice(0, 9) + d1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cpf === cpf.slice(0, 9) + d1 + d2;
}

function isCnpjValido(cnpj: string): boolean {
  if (todosDigitosIguais(cnpj)) {
    return false;
  }
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = digitoVerificador(cnpj.slice(0, 12), pesos1);
  const d2 = digitoVerificador(cnpj.slice(0, 12) + d1, pesos2);
  return cnpj === cnpj.slice(0, 12) + d1 + d2;
}

function digitoVerificador(base: string, pesos: number[]): number {
  const soma = pesos.reduce((acc, peso, i) => acc + Number(base[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function todosDigitosIguais(digitos: string): boolean {
  return new Set(digitos.split('')).size === 1;
}
