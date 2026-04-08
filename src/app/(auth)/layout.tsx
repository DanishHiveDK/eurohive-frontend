export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="flex-1 bg-gradient-to-br from-midnight via-midnight-500 to-midnight-400 flex flex-col justify-center px-14 hidden lg:flex">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-honey to-honey-300 flex items-center justify-center shadow-sm">
            <span className="text-base font-extrabold text-midnight font-serif">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-serif">Eurohive</span>
        </div>
        <h2 className="text-3xl font-bold text-white font-serif leading-tight mb-3">
          Europe&apos;s freelance marketplace
        </h2>
        <p className="text-[15px] text-white/40 leading-relaxed max-w-md">
          Connect with top freelancers and clients across 27 EU countries. GDPR-compliant with secure Mollie payments.
        </p>
        <div className="flex gap-6 mt-10">
          {[
            { v: "12,400+", l: "Freelancers" },
            { v: "€8.2M", l: "Paid out" },
            { v: "4.8★", l: "Avg rating" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-xl font-bold text-white font-serif">{s.v}</div>
              <div className="text-xs text-white/30">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
