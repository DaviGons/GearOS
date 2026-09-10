import { Checklist } from "@/lib/types";

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

export function cadastroClienteCompleto(checklist: Checklist): boolean {
  return Boolean(
    checklist.cliente_nome?.trim() &&
      checklist.cliente_cpf?.trim() &&
      checklist.cliente_endereco?.trim() &&
      checklist.cliente_cep?.trim() &&
      checklist.cliente_numero?.trim() &&
      checklist.cliente_telefone?.trim()
  );
}
