// ==========================================================
// COMPONENTE: LinkButton (clicável, com tracking de cliques)
// ==========================================================
"use client";

interface LinkButtonProps {
  id: number;
  title: string;
  url: string;
  icon: string | null;
  isFeatured: boolean;
  primaryColor: string;
}

export default function LinkButton({
  id,
  title,
  url,
  icon,
  isFeatured,
  primaryColor,
}: LinkButtonProps) {
  const handleClick = async () => {
    // Registra o clique (fire-and-forget)
    fetch(`/api/click/${id}`, { method: "POST" }).catch(() => {});
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`group block w-full text-center relative overflow-hidden transition-all duration-300 ${
        isFeatured
          ? "py-4 px-6 rounded-2xl text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98]"
          : "py-3.5 px-6 rounded-xl text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
      }`}
      style={{
        backgroundColor: primaryColor,
      }}
    >
      {/* Shine effect on hover */}
      <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-inherit" />

      {/* Glow for featured */}
      {isFeatured && (
        <span
          className="absolute -inset-1 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"
          style={{ backgroundColor: primaryColor }}
        />
      )}

      <span className="relative flex items-center justify-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        {title}
      </span>
    </a>
  );
}
