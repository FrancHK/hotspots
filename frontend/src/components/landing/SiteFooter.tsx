import { Brand } from "@/components/Brand";

export function SiteFooter() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t border-line py-10 text-center text-sm text-muted">
      <Brand size="sm" />
      <p>© {new Date().getFullYear()} HotspotX · Haraka · Nguvu · Imara</p>
    </footer>
  );
}
