import { Users, Car, DollarSign, Target, TrendingUp } from 'lucide-react';
import { FunnelMetrics } from '@/utils/excelProcessor';

interface MultipleFunnelsProps {
  data: FunnelMetrics;
}

export default function MultipleFunnels({ data }: MultipleFunnelsProps) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const calculateConversion = (total: number, converted: number) => {
    if (total === 0) return '0%';
    return ((converted / total) * 100).toFixed(1) + '%';
  };

  const conversionCards = [
    {
      title: 'Leads → Faturados',
      description: 'Leads que não realizaram test drive e compraram',
      icon: Target,
      conversion: calculateConversion(data.leadsDiretos.leads, data.leadsDiretos.faturados),
      from: formatNumber(data.leadsDiretos.leads),
      to: formatNumber(data.leadsDiretos.faturados),
      fromLabel: 'Leads',
      toLabel: 'Faturados'
    },
    {
      title: 'Jornada Completa',
      description: 'Leads que fizeram test drive e compraram',
      icon: Users,
      conversion: calculateConversion(data.jornadaCompleta.leads, data.jornadaCompleta.faturados),
      from: formatNumber(data.jornadaCompleta.leads),
      to: formatNumber(data.jornadaCompleta.faturados),
      fromLabel: 'Leads',
      toLabel: 'Faturados'
    },
    {
      title: 'Leads → Test Drive',
      description: 'Quantidade de leads que realizaram test drive',
      icon: TrendingUp,
      conversion: calculateConversion(data.leadsComTestDrive.leads, data.leadsComTestDrive.testDrives),
      from: formatNumber(data.leadsComTestDrive.leads),
      to: formatNumber(data.leadsComTestDrive.testDrives),
      fromLabel: 'Leads',
      toLabel: 'Test Drives'
    },
    {
      title: 'Test Drive → Faturados',
      description: 'Pessoas que realizaram test drive e compraram',
      icon: Car,
      conversion: calculateConversion(data.testDrivesVendidos.testDrives, data.testDrivesVendidos.vendas),
      from: formatNumber(data.testDrivesVendidos.testDrives),
      to: formatNumber(data.testDrivesVendidos.vendas),
      fromLabel: 'Test Drives',
      toLabel: 'Faturados'
    }
  ];

  return (
    <div className="funnel-card">
      <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
        Análise de Funis de Conversão
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {conversionCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">{card.title}</h3>
              </div>
              <div className="text-xs text-muted-foreground mb-4 italic">
                {card.description}
              </div>
              
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary mb-2">
                  {card.conversion}
                </div>
                <div className="text-sm text-muted-foreground">
                  Taxa de Conversão
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="text-center">
                  <div className="font-semibold text-foreground">{card.from}</div>
                  <div className="text-muted-foreground">{card.fromLabel}</div>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">{card.to}</div>
                  <div className="text-muted-foreground">{card.toLabel}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}