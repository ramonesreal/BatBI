import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import type { DragEvent, ChangeEvent } from 'react';

interface UploadZoneProps { onFileSelected: (file: File) => void; loading: boolean; }

const MAX_FILE_SIZE_MB = 100;

export default function UploadZone({ onFileSelected, loading }: UploadZoneProps) {
  const { t } = useTranslation();
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError]     = useState<string | null>(null);
  const fileInputRef                    = React.useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setLocalError(null);
    const hasCsvExtension = file.name.toLowerCase().endsWith('.csv');
    const hasCsvMime      = file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
    if (!hasCsvExtension && !hasCsvMime) { setLocalError(t('upload.errorFormat')); return; }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) { setLocalError(t('upload.errorSize', { max: MAX_FILE_SIZE_MB })); return; }
    onFileSelected(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (loading) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (loading) return;
    if (e.dataTransfer.files?.[0]) validateAndSelect(e.dataTransfer.files[0]);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (loading) return;
    if (e.target.files?.[0]) validateAndSelect(e.target.files[0]);
  };

  const onBrowseClick = () => { if (!loading) fileInputRef.current?.click(); };

  return (
    <div className="space-y-4 w-full">
      {localError && (
        <div role="alert" className="rounded-xl border border-red-900/40 bg-red-950/20 p-3.5 text-xs text-red-400 flex items-center gap-2 animate-fade-in">
          <span aria-hidden="true">⚠️</span>
          <p className="font-medium">{localError}</p>
        </div>
      )}
      <div id="upload-drop-zone" onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag}
        onDrop={handleDrop} onClick={onBrowseClick} role="button" tabIndex={0}
        aria-label={t('upload.ariaLabel')}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onBrowseClick(); }}
        className={`flex flex-col items-center justify-center min-h-[260px] rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-yellow-500 bg-yellow-500/10 scale-[1.01]' : 'border-gray-800 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50'}
          ${loading ? 'opacity-50 pointer-events-none border-yellow-600/30 bg-gray-900/20 cursor-wait' : ''}`}>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} disabled={loading} aria-hidden="true" />
        <div className={`text-5xl mb-4 select-none transition-transform ${isDragActive ? 'animate-bounce' : ''}`}>
          {loading ? '⚙️' : '📥'}
        </div>
        {loading ? (
          <>
            <p className="text-base font-medium text-yellow-500 animate-pulse">{t('upload.loading')}</p>
            <p className="text-xs text-gray-500 mt-1">{t('upload.loadingDetail')}</p>
          </>
        ) : (
          <>
            <p className="text-base font-medium text-gray-300">
              {isDragActive ? t('upload.dropActive') : t('upload.dropIdle')}
            </p>
            <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
              <Trans i18nKey="upload.browseHint" values={{ max: MAX_FILE_SIZE_MB }}
                components={[<span className="text-yellow-500 underline font-medium" />]}>
                Or <span className="text-yellow-500 underline font-medium">browse your computer</span>. Files up to {{max: MAX_FILE_SIZE_MB}} MB.
              </Trans>
            </p>
          </>
        )}
      </div>
    </div>
  );
}