export function Button({ children, className = "", variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const base = "px-3 py-2 rounded-md text-sm font-semibold";
  const variants = {
    primary: "bg-amber-500 text-[#101010]",
    ghost: "border border-current text-current opacity-70 hover:opacity-100",
    danger: "bg-red-600 text-white",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`px-3 py-2 rounded-md text-sm bg-[var(--pitch-950)] border border-[var(--line)] text-[var(--chalk)] focus:outline-none focus:border-[var(--amber)] ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`p-4 rounded-lg mb-4 border border-[var(--line)] bg-[var(--pitch-800)] ${className}`}>
      {children}
    </section>
  );
}

export function Badge({ children, size = 26 }: { children: React.ReactNode; size?: number }) {
  return (
    <div className="flex items-center justify-center rounded-full shrink-0 font-bold" style={{ width: size, height: size, background: "var(--amber)", color: "#101010", fontFamily: "var(--font-mono)", fontSize: size * 0.34 }}>
      {children}
    </div>
  );
}