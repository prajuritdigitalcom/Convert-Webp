import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, 
  HelpCircle, Info, Library, Layers, ChevronRight, X 
} from 'lucide-react';

import { ProcessedFile, AdminSettings, AdminStats } from './types';
import { processSingleImage, getWebpFilename } from './lib/imageProcessor';
import AdminDashboard from './components/AdminDashboard';
import UploadArea from './components/UploadArea';
import HistoryList from './components/HistoryList';

const DEFAULT_SETTINGS: AdminSettings = {
  maxOutputSizeKb: 100,
  minQuality: 40,
  maxUploadSizeMb: 20,
  autoResizeEnabled: true,
};

const DEFAULT_STATS: AdminStats = {
  totalProcessed: 0,
  totalOriginalSize: 0,
  totalCompressedSize: 0,
  totalUsersToday: 24, // simulated default starting count
};

export default function App() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<AdminStats>(DEFAULT_STATS);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  
  // Notice alert banner or error state
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Load configuration and metrics from localStorage on start
  useEffect(() => {
    const savedSettings = localStorage.getItem('webp_compressor_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Gagal memuat pengaturan:", e);
      }
    }

    const savedStats = localStorage.getItem('webp_compressor_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Gagal memuat statistik:", e);
      }
    } else {
      // Create starting session stats
      localStorage.setItem('webp_compressor_stats', JSON.stringify(DEFAULT_STATS));
    }
  }, []);

  // Save settings when modified
  const handleUpdateSettings = (newSettings: AdminSettings) => {
    setSettings(newSettings);
    localStorage.setItem('webp_compressor_settings', JSON.stringify(newSettings));
  };

  // Reset metrics
  const handleResetStats = () => {
    const clearedStats = {
      totalProcessed: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      totalUsersToday: 1,
    };
    setStats(clearedStats);
    localStorage.setItem('webp_compressor_stats', JSON.stringify(clearedStats));
  };

  // Cleanup object URLs on unmount to avoid browser memory leaks
  useEffect(() => {
    return () => {
      processedFiles.forEach(file => {
        if (file.originalUrl) URL.revokeObjectURL(file.originalUrl);
        if (file.compressedUrl) URL.revokeObjectURL(file.compressedUrl);
      });
    };
  }, [processedFiles]);

  // Main file processing handler
  const handleFilesSelected = async (files: File[]) => {
    setGlobalError(null);

    // 1. Map files to initial pending states
    const newItems: ProcessedFile[] = files.map((file) => {
      return {
        id: Math.random().toString(36).substring(2, 11),
        name: file.name,
        outputName: getWebpFilename(file.name),
        originalSize: file.size,
        originalFormat: file.type || file.name.split('.').pop() || 'unknown',
        originalWidth: 0,
        originalHeight: 0,
        compressedSize: null,
        compressedWidth: null,
        compressedHeight: null,
        compressedBlob: null,
        compressedUrl: null,
        originalUrl: '',
        status: 'pending',
        progress: 0,
        errorMsg: null,
        savingsPercentage: null,
        qualityUsed: null,
        resizedRatio: null,
      };
    });

    // 2. Append new pending items to top of history
    setProcessedFiles((prev) => [...newItems, ...prev]);

    // 3. Process items in background sequentially (avoiding browser freezing)
    for (let i = 0; i < files.length; i++) {
      const targetFile = files[i];
      const targetId = newItems[i].id;

      try {
        const result = await processSingleImage(targetFile, settings, (progState) => {
          // Update item's intermediate progress and status
          setProcessedFiles((prev) => 
            prev.map((f) => f.id === targetId ? { ...f, status: progState.status, progress: progState.progress } : f)
          );
        });

        // Update item with successful results
        setProcessedFiles((prev) =>
          prev.map((f) => f.id === targetId ? { ...f, ...result, status: 'success', progress: 100 } : f)
        );

        // Update global performance statistics
        setStats((prev) => {
          const updated = {
            ...prev,
            totalProcessed: prev.totalProcessed + 1,
            totalOriginalSize: prev.totalOriginalSize + targetFile.size,
            totalCompressedSize: prev.totalCompressedSize + (result.compressedSize || 0),
          };
          localStorage.setItem('webp_compressor_stats', JSON.stringify(updated));
          return updated;
        });

      } catch (err: any) {
        // Handle failure
        setProcessedFiles((prev) =>
          prev.map((f) => f.id === targetId ? { 
            ...f, 
            status: 'error', 
            progress: 100, 
            errorMsg: err.message || "Gagal memproses gambar." 
          } : f)
        );
      }
    }
  };

  // Remove individual file from list
  const handleDeleteFile = (id: string) => {
    setProcessedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
        if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // Clear entire list
  const handleClearAll = () => {
    processedFiles.forEach((file) => {
      if (file.originalUrl) URL.revokeObjectURL(file.originalUrl);
      if (file.compressedUrl) URL.revokeObjectURL(file.compressedUrl);
    });
    setProcessedFiles([]);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-700 antialiased" id="app-root-layout">
      {/* Upper Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" id="top-accent-line"></div>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12" id="main-content-stage">
        
        {/* Header Hero Section */}
        <header className="text-center mb-8 md:mb-12 space-y-3" id="main-heading-header">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold" id="brand-badge">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Versi Pro &bull; Client-Side Compressor</span>
          </div>

          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-slate-900 tracking-tight leading-none" id="hero-main-title">
            Convert Semua Gambar Menjadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700">WebP Maksimal 100 KB</span>
          </h1>

          <p className="font-sans text-slate-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed" id="hero-sub-description">
            Unggah gambar format apa saja (JPG, PNG, TIFF, HEIC, dll) dan dapatkan file WebP ringan siap pakai di website Anda tanpa khawatir melebihi batas ukuran berkas.
          </p>
        </header>

        {/* Global Alert Notification Banner */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs md:text-sm"
              id="global-error-banner"
            >
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 whitespace-pre-line leading-relaxed">
                <span className="font-bold">Kesalahan Unggah Berkas:</span>
                <br />
                {globalError}
              </div>
              <button 
                onClick={() => setGlobalError(null)}
                className="text-rose-400 hover:text-rose-600 font-semibold text-xs px-1"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Dashboard / Controller Panel */}
        <AdminDashboard
          settings={settings}
          onChangeSettings={handleUpdateSettings}
          stats={stats}
          onResetStats={handleResetStats}
        />

        {/* File Drag and Drop Upload Box */}
        <UploadArea
          settings={settings}
          onFilesSelected={handleFilesSelected}
          onValidationError={(err) => setGlobalError(err)}
        />

        {/* Processing Queue & Download History */}
        <HistoryList
          files={processedFiles}
          onDeleteFile={handleDeleteFile}
          onClearAll={handleClearAll}
        />

        {/* Frequently Asked Questions (F.A.Q.) Grid to build content density and authority */}
        <section className="mt-16 border-t border-slate-100 pt-12" id="faq-information-section">
          <h3 className="font-display font-bold text-xl text-slate-800 text-center mb-8">
            Cara Kerja &amp; Alur Optimasi Smart Compressor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="faq-grid">
            <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-2">
              <span className="text-xs font-bold text-primary-600 font-mono">LANGKAH 01</span>
              <h4 className="font-semibold text-slate-800 text-sm">Konversi Lossless ke WebP</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Sistem mendeteksi ekstensi gambar mentah, memuat piksel ke kanvas memori, lalu merender ulang gambar langsung ke format WebP modern dengan kualitas optimal (Kualitas 90).
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-2">
              <span className="text-xs font-bold text-primary-600 font-mono">LANGKAH 02</span>
              <h4 className="font-semibold text-slate-800 text-sm">Kompresi Bertingkat Otomatis</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Jika ukuran melampaui batas target ({settings.maxOutputSizeKb} KB), sistem secara iteratif menurunkan rasio kompresi 5 poin hingga menyentuh batas minimum kualitas ({settings.minQuality}%).
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-xs space-y-2">
              <span className="text-xs font-bold text-primary-600 font-mono">LANGKAH 03</span>
              <h4 className="font-semibold text-slate-800 text-sm">Smart Resizing Engine</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Jika file masih &gt; {settings.maxOutputSizeKb} KB pada kualitas {settings.minQuality}%, resolusi gambar diturunkan bertahap (skala 10%) dengan menjaga rasio lebar-tinggi agar tetap tajam dan di bawah 100 KB.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Area */}
      <footer className="bg-white border-t border-slate-100 py-8 px-4 mt-16 text-center" id="main-app-footer">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <p className="font-semibold text-slate-700 flex items-center justify-center md:justify-start gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              WebP Smart Compressor &bull; 100% Privacy Secure
            </p>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} WebP Smart Compressor. Hak Cipta Dilindungi Undang-Undang.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-primary-600 underline cursor-pointer font-medium"
              id="privacy-policy-trigger"
            >
              Kebijakan Privasi &amp; Data Keamanan
            </button>
            <span>&bull;</span>
            <span className="font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded text-slate-500 font-semibold">
              Pemrosesan Offline Lokal (In-Browser)
            </span>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="privacy-policy-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-slate-100"
            >
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                id="close-privacy-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-lg leading-tight">
                      Kebijakan Privasi WebP Smart Compressor
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Keamanan dokumen Anda adalah prioritas mutlak kami
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-3 leading-relaxed max-h-[300px] overflow-y-auto pr-2">
                  <p>
                    <strong className="text-slate-700 block mb-1">1. Tidak Ada Pengunggahan File ke Server Cloud</strong>
                    WebP Smart Compressor bekerja menggunakan teknologi HTML5 Canvas &amp; File System API modern secara <strong>Client-Side</strong>. Seluruh proses mengubah format, mendegradasi kualitas, memperkecil resolusi, serta kompresi dilakukan sepenuhnya di dalam memori internal (RAM) komputer atau ponsel pintar Anda sendiri.
                  </p>
                  <p>
                    <strong className="text-slate-700 block mb-1">2. Perlindungan Rahasia Berkas Bisnis</strong>
                    Karena tidak ada data mentah maupun matang yang ditransfer melalui internet ke server eksternal kami, tidak ada kemungkinan kebocoran dokumen bisnis, foto pribadi, desain produk, maupun materi website sensitif Anda kepada pihak ketiga.
                  </p>
                  <p>
                    <strong className="text-slate-700 block mb-1">3. Penggunaan Cookie &amp; Penyimpanan Sesi</strong>
                    Kami hanya menggunakan <code>localStorage</code> browser lokal untuk menyimpan preferensi konfigurasi kompresor (ukuran output target, kualitas batas bawah) serta data statistik akumulasi sementara (jumlah bandwidth hemat) untuk kenyamanan penggunaan Anda. Data ini dapat Anda hapus seutuhnya kapan saja melalui tombol "Reset Sesi" di bagian dashboard admin.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-primary-100"
                    id="accept-privacy-btn"
                  >
                    Saya Mengerti &amp; Setuju
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
