import { MoedaPipe } from './moeda-pipe';

// toLocaleString('pt-BR', { style: 'currency', ... }) usa um espaço
// non-breaking (U+00A0) entre "R$" e o valor, não um espaço comum -- ver
// docs/handoff.md sobre achados não óbvios de formatação.
const NBSP = ' ';

describe('MoedaPipe', () => {
  let pipe: MoedaPipe;

  beforeEach(() => {
    pipe = new MoedaPipe();
  });

  it('formata centavos como reais no padrão pt-BR', () => {
    expect(pipe.transform(2990)).toBe(`R$${NBSP}29,90`);
  });

  it('formata zero corretamente', () => {
    expect(pipe.transform(0)).toBe(`R$${NBSP}0,00`);
  });

  it('arredonda/formata valores grandes com separador de milhar', () => {
    expect(pipe.transform(123456789)).toBe(`R$${NBSP}1.234.567,89`);
  });

  it('retorna string vazia para null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('retorna string vazia para undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});
