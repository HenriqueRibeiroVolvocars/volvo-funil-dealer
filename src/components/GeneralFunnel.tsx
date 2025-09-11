import { Users, MapPin, Car, DollarSign } from 'lucide-react';

interface GeneralMetrics {
  totalLeads: number;
  totalStoreVisits: number;
  totalTestDrives: number;
  totalSales: number;
}

interface GeneralFunnelProps {
  data: GeneralMetrics;
}

export default function GeneralFunnel({ data }: GeneralFunnelProps) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="funnel-card">
      <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
        Geral - Números Absolutos
      </h2>
      
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Total de Leads */}
        <div className="relative flex justify-center">
          <div 
            className="funnel-bar h-20"
            style={{ 
              backgroundColor: 'hsl(var(--funnel-bar-primary))',
              width: '100%',
              clipPath: 'polygon(3% 0, 97% 0, 94% 100%, 6% 100%)'
            }}
          >
            <div className="flex items-center justify-between w-full" style={{ padding: '0 12%' }}>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3" />
                <div>
                  <span className="font-semibold text-base block">Total de Leads</span>
                  <span className="text-xs opacity-80">Leads gerados no período</span>
                </div>
              </div>
              <span className="text-2xl font-bold">
                {formatNumber(data.totalLeads)}
              </span>
            </div>
          </div>
        </div>

        {/* Visitas nas Lojas */}
        <div className="relative flex justify-center">
          <div 
            className="funnel-bar h-20"
            style={{ 
              backgroundColor: 'hsl(var(--funnel-bar-info))',
              width: '90%',
              clipPath: 'polygon(6% 0, 94% 0, 90% 100%, 10% 100%)'
            }}
          >
            <div className="flex items-center justify-between w-full" style={{ padding: '0 15%' }}>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3" />
                <div>
                  <span className="font-semibold text-base block">Visitas nas Lojas</span>
                  <span className="text-xs opacity-80">Tráfego físico total</span>
                </div>
              </div>
              <span className="text-2xl font-bold">
                {data.totalStoreVisits > 0 ? formatNumber(data.totalStoreVisits) : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Total de Test Drives */}
        <div className="relative flex justify-center">
          <div 
            className="funnel-bar h-20"
            style={{ 
              backgroundColor: 'hsl(var(--funnel-bar-secondary))',
              width: '80%',
              clipPath: 'polygon(8% 0, 92% 0, 87% 100%, 13% 100%)'
            }}
          >
            <div className="flex items-center justify-between w-full" style={{ padding: '0 18%' }}>
              <div className="flex items-center">
                <Car className="w-5 h-5 mr-3" />
                <div>
                  <span className="font-semibold text-base block">Total Test Drives</span>
                  <span className="text-xs opacity-80">Experiências realizadas</span>
                </div>
              </div>
              <span className="text-2xl font-bold">
                {formatNumber(data.totalTestDrives)}
              </span>
            </div>
          </div>
        </div>

        {/* Total de Vendas */}
        <div className="relative flex justify-center">
          <div 
            className="funnel-bar h-20"
            style={{ 
              backgroundColor: 'hsl(var(--funnel-bar-tertiary))',
              width: '70%',
              clipPath: 'polygon(12% 0, 88% 0, 82% 100%, 18% 100%)'
            }}
          >
            <div className="flex items-center justify-between w-full" style={{ padding: '0 22%' }}>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-3" />
                <div>
                  <span className="font-semibold text-base block">Total de Vendas</span>
                  <span className="text-xs opacity-80">Veículos faturados</span>
                </div>
              </div>
              <span className="text-2xl font-bold">
                {formatNumber(data.totalSales)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}