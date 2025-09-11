import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  isProcessing?: boolean;
}

export default function UploadZone({ onFileUpload, isProcessing = false }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, anexe um arquivo .xlsx válido.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive"
      });
      return;
    }

    onFileUpload(file);
  }, [onFileUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <div className="fixed top-4 right-4 z-10">
      <Button 
        variant="outline" 
        disabled={isProcessing}
        className="relative shadow-sm bg-background/80 backdrop-blur-sm border-border/50"
        size="sm"
      >
        {isProcessing ? (
          <div className="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        {isProcessing ? 'Processando...' : 'Selecionar arquivo'}
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileInput}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
      </Button>
    </div>
  );
}