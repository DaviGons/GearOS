import { ImageResponse } from "next/og";
import { CORES, markDataUri } from "@/lib/brand";

// Imagem que aparece quando alguém compartilha o link do sistema (WhatsApp,
// Telegram, redes sociais). Gerada em build, não é um arquivo solto.
export const alt = "GearOS — gestão de oficina, do check-in à entrega";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          background: CORES.fundo,
          position: "relative",
        }}
      >
        {/* marca gigante sangrando pela direita, bem apagada — dá profundidade
            sem competir com o texto na miniatura */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={markDataUri()}
          width={700}
          height={700}
          alt=""
          style={{ position: "absolute", right: -230, top: -35, opacity: 0.05 }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markDataUri()} width={104} height={104} alt="" />
          <span
            style={{
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: CORES.texto,
            }}
          >
            GearOS
          </span>
        </div>

        <span style={{ marginTop: 28, fontSize: 38, color: CORES.muted }}>
          Gestão de oficina, do check-in à entrega
        </span>
      </div>
    ),
    size
  );
}
