import React, { useState } from 'react';
import { Settings, BarChart3, Sliders, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { AdminSettings, AdminStats } from '../types';

interface AdminDashboardProps {
  settings: AdminSettings;
  onChangeSettings: (settings: AdminSettings) => void;
  stats: AdminStats;
  onResetStats: () => void;
}

export default function AdminDashboard({
  settings,
  onChangeSettings,
  stats,
  onResetStats,
}: AdminDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'settings'>('stats');

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleToggleResize = () => {
    onChangeSettings({
      ...settings,
      autoResizeEnabled: !settings.autoResizeEnabled,
    });
  };

  const handleMaxOutputChange = (val: number) => {
    onChangeSettings({
      ...settings,
      maxOutputSizeKb: Math.max(1, val),
    });
  };

  const handleMinQualityChange = (val: number) => {
    onChangeSettings({
      ...settings,
      minQuality: Math.min(90, Math.max(10, val)),
    });
  };

  const handleMaxUploadChange = (val: number) => {
    onChangeSettings({
      ...settings,
      maxUploadSizeMb: Math.max(1, val),
    });
  };

  const totalSaved = Math.max(0, stats.totalOriginalSize - stats.totalCompressedSize);
  const savingsPercent = stats.totalOriginalSize > 0 
    ? Math.round((totalSaved / stats.totalOriginalSize) * 100) 
    : 0;

  return (
    <div className="w-full bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6" id="admin-dashboard-container">
      {/* Header Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        id="dashboard-header-trigger"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Sliders className="w-5 h-5" id="dashboard-icon" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-slate-800 text-sm md:text-base">
              Dashboard Admin &amp; Pengaturan Kontrol
            </h3>
            <p className="text-xs text-slate-400">
              Ubah parameter kompresi, lihat performa bandwith, &amp; monitoring data secara real-time
            </p>
          </div>
        </div>
        <button 
          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/60 rounded-lg hover:bg-indigo-100 transition-colors"
          id="toggle-dashboard-btn"
        >
          {isOpen ? 'Sembunyikan' : 'Buka Dashboard'}
        </button>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="border-t border-slate-100 p-6 bg-slate-50/30" id="dashboard-expanded-body">
          {/* Internal Tabs */}
          <div className="flex border-b border-slate-100 pb-4 mb-5 gap-2" id="dashboard-tabs">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
              id="tab-stats-btn"
            >
              <BarChart3 className="w-4 h-4" />
              Statistik Performa
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
              id="tab-settings-btn"
            >
              <Settings className="w-4 h-4" />
              Parameter Kompresor
            </button>
          </div>

          {/* Tab 1: Statistics */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fade-in" id="stats-tab-content">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat Card 1 */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
                  <span className="text-xs font-medium text-slate-400 block mb-1">Total Gambar Diproses</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800 font-mono">{stats.totalProcessed}</span>
                    <span className="text-xs font-medium text-emerald-500">file</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: stats.totalProcessed > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
                  <span className="text-xs font-medium text-slate-400 block mb-1">Total Bandwidth Hemat</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800 font-mono">{formatSize(totalSaved)}</span>
                    {savingsPercent > 0 && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
                        {savingsPercent}%
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${savingsPercent}%` }}></div>
                  </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
                  <span className="text-xs font-medium text-slate-400 block mb-1">Pengguna Aktif Hari Ini</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800 font-mono">{stats.totalUsersToday}</span>
                    <span className="text-xs font-medium text-slate-400">sesi</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
                  <span className="text-xs font-medium text-slate-400 block mb-1">Storage Browser Terpakai</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800 font-mono">{formatSize(stats.totalCompressedSize)}</span>
                    <span className="text-xs font-medium text-slate-400">RAM/Local</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: stats.totalCompressedSize > 0 ? '40%' : '0%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-indigo-50/50 rounded-xl p-4 border border-indigo-50/80">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-indigo-800 block">Informasi Penyimpanan Efemeral</span>
                    <span className="text-[11px] text-indigo-600 max-w-2xl block leading-relaxed">
                      Sesuai dengan standard privasi WebP Smart Compressor, seluruh pemrosesan dilakukan sepenuhnya di dalam browser pengguna (Client-Side). Gambar asli maupun hasil tidak diunggah ke server database cloud, sehingga menghemat bandwidth server dan menjaga keamanan kerahasiaan dokumen Anda.
                    </span>
                  </div>
                </div>
                <button
                  onClick={onResetStats}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs shrink-0"
                  id="reset-stats-btn"
                  title="Reset statistik sesi sementara"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Sesi
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Settings */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" id="settings-tab-content">
              {/* Box 1: Output Constraints */}
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Batas Dimensi &amp; Output Size</h4>
                
                {/* Max Size Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-700">Target Maksimal Output Size (KB)</label>
                    <span className="text-xs font-bold text-indigo-600 font-mono">{settings.maxOutputSizeKb} KB</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={settings.maxOutputSizeKb}
                      onChange={(e) => handleMaxOutputChange(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <input
                      type="number"
                      min="1"
                      max="5000"
                      value={settings.maxOutputSizeKb}
                      onChange={(e) => handleMaxOutputChange(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-xs text-center font-mono font-semibold text-slate-700 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Batas maksimum ukuran file final yang diizinkan (Standard PRD: 100 KB).
                  </p>
                </div>

                {/* Min Quality Input */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-700">Batas Kualitas Minimum (%)</label>
                    <span className="text-xs font-bold text-indigo-600 font-mono">{settings.minQuality}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={settings.minQuality}
                      onChange={(e) => handleMinQualityChange(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={settings.minQuality}
                      onChange={(e) => handleMinQualityChange(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-xs text-center font-mono font-semibold text-slate-700 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Kualitas minimum sebelum Smart Resize Engine mengecilkan resolusi gambar (Standard PRD: 40%).
                  </p>
                </div>
              </div>

              {/* Box 2: Resize Engine & Upload Policy */}
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unggah &amp; Resize Engine</h4>

                {/* Max Upload Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-700">Maksimum Ukuran File Upload (MB)</label>
                    <span className="text-xs font-bold text-indigo-600 font-mono">{settings.maxUploadSizeMb} MB</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={settings.maxUploadSizeMb}
                      onChange={(e) => handleMaxUploadChange(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={settings.maxUploadSizeMb}
                      onChange={(e) => handleMaxUploadChange(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-xs text-center font-mono font-semibold text-slate-700 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Membatasi ukuran dokumen mentah yang dapat diunggah (Standard PRD: 20 MB).
                  </p>
                </div>

                {/* Auto Resize Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 mt-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-700 block">Smart Resize Engine</span>
                    <span className="text-[10px] text-slate-400 block max-w-xs leading-normal">
                      Kecilkan resolusi otomatis jika kualitas minimum ({settings.minQuality}%) tercapai tapi ukuran file masih &gt; {settings.maxOutputSizeKb} KB.
                    </span>
                  </div>
                  <button
                    onClick={handleToggleResize}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.autoResizeEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                    id="toggle-resize-switch"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        settings.autoResizeEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
