export type Status = "recebido" | "em_andamento" | "finalizado" | "entregue";

export const STATUS_ORDER: Status[] = ["recebido", "em_andamento", "finalizado", "entregue"];

export const STATUS_LABEL: Record<Status, string> = {
  recebido: "Recebido",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
  entregue: "Entregue",
};

export type TipoCombustivel = "diesel" | "alcool" | "gasolina";

export const TIPO_COMBUSTIVEL_LABEL: Record<TipoCombustivel, string> = {
  diesel: "Diesel",
  alcool: "Álcool",
  gasolina: "Gasolina",
};

export type Checklist = {
  id: number;
  criado_em: string;
  atualizado_em: string;
  status: Status;
  atendente: string | null;

  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_cpf: string | null;
  cliente_endereco: string | null;
  cliente_cep: string | null;
  cliente_numero: string | null;
  cliente_complemento: string | null;

  veiculo_placa: string;
  veiculo_marca: string | null;
  veiculo_modelo: string | null;
  veiculo_ano: string | null;
  veiculo_cor: string | null;
  veiculo_km: string | null;
  veiculo_combustivel: string | null;
  veiculo_tipo_combustivel: TipoCombustivel | null;

  fotos: string[];
  avarias: string | null;
  observacoes: string;
};

/**
 * O que o cartão do quadro realmente usa. O quadro carrega até 300 O.S. de
 * uma vez: puxar `select("*")` traria `observacoes` e `avarias` inteiras de
 * todas elas só para desenhar nome, placa e data.
 */
export type ChecklistResumo = Pick<
  Checklist,
  | "id"
  | "status"
  | "cliente_nome"
  | "veiculo_marca"
  | "veiculo_modelo"
  | "veiculo_placa"
  | "criado_em"
>;

/** Colunas do ChecklistResumo, prontas para o `.select()` do Supabase. */
export const CAMPOS_RESUMO =
  "id,status,cliente_nome,veiculo_marca,veiculo_modelo,veiculo_placa,criado_em";

export type ChecklistInput = {
  atendente?: string;

  cliente_nome: string;
  cliente_telefone?: string;
  cliente_cpf?: string;
  cliente_endereco?: string;
  cliente_cep?: string;
  cliente_numero?: string;
  cliente_complemento?: string;

  veiculo_placa: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: string;
  veiculo_cor?: string;
  veiculo_km?: string;
  veiculo_combustivel?: string;
  veiculo_tipo_combustivel?: TipoCombustivel;

  avarias?: string;
  observacoes: string;
};
