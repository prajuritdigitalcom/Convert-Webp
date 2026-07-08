import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, AlertCircle, FileWarning, Check } from 'lucide-react';
import { AdminSettings } from '../types';

interface UploadAreaProps {
  settings: AdminSettings;
  onFilesSelected: (files: File[]) => void;
  onValidationError: (error: string) => void;
}

export default function UploadArea({
  settings,
  onFilesSelected,
  onValidationError,
}: UploadAreaProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported extensions
  const ALLOWED_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff', 'tif', 'heic', 'svg'
  ];

  // Blocked extensions
  const BLOCKED_EXTENSIONS = [
    'pdf', 'doc', 'docx', 'mp4', 'zip', 'rar', 'exe', 'msi', 'tar', 'gz'
  ];

  const validateAndProcessFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const files = Array.from(fileList);
    
    // Rule 1: Max 50 files
    if (files.length > 50) {
      onValidationError(`Jumlah berkas melebihi batas! Maksimal 50 file dapat diunggah sekaligus.`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const sizeMb = file.size / (1024 * 1024);

      // Check blocked list
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        errors.push(`Format file "${file.name}" tidak didukung (${ext.toUpperCase()} ditolak).`);
        return;
      }

      // Check size
      if (sizeMb > settings.maxUploadSizeMb) {
        errors.push(`File "${file.name}" melebihi ukuran maksimum (${settings.maxUploadSizeMb} MB).`);
        return;
      }

      // Check allowed list
      if (!ALLOWED_EXTENSIONS.includes(ext) && file.type && !file.type.startsWith('image/')) {
        errors.push(`File "${file.name}" bukan merupakan gambar yang didukung.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      onValidationError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full mb-8" id="upload-area-wrapper">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,.tiff,.tif,.heic,.svg,image/*"
        id="file-upload-input"
      />

      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={`relative w-full border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-primary-500 bg-primary-50/40 shadow-inner'
            : 'border-slate-200 bg-white hover:border-primary-400 hover:shadow-xs'
        }`}
        id="drag-and-drop-container"
      >
        <div className="flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
          {/* Animated Icon Circle */}
          <div className={`p-4 rounded-full transition-colors ${
            isDragActive ? 'bg-primary-100 text-primary-600' : 'bg-slate-50 text-slate-400 group-hover:text-primary-500'
          }`}>
            <Upload className={`w-8 h-8 ${isDragActive ? 'animate-bounce' : ''}`} />
          </div>

          <div className="space-y-2">
            <h3 className="font-sans font-semibold text-slate-800 text-base md:text-lg">
              Tarik &amp; Lepaskan Gambar ke Sini
            </h3>
            <p className="text-xs md:text-sm text-slate-500">
              atau <span className="text-primary-600 font-semibold underline decoration-2 decoration-primary-200">pilih berkas gambar</span> dari perangkat Anda
            </p>
          </div>

          {/* Badge list of supported formats */}
          <div className="flex flex-wrap justify-center gap-1.5 pt-2" id="supported-formats-badges">
            {ALLOWED_EXTENSIONS.map((ext) => (
              <span 
                key={ext}
                className="text-[10px] font-mono font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase"
              >
                {ext}
              </span>
            ))}
          </div>

          {/* Footer constraints */}
          <div className="text-[10px] text-slate-400 pt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 border-t border-slate-100 w-full">
            <span>Maksimal {settings.maxUploadSizeMb} MB per file</span>
            <span className="hidden sm:inline text-slate-200">|</span>
            <span>Maksimal 50 file sekaligus</span>
            <span className="hidden sm:inline text-slate-200">|</span>
            <span className="text-emerald-600 font-medium">Output otomatis ke .WebP</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
