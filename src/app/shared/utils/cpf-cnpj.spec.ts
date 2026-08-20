import { formatarCpfCnpj, isCpfCnpjValido } from './cpf-cnpj';

describe('cpf-cnpj', () => {
  describe('formatarCpfCnpj', () => {
    it('aplica a máscara de CPF conforme o usuário digita (até 11 dígitos)', () => {
      expect(formatarCpfCnpj('111')).toBe('111');
      expect(formatarCpfCnpj('111444')).toBe('111.444');
      expect(formatarCpfCnpj('11144477735')).toBe('111.444.777-35');
    });

    it('aplica a máscara de CNPJ a partir de 12 dígitos', () => {
      expect(formatarCpfCnpj('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('ignora caracteres não numéricos e trunca em 14 dígitos', () => {
      expect(formatarCpfCnpj('11.222.333/0001-81extra')).toBe('11.222.333/0001-81');
    });
  });

  describe('isCpfCnpjValido', () => {
    it('aceita CPF com dígito verificador correto', () => {
      expect(isCpfCnpjValido('111.444.777-35')).toBe(true);
      expect(isCpfCnpjValido('11144477735')).toBe(true);
    });

    it('aceita CNPJ com dígito verificador correto', () => {
      expect(isCpfCnpjValido('11.222.333/0001-81')).toBe(true);
    });

    it('rejeita CPF com dígito verificador errado', () => {
      expect(isCpfCnpjValido('111.444.777-36')).toBe(false);
    });

    it('rejeita sequência de dígitos repetidos', () => {
      expect(isCpfCnpjValido('11111111111')).toBe(false);
      expect(isCpfCnpjValido('00000000000000')).toBe(false);
    });

    it('rejeita quantidade de dígitos diferente de 11 ou 14', () => {
      expect(isCpfCnpjValido('123')).toBe(false);
      expect(isCpfCnpjValido('')).toBe(false);
    });
  });
});
