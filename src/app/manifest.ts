import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SUWAVE Motorista",
    short_name: "Motorista",
    description: "App do motorista SUWAVE para cadastro, disponibilidade e corridas.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffc400",
    icons: [
      {
        src: "/motorista/splash.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/motorista/splash.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
