import { TrendingUp, Clock, Calendar, Target, Percent, Zap, BarChart3 } from 'lucide-react';
import { formatBrazilianNumber, formatBrazilianPercent, FunnelMetrics } from '@/utils/excelProcessor';

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
}

interface KpiCardsProps {
  data: KpiData;
}

export default function KpiCards({ data }: KpiCardsProps) {
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
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground text-center">Métricas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-tight">{metric.title}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {metric.value}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center leading-relaxed min-h-[40px] flex items-center justify-center">
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