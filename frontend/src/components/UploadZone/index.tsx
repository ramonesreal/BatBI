import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  loading: boolean;
}

export default function UploadZone({ onFileSelected, loading }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constante limite para segurança da engine: 100MB
  const MAX_FILE_SIZE_MB = 100;

  // Função centralizada para validação de integridade do arquivo
  const validarESelecionarArquivo = (file: File) => {
    setErroLocal(null);

    // 1. Validação Estrita de Extensão / Tipo Mime
    const temExtensaoCsv = file.name.toLowerCase().endsWith('.csv');
    const temMimeCsv = file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';

    if (!temExtensaoCsv && !temMimeCsv) {
      setErroLocal('Formato inválido. Por favor, envie apenas arquivos delimitados por vírgula (.csv).');
      return;
    }

    // 2. Validação Estrita de Tamanho do Dataset (Prevenção de estouro de memória)
    const tamanhoEmMB = file.size / (1024 * 1024);
    if (tamanhoEmMB > MAX_FILE_SIZE_MB) {
      setErroLocal(`O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB. Reduza o dataset para processamento.`);
      return;
    }

    // Passa no teste -> Dispara para o componente pai
    onFileSelected(file);
  };

  // 1. Ativado quando o arquivo entra/está sobre a área de drop
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // 2. Ativado quando o usuário solta o arquivo na área
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (loading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validarESelecionarArquivo(e.dataTransfer.files[0]);
    }
  };

  // 3. Ativado se o usuário preferir clicar em vez de arrastar
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (loading) return;

    if (e.target.files && e.target.files[0]) {
      validarESelecionarArquivo(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4 w-full">
      {/* ⚠️ Feedback visual integrado de erro sem alert() nativo */}
      {erroLocal && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3.5 text-xs text-red-400 flex items-center gap-2 animate-fade-in">
          <span>⚠️</span>
          <p className="font-medium">{erroLocal}</p>
        </div>
      )}

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`
          flex flex-col items-center justify-center min-h-[260px] rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-yellow-500 bg-yellow-500/10 scale-[1.01]'
            : 'border-gray-800 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50'
          }
          ${loading ? 'opacity-50 pointer-events-none border-yellow-600/30 bg-gray-900/20 cursor-wait' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />

        <div className={`text-5xl mb-4 select-none transition-transform ${isDragActive ? 'animate-bounce' : ''}`}>
          {loading ? '⚙️' : '📥'}
        </div>

        {loading ? (
          <>
            <p className="text-base font-medium text-yellow-500 animate-pulse">Processando dados na Caverna...</p>
            <p className="text-xs text-gray-500 mt-1">O motor analítico em Python está decodificando o arquivo.</p>
          </>
        ) : (
          <>
            <p className="text-base font-medium text-gray-300">
              {isDragActive ? 'Solte o arquivo para iniciar' : 'Arraste seu arquivo .csv aqui'}
            </p>
            <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
              Ou <span className="text-yellow-500 underline font-medium">procure no computador</span>. Arquivos delimitados por vírgula até {MAX_FILE_SIZE_MB}MB.
            </p>
          </>
        )}
      </div>
    </div>
  );
}