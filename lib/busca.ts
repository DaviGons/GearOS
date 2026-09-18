/**
 * Monta o filtro de busca do quadro sem deixar o usuário escrever a query.
 *
 * O `.or()` do PostgREST recebe uma STRING, e vírgula, ponto e parêntese são
 * a sintaxe dela. Interpolar o termo cru ali deixava o usuário injetar
 * condições próprias: um termo que não casava com nada voltava com o banco
 * inteiro se terminasse em `%,id.gte.1,veiculo_cor.ilike.%`.
 *
 * A defesa é envolver o valor em aspas duplas — dentro delas o PostgREST
 * trata vírgula, ponto e parêntese como texto comum — e escapar o que
 * quebraria as próprias aspas (`"` e `\`).
 */

/** Termo maior que isto não é busca, é payload. */
const MAX_TERMO = 100;

const COLUNAS = ["cliente_nome", "veiculo_placa", "veiculo_modelo"] as const;

function escaparTermoDeBusca(termo: string): string {
  return termo.replace(/[\\"]/g, (caractere) => `\\${caractere}`).slice(0, MAX_TERMO);
}

/** Filtro pronto para `.or()`: casa o termo em qualquer uma das colunas. */
export function filtroDeBusca(termo: string): string {
  const seguro = escaparTermoDeBusca(termo);
  return COLUNAS.map((coluna) => `${coluna}.ilike."%${seguro}%"`).join(",");
}
