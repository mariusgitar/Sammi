type WaitingScreenProps = {
  reason: string
}

export default function WaitingScreen({ reason }: WaitingScreenProps) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
      <p className="text-lg font-semibold">Venter på neste steg</p>
      <p className="mt-2 text-slate-600">{reason}</p>
      <div className="mx-auto mt-4 h-2 w-20 animate-pulse rounded-full bg-slate-200" />
    </div>
  )
}
