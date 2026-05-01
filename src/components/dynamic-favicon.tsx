"use client";

import * as React from "react";
import { useStore } from "@/lib/store";

export function DynamicFavicon() {
  const storeLogo = useStore((s) => s.settings.storeLogo);

  React.useEffect(() => {
    if (!storeLogo) return;

    // Find or create favicon link
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    
    link.href = storeLogo;

    // Optional: Update apple-touch-icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (appleLink) {
      appleLink.href = storeLogo;
    }
  }, [storeLogo]);

  return null;
}
