import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppNav } from "@/components/AppNav";
import { useTheme } from "@/hooks/use-theme";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Smart VIT Parking System" },
      { name: "description", content: "Kiosk-style parking management with barcode scanning, 65 live slots, and warm-themed light/dark UI." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Smart VIT Parking System" },
      { property: "og:description", content: "Kiosk-style parking management with barcode scanning, 65 live slots, and warm-themed light/dark UI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Smart VIT Parking System" },
      { name: "twitter:description", content: "Kiosk-style parking management with barcode scanning, 65 live slots, and warm-themed light/dark UI." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/88b1e73f-eedd-48ce-b13f-7767c563645b/id-preview-ffa7aa4a--0bac55a0-7cd2-48dd-9700-dfe4af9b2abe.lovable.app-1776501870129.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/88b1e73f-eedd-48ce-b13f-7767c563645b/id-preview-ffa7aa4a--0bac55a0-7cd2-48dd-9700-dfe4af9b2abe.lovable.app-1776501870129.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // Initialise theme on first load (applies .dark class to <html>)
  useTheme();
  return (
    <div className="min-h-screen bg-background">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "rounded-xl border bg-card text-card-foreground shadow-card",
        }}
      />
      <AppNav />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-6 text-center text-xs text-muted-foreground sm:px-6">
        Records are saved on this device only (browser storage). Clearing site data resets parking.
      </footer>
    </div>
  );
}
