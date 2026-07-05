import React, { useState } from 'react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Trash2, Layers, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ProcessedFile } from '../types';
import ResultCard from './ResultCard';

interface HistoryListProps {
  files: ProcessedFile[];
  onDeleteFile: (id: string) => void;
  onClearAll: () => void;
}

export default function HistoryList({
  files,
  onDeleteFile,
  onClearAll,
}: HistoryListProps) {
  const [isZipping, setIsZipping] = useState(false);

  const successFiles = files.filter((f) => f.status === 'success');
  const errorFiles = files.filter((f) => f.status === 'error');
  const totalFiles = files.length;

  const handleDownloadAllZip = async () => {
    if (successFiles.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      
      // Adding compressed blobs to the zip
      successFiles.forEach((file) => {
        if (file.compressedBlob) {
          zip.file(file.outputName, file.compressedBlob);
        }
      });

      const zipContent = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipContent);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `webp-smart-compressor-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Gagal membuat file ZIP:", error);
      alert("Terjadi kesalahan saat memaketkan file ZIP. Silakan unduh gambar secara individual.");
    } finally {
      setIsZipping(false);
    }
  };

  if (totalFiles === 0) {
    return null;
  }

  return (
    <div className="w-full mt-6 space-y-4" id="history-list-wrapper">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-slate-800 text-sm md:text-base">
              Riwayat Proses Gambar Sesi Ini
            </h3>
            <p className="text-xs text-slate-400">
              {successFiles.length} sukses &bull; {errorFiles.length} gagal &bull; Total {totalFiles} file
            </p>
          </div>
        </div>

        {/* Dynamic Buttons */}
        <div className="flex items-center gap-2">
          {successFiles.length > 0 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-sm shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              id="download-all-zip-btn"
            >
              {isZipping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengompresi ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Semua (.ZIP)</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onClearAll}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-100 rounded-xl transition-all"
            id="clear-all-history-btn"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Semua</span>
          </button>
        </div>
      </div>

      {/* Grid of processed card items */}
      <div className="space-y-3" id="history-items-container">
        <AnimatePresence mode="popLayout">
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            >
              <ResultCard file={file} onDelete={onDeleteFile} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
