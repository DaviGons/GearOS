import { Status } from "@/lib/types";

export const STATUS_BADGE_CLASS: Record<Status, string> = {
  recebido: "bg-attention/15 text-attention border border-attention/30",
  em_andamento: "bg-accent/15 text-accent border border-accent/30",
  finalizado: "bg-primary/20 text-[#7fd4c9] border border-primary/40",
  entregue: "bg-muted/15 text-muted border border-muted/30",
};

export const STATUS_COLUMN_ACCENT: Record<Status, string> = {
  recebido: "border-t-attention",
  em_andamento: "border-t-accent",
  finalizado: "border-t-primary",
  entregue: "border-t-muted",
};
