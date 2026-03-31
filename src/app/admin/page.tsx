// ==========================================================
// PAINEL ADMIN - Dashboard de Links
// ==========================================================
// Gerenciamento de links com:
// - Busca automática de imagem do produto (OG tags)
// - Seleção múltipla + gerador de mensagem WhatsApp
// - Adicionar, editar, excluir, reordenar links
// ==========================================================
"use client";

import { useState, useEffect, useCallback } from "react";

interface Link {
  id: number;
  title: string;
  url: string;
  imageUrl: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  notes: string | null;
  clicks: number;
}

export default function AdminDashboard() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [saving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [fetchingImage, setFetchingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  // Selection + WhatsApp state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [whatsAppCopied, setWhatsAppCopied] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/links");
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch (err) {
      console.error("Erro ao carregar links:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const resetForm = () => {
    setFormTitle("");
    setFormUrl("");
    setFormImageUrl("");
    setFormIcon("");
    setFormNotes("");
    setFormIsActive(true);
    setFormIsFeatured(false);
    setEditingLink(null);
    setShowForm(false);
    setImageError("");
  };

  const openEditForm = (link: Link) => {
    setEditingLink(link);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormImageUrl(link.imageUrl || "");
    setFormIcon(link.icon || "");
    setFormNotes(link.notes || "");
    setFormIsActive(link.isActive);
    setFormIsFeatured(link.isFeatured);
    setShowForm(true);
    setImageError("");
  };

  // ========== BUSCA AUTOMÁTICA DE IMAGEM ==========
  const handleFetchImage = async () => {
    if (!formUrl) return;

    setFetchingImage(true);
    setImageError("");

    try {
      const res = await fetch("/api/admin/scrape-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formUrl }),
      });

      const data = await res.json();

      if (data.imageUrl) {
        setFormImageUrl(data.imageUrl);
        // Se não tem título ainda, sugerir o do OG
        if (!formTitle && data.title) {
          setFormTitle(data.title);
        }
      } else {
        setImageError("Nenhuma imagem encontrada neste link");
      }
    } catch {
      setImageError("Erro ao buscar imagem do link");
    } finally {
      setFetchingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const body = {
        title: formTitle,
        url: formUrl,
        imageUrl: formImageUrl || null,
        icon: formIcon || null,
        notes: formNotes || null,
        isActive: formIsActive,
        isFeatured: formIsFeatured,
      };

      if (editingLink) {
        await fetch(`/api/admin/links/${editingLink.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/admin/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      resetForm();
      fetchLinks();
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este link?")) return;

    try {
      await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
      fetchLinks();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
  };

  const handleToggleActive = async (link: Link) => {
    try {
      await fetch(`/api/admin/links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...link, isActive: !link.isActive }),
      });
      fetchLinks();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  };

  const handleToggleFeatured = async (link: Link) => {
    try {
      await fetch(`/api/admin/links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...link, isFeatured: !link.isFeatured }),
      });
      fetchLinks();
    } catch (err) {
      console.error("Erro ao alterar destaque:", err);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await fetch(`/api/admin/links/${id}/duplicate`, { method: "POST" });
      fetchLinks();
    } catch (err) {
      console.error("Erro ao duplicar:", err);
    }
  };

  const handleCopyUrl = (link: Link) => {
    navigator.clipboard.writeText(link.url);
    setCopySuccess(link.id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newLinks = [...links];
    [newLinks[index - 1], newLinks[index]] = [
      newLinks[index],
      newLinks[index - 1],
    ];
    const orderedIds = newLinks.map((l) => l.id);

    try {
      await fetch("/api/admin/links/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      fetchLinks();
    } catch (err) {
      console.error("Erro ao reordenar:", err);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === links.length - 1) return;
    const newLinks = [...links];
    [newLinks[index], newLinks[index + 1]] = [
      newLinks[index + 1],
      newLinks[index],
    ];
    const orderedIds = newLinks.map((l) => l.id);

    try {
      await fetch("/api/admin/links/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      fetchLinks();
    } catch (err) {
      console.error("Erro ao reordenar:", err);
    }
  };

  // ========== SELEÇÃO MÚLTIPLA ==========
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === links.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(links.map((l) => l.id)));
    }
  };

  // ========== GERADOR DE MENSAGEM WHATSAPP ==========
  const generateWhatsAppMessage = () => {
    const selected = links.filter((l) => selectedIds.has(l.id));
    if (selected.length === 0) return;

    const lines: string[] = [];
    lines.push("🛍️ *ACHADOS DO DIA* 🛍️");
    lines.push("");

    selected.forEach((link, i) => {
      lines.push(`✨ ${link.title}`);
      lines.push(`🔗 ${link.url}`);
      if (i < selected.length - 1) {
        lines.push("");
      }
    });

    const message = lines.join("\n");
    setWhatsAppMessage(message);
    setShowWhatsApp(true);
    setWhatsAppCopied(false);
  };

  const copyWhatsAppMessage = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setWhatsAppCopied(true);
    setTimeout(() => setWhatsAppCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Links</h1>
          <p className="text-gray-500 text-sm mt-1">
            {links.length} link{links.length !== 1 ? "s" : ""} cadastrado
            {links.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* WhatsApp button - visible when links are selected */}
          {selectedIds.size > 0 && (
            <button
              onClick={generateWhatsAppMessage}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Link
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">
                  {editingLink ? "Editar Link" : "Novo Link"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* URL field with auto-fetch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de destino *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
                      placeholder="https://..."
                      required
                    />
                    <button
                      type="button"
                      onClick={handleFetchImage}
                      disabled={!formUrl || fetchingImage}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 shadow-sm"
                      title="Buscar imagem e título do link"
                    >
                      {fetchingImage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      <span className="hidden sm:inline">{fetchingImage ? "Buscando..." : "Buscar"}</span>
                    </button>
                  </div>
                  {imageError && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      {imageError}
                    </p>
                  )}
                </div>

                {/* Image preview */}
                {formImageUrl && (
                  <div className="relative bg-gray-50 rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm shrink-0">
                        <img
                          src={formImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => {
                            setFormImageUrl("");
                            setImageError("Não foi possível carregar esta imagem");
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600 mb-0.5">Imagem do produto</p>
                        <p className="text-xs text-gray-400 truncate">{formImageUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl("")}
                        className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                        title="Remover imagem"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do botão *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
                    placeholder="Ex: 🛍️ TikTok Shop"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ícone (emoji, opcional)
                  </label>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
                    placeholder="🛍️"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observação interna (opcional)
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all resize-none"
                    placeholder="Observação só visível no admin..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-700">Ativo</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-700">Destacado</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      {showWhatsApp && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Mensagem WhatsApp</h2>
                    <p className="text-xs text-gray-400">{selectedIds.size} link{selectedIds.size !== 1 ? "s" : ""} selecionado{selectedIds.size !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWhatsApp(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message preview */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {whatsAppMessage}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWhatsApp(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Fechar
                </button>
                <button
                  onClick={copyWhatsAppMessage}
                  className={`flex-1 py-2.5 px-4 font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                    whatsAppCopied
                      ? "bg-green-500 text-white shadow-green-500/20"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-500/20 hover:shadow-green-500/30"
                  }`}
                >
                  {whatsAppCopied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Copiar Mensagem
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select All / Deselect bar */}
      {links.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={toggleSelectAll}
            className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors flex items-center gap-1.5"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
              selectedIds.size === links.length
                ? "bg-violet-600 border-violet-600"
                : selectedIds.size > 0
                ? "bg-violet-200 border-violet-400"
                : "border-gray-300"
            }`}>
              {selectedIds.size > 0 && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {selectedIds.size === links.length ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                  )}
                </svg>
              )}
            </div>
            {selectedIds.size === links.length ? "Desmarcar todos" : "Selecionar todos"}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-xs text-gray-400">
              {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhum link ainda
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Clique em &quot;Novo Link&quot; para começar
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => (
            <div
              key={link.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                selectedIds.has(link.id)
                  ? "border-violet-400 ring-2 ring-violet-100 shadow-sm"
                  : !link.isActive
                  ? "border-gray-200 opacity-60"
                  : link.isFeatured
                  ? "border-violet-300 shadow-sm shadow-violet-500/10"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox for selection */}
                <button
                  onClick={() => toggleSelect(link.id)}
                  className="mt-1 shrink-0"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedIds.has(link.id)
                      ? "bg-violet-600 border-violet-600"
                      : "border-gray-300 hover:border-violet-400"
                  }`}>
                    {selectedIds.has(link.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Reorder buttons */}
                <div className="flex flex-col gap-1 pt-0.5 shrink-0">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    title="Mover para cima"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === links.length - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    title="Mover para baixo"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Product Image Thumbnail */}
                {link.imageUrl && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-sm">
                    <img
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {link.title}
                    </h3>
                    {link.isFeatured && (
                      <span className="shrink-0 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                        ⭐ Destaque
                      </span>
                    )}
                    {!link.isActive && (
                      <span className="shrink-0 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {link.url}
                  </p>
                  {link.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      📝 {link.notes}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      📊 {link.clicks} clique{link.clicks !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">
                      📋 #{link.order}
                    </span>
                    {link.imageUrl && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-green-500">🖼️ Imagem</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopyUrl(link)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Copiar URL"
                  >
                    {copySuccess === link.id ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDuplicate(link.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Duplicar"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(link)}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                      link.isFeatured ? "text-violet-500" : "text-gray-400"
                    }`}
                    title={link.isFeatured ? "Remover destaque" : "Destacar"}
                  >
                    <svg className="w-4 h-4" fill={link.isFeatured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                      link.isActive ? "text-green-500" : "text-gray-400"
                    }`}
                    title={link.isActive ? "Desativar" : "Ativar"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {link.isActive ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={() => openEditForm(link)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                    title="Excluir"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
