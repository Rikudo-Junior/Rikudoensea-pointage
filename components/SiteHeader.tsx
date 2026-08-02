import Image from "next/image";

export function SiteHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
        <Image src="/logo.jpg" alt="ENSEA" width={220} height={120} className="h-full w-full object-contain" priority />
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-secondary uppercase">ENSEA</p>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
