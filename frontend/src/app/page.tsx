import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

// Temporary component showcase for step 10a — replaced by the landing page in 10b.
export default function Showcase() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <Brand withTagline size="md" />
        <ThemeToggle />
      </header>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Vitufe (Buttons)</CardTitle>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="brand">Anza Sasa</Button>
            <Button variant="neutral">Ingia</Button>
            <Button variant="ghost">Soma Zaidi</Button>
            <Button variant="brand" loading>
              Inapakia
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Beji (Badges)</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="brand">Pro</Badge>
            <Badge tone="success">Active</Badge>
            <Badge tone="warning">Pending</Badge>
            <Badge tone="danger">Blocked</Badge>
            <Badge tone="info">Info</Badge>
          </div>
        </Card>

        <Card>
          <CardTitle>Fomu (Inputs)</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label="Barua pepe" placeholder="jina@biashara.tz" />
            <Select label="Aina ya kifaa" defaultValue="omada">
              <option value="omada">Omada</option>
              <option value="mikrotik">MikroTik</option>
            </Select>
          </div>
        </Card>

        <Card inset>
          <CardTitle>Takwimu (Stat)</CardTitle>
          <div className="mt-4">
            <p className="text-sm text-muted">Mapato ya leo</p>
            <p className="text-3xl font-extrabold text-brand">12,500 TZS</p>
          </div>
        </Card>
      </section>

      <p className="mt-10 text-center text-sm text-muted">
        🐆 HotspotX UI kit — neumorphism, light/dark, Swahili.
      </p>
    </main>
  );
}
