/**
 * fetch com nova tentativa automática para falhas passageiras (rede
 * instável, banco acordando de um cold start, etc). Só tenta de novo
 * em erro de rede ou status 5xx — erros do próprio pedido (400, 401,
 * 404...) retornam na hora, sem retry, porque tentar de novo não vai
 * mudar o resultado.
 *
 * 429 também não é retentado: "devagar" respondido com mais duas
 * tentativas em 1,2s é o contrário do pedido, e ainda gastava o limite
 * do usuário honesto três vezes mais rápido.
 */
export async function fetchComRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  tentativas = 2
): Promise<Response> {
  let ultimoErro: unknown;

  for (let tentativa = 0; tentativa <= tentativas; tentativa++) {
    try {
      const res = await fetch(input, init);
      if (res.ok || res.status < 500) return res;
      ultimoErro = new Error(`HTTP ${res.status}`);
    } catch (err) {
      ultimoErro = err;
    }

    if (tentativa < tentativas) {
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** tentativa));
    }
  }

  if (ultimoErro instanceof Error) throw ultimoErro;
  throw new Error("Falha ao conectar. Tente novamente.");
}
