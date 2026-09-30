import { OrdemDeServico } from "@/lib/types";

/**
 * Teto de tamanho por campo de texto.
 *
 * As colunas são `text`, ou seja, sem limite no banco: dava para gravar uma
 * observação de megabytes e ela voltaria em toda carga do quadro. Os números
 * abaixo são folgados para o uso real da oficina e apertados o bastante para
 * que ninguém use a O.S. como depósito de texto.
 */
const LIMITES_TEXTO: Record<string, number> = {
  atendente: 120,

  cliente_nome: 200,
  cliente_telefone: 20,
  cliente_cpf: 20,
  cliente_endereco: 200,
  cliente_cep: 12,
  cliente_numero: 20,
  cliente_complemento: 120,

  veiculo_placa: 12,
  veiculo_marca: 60,
  veiculo_modelo: 60,
  veiculo_ano: 10,
  veiculo_cor: 40,
  veiculo_km: 15,
  veiculo_combustivel: 40,

  avarias: 5000,
  observacoes: 5000,
};

/**
 * Confere os campos de texto de um corpo de requisição contra LIMITES_TEXTO.
 * Devolve a mensagem de erro do primeiro campo que estourar, ou null.
 */
export function erroDeTamanho(corpo: Record<string, unknown>): string | null {
  for (const [campo, limite] of Object.entries(LIMITES_TEXTO)) {
    const valor = corpo[campo];
    if (typeof valor === "string" && valor.length > limite) {
      return `O campo "${campo}" passa do limite de ${limite} caracteres.`;
    }
  }
  return null;
}

export function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const calcCheckDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += digits[i] * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10];
}

export function cadastroClienteCompleto(os: OrdemDeServico): boolean {
  return Boolean(
    os.cliente_nome?.trim() &&
      os.cliente_cpf?.trim() &&
      os.cliente_endereco?.trim() &&
      os.cliente_cep?.trim() &&
      os.cliente_numero?.trim() &&
      os.cliente_telefone?.trim()
  );
}
