import type { OrdemDeServico, Status } from "@/lib/types";

/**
 * Aviso ao cliente pelo WhatsApp, via link wa.me: o app só monta a conversa
 * com a mensagem pronta, e quem aperta "enviar" é a pessoa da oficina, do
 * WhatsApp dela. Sem API, sem número integrado, sem custo por mensagem.
 */

/**
 * O telefone no formato que o wa.me entende: só dígitos, com o 55 do Brasil
 * na frente. Devolve null quando o número não tem cara de celular ou fixo
 * brasileiro — melhor não mostrar o botão do que abrir conversa com ninguém.
 */
export function telefoneWhatsApp(telefone: string | null | undefined): string | null {
  let digitos = (telefone ?? "").replace(/\D/g, "");

  // "011 91234-5678": o zero do DDD de longa distância não vai no número
  if (digitos.length === 11 || digitos.length === 12) digitos = digitos.replace(/^0/, "");

  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) return digitos;
  return null;
}

type DadosDaMensagem = Pick<
  OrdemDeServico,
  "cliente_nome" | "veiculo_placa" | "veiculo_marca" | "veiculo_modelo"
>;

// Só estas etapas têm aviso: chegada e "pode buscar" são as duas notícias que
// o cliente espera receber. As outras ele acompanha pelo portal.
const ETAPAS_COM_AVISO = ["recebido", "finalizado"] as const;
type EtapaComAviso = (typeof ETAPAS_COM_AVISO)[number];

export function temAviso(status: Status): status is EtapaComAviso {
  return (ETAPAS_COM_AVISO as readonly Status[]).includes(status);
}

/**
 * O texto do aviso. Os asteriscos são o negrito do WhatsApp.
 *
 * A senha do portal NÃO vai escrita: a mensagem diz "os 4 últimos números
 * deste telefone". Se o telefone foi digitado errado na recepção, quem
 * recebe por engano fica sem a placa E a senha na mesma mensagem.
 */
export function mensagemDoAviso(
  status: EtapaComAviso,
  os: DadosDaMensagem,
  linkDoPortal: string
): string {
  const primeiroNome = os.cliente_nome.trim().split(/\s+/)[0];
  const modelo = [os.veiculo_marca, os.veiculo_modelo].filter(Boolean).join(" ");
  // sem marca e modelo, "carro" fica sem negrito: não é informação, é palavra
  const carro = modelo ? `*${modelo}*` : "carro";
  const placa = os.veiculo_placa;

  const acesso =
    `entre em ${linkDoPortal} com a placa *${placa}* ` +
    "e, como senha, os 4 últimos números deste telefone.";

  if (status === "recebido") {
    return [
      `Olá, ${primeiroNome}! Recebemos o seu ${carro}, placa *${placa}*, aqui na oficina.`,
      "Logo ele entra no serviço, e você pode ver cada etapa pelo celular.",
      "",
      `Para acompanhar, ${acesso}`,
    ].join("\n");
  }

  return [
    `Olá, ${primeiroNome}! O seu ${carro}, placa *${placa}*, está pronto.`,
    "Pode vir buscar quando quiser.",
    "",
    `Para ver os detalhes do serviço, ${acesso}`,
  ].join("\n");
}

export function linkWhatsApp(telefone: string, mensagem: string): string {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}
