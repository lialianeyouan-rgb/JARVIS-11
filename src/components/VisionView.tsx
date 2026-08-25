/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, Camera, Scan, CheckCircle2, ShieldAlert, Upload } from 'lucide-react';

export const VisionView: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setSelectedImage(uploadEvent.target?.result as string);
      runVisionAnalysis(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const runVisionAnalysis = (_imgData: string) => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult("Analyse optique terminée. Aucun intrus détecté. Paramètres de l'armure nominales. Flux vidéo sécurisé par chiffrement quantique.");
    }, 1800);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-black text-amber-100 font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-amber-300 flex items-center gap-2">
            <Eye className="w-6 h-6 text-amber-400" />
            <span>VISION & OCR // SCANNER OPTIQUE</span>
          </h2>
          <p className="text-xs text-amber-500/70 mt-1">Analyse d'images en temps réel, reconnaissance optique de caractères (OCR) et détection de menaces visuelles.</p>
        </div>
        <label className="cursor-pointer px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-all flex items-center space-x-2 text-xs">
          <Upload className="w-4 h-4" />
          <span>IMPORTER UNE IMAGE / CAPTURE</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Feed Preview */}
        <div className="bg-zinc-950/70 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
          <div className="absolute inset-0 border border-amber-500/20 pointer-events-none flex flex-col justify-between p-3">
            <div className="flex justify-between text-[10px] text-amber-400/60">
              <span>[OPTICAL_STREAM_ACTIVE]</span>
              <span>HD 1080P // 60 FPS</span>
            </div>
            <div className="flex justify-between text-[10px] text-amber-400/60">
              <span>LATENCY: 12ms</span>
              <span>TARGET LOCK: ENGAGED</span>
            </div>
          </div>

          {selectedImage ? (
            <div className="relative w-full h-64 flex items-center justify-center">
              <img src={selectedImage} alt="Uploaded Feed" className="max-h-60 rounded border border-amber-500/40 object-contain" />
              {isScanning && (
                <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center backdrop-blur-xs">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold animate-pulse">
                    <Scan className="w-6 h-6 animate-spin text-amber-400" />
                    <span>ANALYSE OPTIQUE EN COURS...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3 py-12">
              <Camera className="w-16 h-16 text-amber-500/40 mx-auto animate-pulse" />
              <p className="text-sm text-zinc-400">Aucun flux visuel actif. Importez une image ou activez la caméra.</p>
              <button
                onClick={() => {
                  setSelectedImage("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80");
                  runVisionAnalysis("mock");
                }}
                className="px-4 py-2 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-500/30"
              >
                SIMULER UN SCAN DE SÉCURITÉ
              </button>
            </div>
          )}
        </div>

        {/* Scan Results Panel */}
        <div className="bg-zinc-950/70 border border-amber-500/30 rounded-xl p-5 backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-amber-300 border-b border-amber-500/20 pb-3 flex items-center gap-2">
              <Scan className="w-4 h-4 text-cyan-400" />
              <span>RAPPORT D'ANALYSE VISUELLE & OCR</span>
            </h3>

            {scanResult ? (
              <div className="p-4 rounded-lg bg-zinc-900 border border-emerald-500/30 text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>DIAGNOSTIC VISUEL VALIDÉ</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{scanResult}</p>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                En attente d'un flux ou d'une image à analyser...
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-amber-500/20 text-xs text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-400" /> Filtrage des données sensibles</span>
            <span className="text-emerald-400 font-bold">ACTIF</span>
          </div>
        </div>
      </div>
    </div>
  );
};
