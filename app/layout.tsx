import { headers } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LOCALE_HEADER, htmlLang, isLocale, type Locale } from "@/i18n/locale";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const raw = headerList.get(LOCALE_HEADER);
  const locale: Locale = raw && isLocale(raw) ? raw : "zh";

  return (
    <html lang={htmlLang(locale)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(window.__awskillThemeBound)return;window.__awskillThemeBound=1;var root=document.documentElement;function stored(){try{var raw=localStorage.getItem("awskill:dark");if(raw==null)return matchMedia("(prefers-color-scheme: dark)").matches;return JSON.parse(raw)===true;}catch(e){return false;}}if(!root.getAttribute("data-theme"))root.setAttribute("data-theme",stored()?"dark":"light");document.addEventListener("click",function(event){var node=event.target&&event.target.closest&&event.target.closest("[data-theme-toggle]");if(!node)return;var next=root.getAttribute("data-theme")!=="dark";root.setAttribute("data-theme",next?"dark":"light");try{localStorage.setItem("awskill:dark",JSON.stringify(next));}catch(e){}node.setAttribute("aria-pressed",next?"true":"false");window.dispatchEvent(new Event("awskill-theme"));},true);})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
