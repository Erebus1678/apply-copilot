import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const capabilities = [
  { label: "Analyze", desc: "Paste a JD → tech stack, seniority, archetype." },
  { label: "Score", desc: "Match it against your CV with concrete gaps." },
  { label: "Draft", desc: "A tailored cover letter, streamed, no slop." },
  { label: "Track", desc: "Every role on one persistent pipeline board." },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center gap-16 px-6 py-24">
      <section className="flex flex-col gap-6">
        <span className="border-border bg-muted text-muted-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
          <span className="bg-success size-1.5 rounded-full" />
          Private by default · runs on your local model
        </span>
        <h1 className="max-w-2xl text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
          The copilot for landing your next role.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg text-pretty">
          Turn a job description into a fit score, a gap list, and a drafted cover letter — then
          track every application in one place.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg">Start with a job description</Button>
          <Button size="lg" variant="outline">
            See the pipeline
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {capabilities.map(({ label, desc }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="text-primary text-sm font-semibold">{label}</span>
              <span className="text-muted-foreground text-sm">{desc}</span>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
