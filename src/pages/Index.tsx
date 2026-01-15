import { useState, useMemo, useEffect } from 'react';
import UploadZone from '@/components/UploadZone';
import KpiCards from '@/components/KpiCards';
import * as React from "react";
import SalesFunnel from '@/components/SalesFunnel';
import MultipleFunnels from '@/components/MultipleFunnels';
import GeneralFunnel from '@/components/GeneralFunnel';
import DealersComparison from '@/components/DealersComparison';
import FilterBar from '@/components/FilterBar';
import { processExcelFile, processApiAndExcel } from '@/utils/excelProcessor';
import { ProcessedData } from '@/utils/types';
import { applyFilters, FilterOptions } from '@/utils/dataFilters';
import { calculateDealerComparison } from '@/utils/dealerMetrics';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToPDF } from '@/utils/pdfExporter';
import { UserMenu } from '@/components/UserMenu';

export default function Index() {
  const [originalData, setOriginalData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<"parcial" | "carregando" | "completo">("parcial");
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { start: null, end: null },
    selectedDealers: []
  });
  const { toast } = useToast();

  // Carregar dados automaticamente da API ao iniciar
  useEffect(() => {
    const loadApiData = async () => {
      setIsProcessing(true);
      try {
        const result = await processApiAndExcel({ onStatusChange: setLoadingStatus });
        setOriginalData(result);
      } catch (err) {
        console.error('Erro ao carregar dados via API:', err);
      } finally {
        setIsProcessing(false);
      }
    };

    loadApiData();
  }, []);

  const handleExportPDF = async () => {
    try {
      await exportToPDF('dashboard-content');
      toast({
        title: "PDF exportado com sucesso!",
        description: "O arquivo foi baixado para sua pasta de downloads."
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar PDF",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    }
  };

  // Estado e handler para upload específico de Sheet5 (visitas)
  const [isUploadingVisits, setIsUploadingVisits] = useState(false);

  const handleVisitsUpload = async (file: File) => {
    setIsUploadingVisits(true);
    setError(null);
    try {
    // Re-processa as APIs junto com o arquivo de visitas (sheet5)
    const result = await processApiAndExcel(undefined, file);
      setOriginalData(result);
      toast({
        title: 'Visitas importadas com sucesso',
        description: `Visitas: ${result.totalStoreVisits ?? 0}`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao importar visitas';
      console.error('❌ Erro no upload de visitas:', errorMessage);
      setError(errorMessage);
      toast({ title: 'Erro ao importar visitas', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsUploadingVisits(false);
    }
  };

  // Aplicar filtros aos dados originais
  const data = useMemo(() => {
    if (!originalData) return null;
    return applyFilters(originalData, filters);
  }, [originalData, filters]);

  // Dados BR para o período selecionado (sem filtro de dealer)
  const brDataForPeriod = useMemo(() => {
    if (!originalData) return null;
    return applyFilters(originalData, {
      dateRange: filters.dateRange,
      selectedDealers: [] // Sem filtro de dealer para manter baseline nacional
    });
  }, [originalData, filters.dateRange]);

  // Calcular dados de comparação de dealers (apenas quando não há filtros de dealer)
  const dealerComparison = useMemo(() => {
    if (!originalData || filters.selectedDealers.length > 0) return null;
    const result = calculateDealerComparison(originalData, filters);
    console.info('🔁 dealerComparison recalculado', {
      start: filters.dateRange.start,
      end: filters.dateRange.end,
      br: {
        leads: result.brMetrics.leads,
        testDrives: result.brMetrics.testDrives,
        sales: result.brMetrics.sales,
        leadToTD: result.brMetrics.leadsToTestDriveRate,
        tdToSales: result.brMetrics.testDriveToSalesRate
      }
    });
    return result;
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
      <div id="dashboard-content">
      {/* Header */}
      <header className="bg-card border-b border-border relative">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Funil Comercial – Volvo
            </h1>
            <p className="text-muted-foreground text-lg">
              Leads · Test-drives · Veículos faturados
            </p>
          </div>
          
          {/* User Menu - Top Right */}
          <div className="absolute top-4 right-4">
            <UserMenu />
          </div>
          
          {/* Período e Export PDF no header (com botão Importar Visitas acima) */}
          <div className="absolute top-4 left-4 space-y-2">
            {originalData && (
              <UploadZone
                onFileUpload={handleVisitsUpload}
                isProcessing={isUploadingVisits}
                label="Importar Visitas (Excel)"
              />
            )}

            {data?.period.start && data?.period.end && (
              <div>
                <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-md mb-2">
                  <p className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    Período: {data.period.start.toLocaleDateString('pt-BR')} a {data.period.end.toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 bg-background border-border shadow-md hover:bg-accent"
                >
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Botão Upload - Canto superior direito */}
      {!originalData && (
        <UploadZone 
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
        />
      )}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {loadingStatus === "carregando" && (
            <div className="text-sm text-muted-foreground text-center py-2">
              ⏳ Carregando dados completos do ano...
            </div>
          )}
          {loadingStatus === "completo" && (
            <div className="text-sm text-green-600 text-center py-2">
              ✓ Dados completos do ano carregados
            </div>
          )}
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
                  totalStoreVisits: data.totalStoreVisits,
                  totalTestDrives: data.testDrives,
                  totalSales: data.faturados
                }} />
              </section>

              {/* KPI Cards */}
              <section>
                <KpiCards 
                  data={{
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
                  }}
                  originalData={brDataForPeriod ? {
                    avgLeadToTestDrive: brDataForPeriod.avgLeadToTestDrive,
                    avgTestDriveToFaturamento: brDataForPeriod.avgTestDriveToFaturamento,
                    avgTotalJourney: brDataForPeriod.avgTotalJourney,
                    avgLeadToFaturamento: brDataForPeriod.avgLeadToFaturamento,
                    leads: brDataForPeriod.leads,
                    testDrives: brDataForPeriod.testDrives,
                    faturados: brDataForPeriod.faturados,
                    decidedLeadsCount: brDataForPeriod.decidedLeadsCount,
                    decidedLeadsPercentage: brDataForPeriod.decidedLeadsPercentage,
                    leadsFaturadosCount: brDataForPeriod.leadsFaturadosCount,
                    funnelMetrics: brDataForPeriod.funnelMetrics
                  } : undefined}
                  hasFiltersApplied={filters.selectedDealers.length > 0}
                />
              </section>

              {/* Multiple Funnels */}
              <section>
                <MultipleFunnels 
                  data={data.funnelMetrics}
                  originalData={originalData?.funnelMetrics}
                  hasFiltersApplied={filters.selectedDealers.length > 0}
                />
              </section>

              {/* Dealers Comparison - Only show when no dealer filter is applied */}
              {dealerComparison && (
                <DealersComparison data={dealerComparison} />
              )}
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
    </div>
  );
}