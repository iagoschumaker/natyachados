// ==========================================================
// CONFIGURAÇÕES - Personalização geral da página
// ==========================================================
// Aqui você pode alterar:
// - Título e subtítulo
// - Logo/foto de perfil
// - Cor dos botões e fundo
// - Texto do rodapé
// - Favicon
// - Scripts extras (Analytics, Pixel, etc)
// ==========================================================
"use client";

import { useState, useEffect, useCallback } from "react";
import ImageCropper from "@/components/ImageCropper";

interface Settings {
  siteTitle: string;
  siteSubtitle: string;
  logoUrl: string | null;
  footerText: string;
  primaryColor: string;
  backgroundColor: string;
  faviconUrl: string | null;
  headScripts: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);

    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };

  const handleCroppedUpload = async (blob: Blob) => {
    if (!settings) return;
    setCropFile(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", new File([blob], "logo.png", { type: "image/png" }));

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setSettings({ ...settings, logoUrl: url });
      }
    } catch (err) {
      console.error("Erro no upload:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "faviconUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setSettings({ ...settings, [field]: url });
      }
    } catch (err) {
      console.error("Erro no upload:", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">
          Personalize a aparência da sua página pública
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
        {/* Identidade */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Identidade
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título da página
              </label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) =>
                  setSettings({ ...settings, siteTitle: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtítulo
              </label>
              <input
                type="text"
                value={settings.siteSubtitle}
                onChange={(e) =>
                  setSettings({ ...settings, siteSubtitle: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto do rodapé
              </label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) =>
                  setSettings({ ...settings, footerText: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Logo */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🖼️ Logo / Foto de perfil
          </h2>
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm">
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                <span className="text-2xl">📷</span>
              </div>
            )}
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                {uploading ? "Enviando..." : "Escolher imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoSelect}
                  disabled={uploading}
                />
              </label>
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, logoUrl: null })}
                  className="ml-2 text-sm text-red-500 hover:text-red-600"
                >
                  Remover
                </button>
              )}
              <p className="text-xs text-gray-400 mt-1">JPG, PNG ou WebP. Máx 5MB.</p>
            </div>
          </div>
        </section>

        {/* Cores */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🎨 Cores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor principal (botões)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    setSettings({ ...settings, primaryColor: e.target.value })
                  }
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    setSettings({ ...settings, primaryColor: e.target.value })
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor de fundo
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      backgroundColor: e.target.value,
                    })
                  }
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      backgroundColor: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-xl border border-gray-100" style={{ backgroundColor: settings.backgroundColor }}>
            <p className="text-xs text-gray-400 mb-2">Prévia:</p>
            <div
              className="py-3 px-6 rounded-xl text-white font-medium text-center text-sm"
              style={{ backgroundColor: settings.primaryColor }}
            >
              Botão exemplo
            </div>
          </div>
        </section>

        {/* Favicon */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            🌐 Favicon
          </h2>
          <div className="flex items-center gap-4">
            {settings.faviconUrl ? (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={settings.faviconUrl}
                  alt="Favicon"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-dashed border-gray-200">
                <span className="text-sm">🌐</span>
              </div>
            )}
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
              {uploading ? "Enviando..." : "Escolher favicon"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e, "faviconUrl")}
                disabled={uploading}
              />
            </label>
          </div>
        </section>

        {/* Scripts */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Scripts extras
          </h2>
          <p className="text-gray-500 text-sm mb-3">
            Cole aqui scripts de rastreamento (Google Analytics, Meta Pixel, etc).
            Eles serão inseridos no &lt;head&gt; da página pública.
          </p>
          <textarea
            value={settings.headScripts || ""}
            onChange={(e) =>
              setSettings({ ...settings, headScripts: e.target.value || null })
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-all resize-none"
            rows={4}
            placeholder='<script async src="https://www.googletagmanager.com/gtag/js?id=..."></script>'
          />
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98]"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvo!
            </span>
          )}
        </div>
      </form>

      {/* Image Cropper Modal */}
      {cropFile && (
        <ImageCropper
          file={cropFile}
          onCrop={handleCroppedUpload}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
