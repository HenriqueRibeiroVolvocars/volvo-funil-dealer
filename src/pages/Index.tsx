import { useState, useMemo } from 'react';
import UploadZone from '@/components/UploadZone';
import KpiCards from '@/components/KpiCards';
import SalesFunnel from '@/components/SalesFunnel';
import MultipleFunnels from '@/components/MultipleFunnels';
import GeneralFunnel from '@/components/GeneralFunnel';
import FilterBar from '@/components/FilterBar';
import { processExcelFile, ProcessedData } from '@/utils/excelProcessor';
import { applyFilters, FilterOptions } from '@/utils/dataFilters';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

export default function Index() {
  const [originalData, setOriginalData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { start: null, end: null },
    selectedDealers: []
  });
  const { toast } = useToast();

  // Aplicar filtros aos dados originais
  const data = useMemo(() => {
    if (!originalData) return null;
    return applyFilters(originalData, filters);
  }, [originalData, filters]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    console.log('🚀 Iniciando upload do arquivo:', file.name);

    try {
      const processedData = await processExcelFile(file);
      setOriginalData(processedData);
      
      console.log('✅ Processamento concluído com sucesso!');
      
            toast({
              title: "Planilha processada com sucesso!",
              description: `${processedData.leads} leads analisados. Verifique as métricas abaixo.`
            });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao processar arquivo';
      console.error('❌ Erro no upload:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Erro ao processar planilha",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Funil Comercial – Volvo
            </h1>
            <p className="text-muted-foreground text-lg">
              Leads · Test-drives · Veículos faturados
            </p>
          </div>
        </div>
      </header>

      {/* Período de Análise - Canto superior direito */}
      {data?.period.start && data?.period.end && (
        <div className="fixed top-4 right-4 z-20 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">
            Período: {data.period.start.toLocaleDateString('pt-BR')} a {data.period.end.toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      {/* Botão Upload - Canto superior direito */}
      {!originalData && (
        <UploadZone 
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
        />
      )}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Filtros */}
          {originalData && !error && (
            <FilterBar
              dealers={originalData.dealers}
              filters={filters}
              onFiltersChange={setFilters}
              originalPeriod={originalData.period}
            />
          )}

          {/* Error Display */}
          {error && (
            <section>
              <div className="funnel-card border-destructive/20 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-destructive mb-1">
                      Erro no processamento
                    </h3>
                    <p className="text-sm text-destructive/80">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Results Section */}
          {data && !error && (
            <>
              {/* General Funnel */}
              <section>
                <GeneralFunnel data={{
                  totalLeads: data.leads,
                  totalStoreVisits: 0, // Não disponível nos dados atuais
                  totalTestDrives: data.testDrives,
                  totalSales: data.faturados
                }} />
              </section>

              {/* KPI Cards */}
              <section>
                <KpiCards data={{
                  avgLeadToTestDrive: data.avgLeadToTestDrive,
                  avgTestDriveToFaturamento: data.avgTestDriveToFaturamento,
                  avgTotalJourney: data.avgTotalJourney,
                  avgLeadToFaturamento: data.avgLeadToFaturamento,
                  leads: data.leads,
                  testDrives: data.testDrives,
                  faturados: data.faturados,
                  decidedLeadsCount: data.decidedLeadsCount,
                  decidedLeadsPercentage: data.decidedLeadsPercentage,
                  leadsFaturadosCount: data.leadsFaturadosCount,
                  funnelMetrics: data.funnelMetrics
                }} />
              </section>

              {/* Multiple Funnels */}
              <section>
                <MultipleFunnels data={data.funnelMetrics} />
              </section>
            </>
          )}

          {/* Instructions */}
          {!originalData && !error && !isProcessing && (
            <section>
              <div className="funnel-card bg-secondary/30">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Como usar
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5 flex-shrink-0">1</span>
                    Anexe um arquivo .xlsx com os cabeçalhos exatos nas colunas
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5 flex-shrink-0">2</span>
                    O sistema detecta automaticamente a aba com os dados
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5 flex-shrink-0">3</span>
                    As métricas serão calculadas e exibidas automaticamente
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}