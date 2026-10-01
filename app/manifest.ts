import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VisaReady KR",
    short_name: "VisaReady",
    description: "Personalized Korean visa document preparation checklists.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#0b1220",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
