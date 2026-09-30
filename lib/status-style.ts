import { Status } from "@/lib/types";

// Cada status tem uma cor própria no tema (ver app/globals.css): as cores das
// etiquetas de chave do quadro da recepção. O badge é discreto de propósito:
// fundo lavado, texto na cor cheia.
export const STATUS_BADGE_CLASS: Record<Status, string> = {
  recebido: "bg-status-recebido/10 text-status-recebido border border-status-recebido/30",
  em_andamento: "bg-status-andamento/10 text-status-andamento border border-status-andamento/30",
  finalizado: "bg-status-finalizado/10 text-status-finalizado border border-status-finalizado/30",
  entregue: "bg-status-entregue/10 text-status-entregue border border-status-entregue/30",
};

/**
 * Corpo da etiqueta de chave: a cor do status bem lavada, com borda dela.
 *
 * O tom vai como imagem de fundo (um "degradê" de uma cor só) e não como
 * bg-status-x/8: assim ele fica por cima do bg-surface do cartão em vez de
 * brigar com ele pela mesma propriedade, e a etiqueta continua opaca.
 */
export const STATUS_TAG_CLASS: Record<Status, string> = {
  recebido:
    "bg-linear-to-b from-status-recebido/[0.08] to-status-recebido/[0.08] border-status-recebido/30 hover:border-status-recebido/60",
  em_andamento:
    "bg-linear-to-b from-status-andamento/[0.08] to-status-andamento/[0.08] border-status-andamento/30 hover:border-status-andamento/60",
  finalizado:
    "bg-linear-to-b from-status-finalizado/[0.08] to-status-finalizado/[0.08] border-status-finalizado/30 hover:border-status-finalizado/60",
  entregue:
    "bg-linear-to-b from-status-entregue/[0.08] to-status-entregue/[0.08] border-status-entregue/30 hover:border-status-entregue/60",
};

/** O furo da etiqueta, por onde passa a argola da chave. */
export const STATUS_FURO_CLASS: Record<Status, string> = {
  recebido: "border-status-recebido",
  em_andamento: "border-status-andamento",
  finalizado: "border-status-finalizado",
  entregue: "border-status-entregue",
};

/** Bolinha ao lado do nome da coluna e dos passos. */
export const STATUS_DOT_CLASS: Record<Status, string> = {
  recebido: "bg-status-recebido",
  em_andamento: "bg-status-andamento",
  finalizado: "bg-status-finalizado",
  entregue: "bg-status-entregue",
};
