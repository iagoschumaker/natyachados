// ==========================================================
// COMPONENTE: ImageCropper - Corte circular de imagem
// ==========================================================
// Abre um modal com preview da imagem selecionada.
// O usuário pode arrastar para posicionar e usar zoom.
// Retorna um Blob da imagem cortada em formato circular.
// ==========================================================
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ImageCropperProps {
  file: File;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

const CROP_SIZE = 280; // Tamanho do crop em px
const OUTPUT_SIZE = 400; // Tamanho da imagem de saída em px

export default function ImageCropper({ file, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  // Carregar imagem do file
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      setImageEl(img);
      // Centralizar a imagem
      const scale = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height);
      setZoom(scale);
      setPosition({
        x: (CROP_SIZE - img.width * scale) / 2,
        y: (CROP_SIZE - img.height * scale) / 2,
      });
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Desenhar preview no canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageEl) return;

    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;

    // Limpar
    ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Fundo escuro
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Clip circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Desenhar imagem
    ctx.drawImage(
      imageEl,
      position.x,
      position.y,
      imageEl.width * zoom,
      imageEl.height * zoom
    );

    ctx.restore();

    // Overlay escuro fora do círculo
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Borda do círculo
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [imageEl, zoom, position]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // Zoom handler
  const handleZoom = (newZoom: number) => {
    if (!imageEl) return;
    const centerX = CROP_SIZE / 2;
    const centerY = CROP_SIZE / 2;

    // Manter centro ao fazer zoom
    const imgCenterX = (centerX - position.x) / zoom;
    const imgCenterY = (centerY - position.y) / zoom;

    setZoom(newZoom);
    setPosition({
      x: centerX - imgCenterX * newZoom,
      y: centerY - imgCenterY * newZoom,
    });
  };

  // Gerar crop final
  const handleCrop = async () => {
    if (!imageEl) return;
    setProcessing(true);

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = OUTPUT_SIZE;
    outputCanvas.height = OUTPUT_SIZE;
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) return;

    // Escalar de CROP_SIZE para OUTPUT_SIZE
    const scale = OUTPUT_SIZE / CROP_SIZE;

    // Clip circular
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      imageEl,
      position.x * scale,
      position.y * scale,
      imageEl.width * zoom * scale,
      imageEl.height * zoom * scale
    );

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob);
        }
        setProcessing(false);
      },
      "image/png",
      1
    );
  };

  // Calcular limites do zoom
  const minZoom = imageEl
    ? Math.max(CROP_SIZE / imageEl.width, CROP_SIZE / imageEl.height) * 0.5
    : 0.1;
  const maxZoom = minZoom * 8;

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              ✂️ Ajustar foto
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Arraste para posicionar e use o zoom para ajustar
          </p>
        </div>

        {/* Canvas */}
        <div className="flex justify-center py-6 bg-gray-50">
          <div
            ref={containerRef}
            className="relative cursor-grab active:cursor-grabbing select-none"
            style={{
              width: CROP_SIZE,
              height: CROP_SIZE,
              borderRadius: "50%",
              overflow: "hidden",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <canvas
              ref={canvasRef}
              width={CROP_SIZE}
              height={CROP_SIZE}
              className="rounded-full"
              style={{ touchAction: "none" }}
            />
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <input
              type="range"
              min={minZoom}
              max={maxZoom}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="flex-1 h-2 accent-violet-600"
            />
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleCrop}
            disabled={processing}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {processing ? "Processando..." : "Cortar e Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
