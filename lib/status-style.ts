import { Status } from "@/lib/types";

// Cada status tem uma cor própria no tema (ver app/globals.css). O badge é
// discreto de propósito: fundo lavado, texto na cor cheia.
export const STATUS_BADGE_CLASS: Record<Status, string> = {
  recebido: "bg-status-recebido/10 text-status-recebido border border-status-recebido/25",
  em_andamento: "bg-status-andamento/10 text-status-andamento border border-status-andamento/25",
  finalizado: "bg-status-finalizado/10 text-status-finalizado border border-status-finalizado/25",
  entregue: "bg-status-entregue/10 text-status-entregue border border-status-entregue/25",
};

/** Filete colorido no topo da coluna do quadro. */
export const STATUS_COLUMN_ACCENT: Record<Status, string> = {
  recebido: "border-t-status-recebido",
  em_andamento: "border-t-status-andamento",
  finalizado: "border-t-status-finalizado",
  entregue: "border-t-status-entregue",
};

/** Bolinha ao lado do nome da coluna. */
export const STATUS_DOT_CLASS: Record<Status, string> = {
  recebido: "bg-status-recebido",
  em_andamento: "bg-status-andamento",
  finalizado: "bg-status-finalizado",
  entregue: "bg-status-entregue",
};
