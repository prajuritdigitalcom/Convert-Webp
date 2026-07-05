import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Trash2, CheckCircle2, AlertTriangle, 
  ChevronDown, ChevronUp, Image as ImageIcon, Sparkles 
} from 'lucide-react';
import { ProcessedFile } from '../types';

interface ResultCardProps {
  file: ProcessedFile;
  onDelete: (id: string) => void;
}

export default function ResultCard({ file, onDelete }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1 || e.type === 'mousemove') {
      handleSliderMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const isSuccess = file.status === 'success';
  const isError = file.status === 'error';
  const isProcessing = file.status === 'converting' || file.status === 'compressing';

  return (
    <div 
      className={`w-full bg-white border rounded-2xl overflow-hidden shadow-xs transition-all ${
        isError 
          ? 'border-rose-100 hover:border-rose-200 bg-rose-50/10' 
          : isSuccess 
            ? 'border-slate-100 hover:border-indigo-100' 
            : 'border-slate-100 animate-pulse'
      }`}
      id={`result-card-${file.id}`}
    >
      {/* Top Main Row */}
      <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left column: Thumbnail and Names */}
        <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
          <div className="relative w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
            {isSuccess && file.compressedUrl ? (
              <img 
                src={file.compressedUrl} 
                alt={file.outputName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : isSuccess && file.originalUrl ? (
              <img 
                src={file.originalUrl} 
                alt={file.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-300" />
            )}

            {/* Checkmark or exclamation badge */}
            {isSuccess && (
              <div className="absolute bottom-1 right-1 p-0.5 bg-emerald-500 text-white rounded-full">
                <CheckCircle2 className="w-3 h-3" />
              </div>
            )}
            {isError && (
              <div className="absolute bottom-1 right-1 p-0.5 bg-rose-500 text-white rounded-full">
                <AlertTriangle className="w-3 h-3" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 md:flex-initial">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                {file.originalFormat.split('/').pop()}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {file.originalWidth}x{file.originalHeight}
              </span>
            </div>
            <h4 className="font-semibold text-slate-800 text-sm truncate max-w-[240px] md:max-w-[320px]" title={file.name}>
              {file.name}
            </h4>
            {isSuccess && (
              <p className="text-xs text-indigo-500 font-mono font-medium truncate">
                &rarr; {file.outputName}
              </p>
            )}
          </div>
        </div>

        {/* Center column: Metrics (Sizes / Savings) */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 w-full md:w-auto shrink-0 border-t border-slate-50 md:border-0 pt-3 md:pt-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium uppercase">Ukuran Asli</span>
            <span className="text-sm font-semibold text-slate-600 font-mono">{formatSize(file.originalSize)}</span>
          </div>

          {isSuccess && (
            <>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium uppercase">Ukuran Hasil</span>
                <span className="text-sm font-bold text-slate-800 font-mono flex items-center gap-1.5">
                  {formatSize(file.compressedSize || 0)}
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-1 py-0.2 rounded-sm">
                    WebP
                  </span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium uppercase">Efisiensi</span>
                <span className="text-sm font-bold text-emerald-600 font-mono flex items-center gap-1">
                  -{file.savingsPercentage}%
                </span>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="flex flex-col justify-center min-w-[120px]">
              <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase mb-1">
                <span>{file.status === 'converting' ? 'Konversi...' : 'Kompresi...'}</span>
                <span>{file.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {isError && (
            <div className="text-rose-500 text-xs font-semibold max-w-[280px] bg-rose-50/60 px-3 py-1.5 rounded-xl border border-rose-100 leading-normal">
              {file.errorMsg || 'Gagal memproses gambar.'}
            </div>
          )}
        </div>

        {/* Right column: Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t border-slate-50 md:border-0 pt-3 md:pt-0 shrink-0">
          {isSuccess && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                title="Bandingkan visual sebelum/sesudah"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Tutup</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Bandingkan</span>
                  </>
                )}
              </button>

              <a
                href={file.compressedUrl || undefined}
                download={file.outputName}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs hover:shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>
            </>
          )}

          <button
            onClick={() => onDelete(file.id)}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
            title="Hapus dari riwayat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Before/After Split Viewer */}
      <AnimatePresence>
        {isExpanded && isSuccess && file.compressedUrl && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-slate-50 border-t border-slate-100"
          >
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gerakkan slider di bawah untuk membandingkan kualitas visual</span>
                </div>
                <div className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                  Rasio Resize: {file.resizedRatio === 1 ? '100% (Asli)' : `${Math.round((file.resizedRatio || 1) * 100)}%`} | Kualitas WebP: {file.qualityUsed}%
                </div>
              </div>

              {/* Interactive Slide Comparison Screen */}
              <div 
                ref={sliderContainerRef}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative h-[240px] md:h-[400px] w-full rounded-2xl border border-slate-200 overflow-hidden cursor-ew-resize select-none bg-slate-100"
                id={`slider-box-${file.id}`}
              >
                {/* Before (Original) - Left half */}
                <div className="absolute inset-0">
                  <img 
                    src={file.originalUrl} 
                    alt="Sebelum" 
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-md">
                    SEBELUM ({file.originalWidth}x{file.originalHeight})
                  </div>
                </div>

                {/* After (Compressed WebP) - Right half (clipped overlay) */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}
                >
                  <img 
                    src={file.compressedUrl} 
                    alt="Sesudah" 
                    className="w-full h-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-xs text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-md">
                    SESUDAH ({file.compressedWidth}x{file.compressedHeight})
                  </div>
                </div>

                {/* Sliding separator bar */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white hover:bg-indigo-300 transition-colors shadow-lg cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  {/* Handle buttons */}
                  <div className="w-8 h-8 bg-white text-indigo-600 border-2 border-indigo-200 rounded-full flex items-center justify-center shadow-md shrink-0">
                    <span className="font-bold text-xs select-none">&harr;</span>
                  </div>
                </div>
              </div>

              {/* Info summary inside slider */}
              <div className="grid grid-cols-2 gap-4 text-center border border-slate-100 rounded-xl p-3 bg-white">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Resolusi Asli</span>
                  <span className="text-xs font-semibold text-slate-700 font-mono">{file.originalWidth} x {file.originalHeight} piksel</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Resolusi Akhir</span>
                  <span className={`text-xs font-semibold font-mono ${file.resizedRatio !== 1 ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {file.compressedWidth} x {file.compressedHeight} piksel {file.resizedRatio !== 1 && `(${Math.round((file.resizedRatio || 1) * 100)}%)`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
