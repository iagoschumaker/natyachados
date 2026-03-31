// ==========================================================
// COMPONENTE: LinkButton (clicável, com tracking de cliques)
// ==========================================================
// Agora com suporte a thumbnail de imagem do produto
// ==========================================================
"use client";

interface LinkButtonProps {
  id: number;
  title: string;
  url: string;
  icon: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  primaryColor: string;
}

export default function LinkButton({
  id,
  title,
  url,
  icon,
  imageUrl,
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
      className={`group block w-full relative overflow-hidden transition-all duration-300 ${
        isFeatured
          ? "py-4 px-5 rounded-2xl text-white font-bold shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98]"
          : "py-3.5 px-5 rounded-xl text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
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

      <span className="relative flex items-center gap-3">
        {/* Product image thumbnail */}
        {imageUrl && (
          <span className="w-10 h-10 rounded-lg overflow-hidden bg-white/20 shrink-0 shadow-sm border border-white/20">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = "none";
              }}
            />
          </span>
        )}
        {/* Icon + Title */}
        <span className={`flex items-center gap-2 ${imageUrl ? "" : "justify-center w-full"} ${isFeatured ? "text-lg" : ""}`}>
          {icon && <span className="text-xl">{icon}</span>}
          <span className="truncate">{title}</span>
        </span>
      </span>
    </a>
  );
}
