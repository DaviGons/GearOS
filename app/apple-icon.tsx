import { ImageResponse } from "next/og";
import { CORES, markDataUri } from "@/lib/brand";

// Ícone usado quando o app é salvo na tela inicial do celular. Precisa ser
// "full-bleed": a cor de fundo vai até a borda do quadrado, senão o iOS
// desenha uma moldura branca em volta.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CORES.tinta,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={markDataUri({ traco: CORES.fundo, espessura: 5.5 })}
          width={130}
          height={130}
          alt=""
        />
      </div>
    ),
    size
  );
}
