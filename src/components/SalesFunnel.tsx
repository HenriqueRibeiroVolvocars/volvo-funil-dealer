import { Users, Car, DollarSign } from 'lucide-react';
import { formatBrazilianPercent } from '@/utils/excelProcessor';

interface FunnelData {
  leads: number;
  testDrives: number;
  faturados: number;
}

interface SalesFunnelProps {
  data: FunnelData;
}

export default function SalesFunnel({ data }: SalesFunnelProps) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="funnel-card">
      <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
        Funil de Vendas
      </h2>
      
      <div className="space-y-4 max-w-lg mx-auto">
        {/* Leads Gerados */}
        <div className="relative flex justify-center">
          <div 
            className="funnel-bar h-16"
            style={{ 
              backgroundColor: 'hsl(var(--funnel-bar-primary))',
              width: '100%',
              clipPath: 'polygon(5% 0, 95% 0, 90% 100%, 10% 100%)'
            }}
          >
            <div className="flex items-center justify-between w-full" style={{ padding: '0 15%' }}>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm">Leads gerados</span>
              </div>
              <span className="text-lg font-bold">
                {formatNumber(data.leads)}
              </span>
            </div>
          </div>
        </div>

        {/* Test Drives */}
        <div className="relative flex justify-center">
          <div 
            className="funnel-bar h-16"
            style={{ 
              backgroundColor: 'hsl(var(--funnel-bar-secondary))',
              width: '85%',
              clipPath: 'polygon(10% 0, 90% 0, 85% 100%, 15% 100%)'
            }}
          >
            <div className="flex items-center justify-between w-full" style={{ padding: '0 20%' }}>
              <div className="flex items-center">
                <Car className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm">Test drives</span>
              </div>
              <span className="text-lg font-bold">
                {formatNumber(data.testDrives)}
              </span>
            </div>
          </div>
        </div>

        {/* Veículos Faturados */}
        <div className="relative flex justify-center">
          <div 
            className="funnel-bar h-16"
            style={{ 
              backgroundColor: 'hsl(var(--funnel-bar-tertiary))',
              width: '70%',
              clipPath: 'polygon(15% 0, 85% 0, 75% 100%, 25% 100%)'
            }}
          >
            <div className="flex items-center justify-between w-full" style={{ padding: '0 25%' }}>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm">Veículos faturados</span>
              </div>
              <span className="text-lg font-bold">
                {formatNumber(data.faturados)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}