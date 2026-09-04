export function QRTile({ ticket }: { ticket: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid h-32 w-32 place-items-center rounded-xl border-2 border-dashed border-medical/40 bg-medical/5">
        <div className="text-center">
          <div className="text-3xl font-black text-medical">{ticket}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Queue ticket</div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Show this at reception</p>
    </div>
  );
}
