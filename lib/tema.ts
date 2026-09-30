import { CORES } from "./brand";

/**
 * Preferência de tema do usuário. "sistema" acompanha o que o celular ou o
 * sistema operacional já pede — é o padrão, e é o que o cliente vê no portal,
 * onde não existe seletor.
 */
export type Tema = "claro" | "escuro" | "sistema";

/** Só o que o usuário escolheu na mão, já resolvido para uma das duas telas. */
type TemaResolvido = "claro" | "escuro";

export const CHAVE_TEMA = "gearos:tema";

/** Cor da barra do navegador no celular, por tema. */
const COR_DA_BARRA: Record<TemaResolvido, string> = {
  claro: CORES.fundo,
  escuro: "#0f141b",
};

/**
 * Roda no <head>, antes da primeira pintura, senão a tela pisca clara antes de
 * escurecer. Por isso é script inline e não um efeito do React.
 *
 * A lógica é a mesma de aplicarTema() logo abaixo — as duas precisam existir
 * porque esta aqui vira string no HTML e aquela roda no clique do seletor.
 */
export const SCRIPT_DO_TEMA = `(function(){try{
var chave=${JSON.stringify(CHAVE_TEMA)},cores=${JSON.stringify(COR_DA_BARRA)};
var mq=matchMedia("(prefers-color-scheme: dark)");
function aplicar(){
var salvo=localStorage.getItem(chave);
var tema=(salvo==="claro"||salvo==="escuro")?salvo:(mq.matches?"escuro":"claro");
document.documentElement.dataset.tema=tema;
var meta=document.querySelector('meta[name="theme-color"]');
if(meta)meta.setAttribute("content",cores[tema]);
}
aplicar();
mq.addEventListener("change",aplicar);
}catch(e){}})();`;

function resolverTema(tema: Tema): TemaResolvido {
  if (tema === "claro" || tema === "escuro") return tema;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

export function aplicarTema(tema: Tema) {
  const resolvido = resolverTema(tema);
  document.documentElement.dataset.tema = resolvido;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COR_DA_BARRA[resolvido]);
}
