import { TrendingUp, Clock, Calendar, Target, Percent, Zap, BarChart3, UserPlus, UserMinus, Star, Car } from 'lucide-react';
import { formatBrazilianNumber, formatBrazilianPercent } from '@/utils/excelProcessor';
import { FunnelMetrics } from '@/utils/types';
import { cn } from '@/lib/utils';

interface KpiData {
  avgLeadToTestDrive: number | null;
  avgTestDriveToFaturamento: number | null; 
  avgTotalJourney: number | null;
  avgLeadToFaturamento: number | null; // Nova métrica para leads diretos
  leads: number;
  testDrives: number;
  faturados: number;
  decidedLeadsCount: number;
  decidedLeadsPercentage: number;
  leadsFaturadosCount: number; // Quantidade de leads faturados na base
  funnelMetrics: FunnelMetrics; // Para calcular taxas de conversão
  percNovos: number;
  percAntigos: number;
  osatCarHandover: number;
  osatTestDrive: number;
}

interface KpiCardsProps {
  data: KpiData;
  originalData?: KpiData; // Para mostrar referência total
  hasFiltersApplied?: boolean;
}

export default function KpiCards({ data, originalData, hasFiltersApplied = false }: KpiCardsProps) {
  const metrics = [
    {
      title: 'Tempo Lead → Faturado',
      icon: Target,
      value: formatBrazilianNumber(data.avgLeadToFaturamento),
      subtitle: 'Tempo médio em dias (leads diretos)'
    },
    {
      title: 'Tempo Test Drive → Faturado',
      icon: TrendingUp,
      value: formatBrazilianNumber(data.avgTestDriveToFaturamento),
      subtitle: 'Tempo médio em dias após test drive'
    },
    {
      title: 'Jornada Completa',
      icon: Calendar,
      value: formatBrazilianNumber(data.avgTotalJourney),
      subtitle: 'Tempo médio total (Lead → Test Drive → Faturado)'
    },
    {
      title: 'Leads Já Decididos',
      icon: Zap,
      value: formatBrazilianPercent(data.decidedLeadsPercentage),
      subtitle: `${formatBrazilianNumber(data.decidedLeadsCount)} de ${formatBrazilianNumber(data.leadsFaturadosCount)} leads compraram em ≤10 dias`
    },
    {
      title: 'Percentual Clientes Novos',
      icon: UserPlus,
      value: formatBrazilianPercent(data.percNovos),
      subtitle: 'Percentual de clientes novos'
    },
    {
      title: 'Percentual Clientes Antigos',
      icon: UserMinus,
      value: formatBrazilianPercent(data.percAntigos),
      subtitle: 'Percentual de clientes antigos'
    },
    {
      title: 'OSAT Car Handover',
      icon: Car,
      value: formatBrazilianNumber(data.osatCarHandover),
      subtitle: 'Satisfação média entrega carro novo'
    },
    {
      title: 'OSAT Test Drive',
      icon: Star,
      value: formatBrazilianNumber(data.osatTestDrive),
      subtitle: 'Satisfação média test drive'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground text-center">Métricas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow h-full min-h-[220px] flex flex-col">
              <div className="flex items-start gap-3 mb-4 min-h-[56px]">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground leading-tight">
                    {metric.title}
                  </h3>
                </div>
                {hasFiltersApplied && originalData && (
                  <div className="rounded-md bg-secondary/50 text-xs px-2 py-1 leading-tight text-muted-foreground w-[64px] text-center">
                    <div className="font-medium">BR</div>
                    <div className="font-mono tabular-nums whitespace-nowrap">
                      {index === 0 && formatBrazilianNumber(originalData.avgLeadToFaturamento)}
                      {index === 1 && formatBrazilianNumber(originalData.avgTestDriveToFaturamento)}
                      {index === 2 && formatBrazilianNumber(originalData.avgTotalJourney)}
                      {index === 3 && formatBrazilianPercent(originalData.decidedLeadsPercentage)}
                      {index === 4 && formatBrazilianPercent(originalData.percNovos)}
                      {index === 5 && formatBrazilianPercent(originalData.percAntigos)}
                      {index === 6 && formatBrazilianNumber(originalData.osatCarHandover)}
                      {index === 7 && formatBrazilianNumber(originalData.osatTestDrive)}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary leading-none h-10 flex items-center justify-center">
                    {metric.value}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center leading-relaxed px-2 min-h-[40px] flex items-center justify-center">
                  {metric.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}