import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DealerComparisonData, DealerMetrics } from '@/utils/dealerMetrics';

interface DealersComparisonProps {
  data: DealerComparisonData;
}

type SortField = 'dealerName' | 'leads' | 'testDrives' | 'sales' | 'leadsToTestDriveRate' | 'testDriveToSalesRate';
type SortDirection = 'asc' | 'desc';

export default function DealersComparison({ data }: DealersComparisonProps) {
  const [sortField, setSortField] = useState<SortField>('leads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortOptions = [
    { value: 'dealerName', label: 'Nome (A-Z)' },
    { value: 'leads', label: 'Quantidade de Leads' },
    { value: 'testDrives', label: 'Quantidade de Test Drives' },
    { value: 'sales', label: 'Quantidade de Vendas' },
    { value: 'leadsToTestDriveRate', label: 'Taxa Lead → TD' },
    { value: 'testDriveToSalesRate', label: 'Taxa TD → Venda' },
  ] as const;

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getPerformanceIndicator = (dealerValue: number, brValue: number, isPercentage = true) => {
    const threshold = isPercentage ? 0.5 : 1; // 0.5% for percentages, 1 for absolute numbers
    const difference = dealerValue - brValue;
    
    if (Math.abs(difference) < threshold) {
      return { icon: Minus, color: 'text-yellow-600', bgColor: 'bg-yellow-50', value: difference };
    } else if (difference > 0) {
      return { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', value: difference };
    } else {
      return { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-50', value: difference };
    }
  };

  const handleSortFieldChange = (field: string) => {
    setSortField(field as SortField);
    // Para nome, default é ascendente; para outros, descendente
    setSortDirection(field === 'dealerName' ? 'asc' : 'desc');
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const sortedDealers = [...data.dealerMetrics].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'dealerName') {
      return multiplier * a.dealerName.localeCompare(b.dealerName, 'pt-BR');
    }
    
    return multiplier * (a[sortField] - b[sortField]);
  });

  const currentSortLabel = sortOptions.find(option => option.value === sortField)?.label || 'Quantidade de Leads';


  const AbsoluteValueCell = ({ 
    dealerValue, 
    totalBrValue 
  }: {
    dealerValue: number;
    totalBrValue: number;
  }) => {
    const percentage = totalBrValue > 0 ? (dealerValue / totalBrValue) * 100 : 0;
    
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="font-medium">{formatNumber(dealerValue)}</span>
        <span className="text-xs text-muted-foreground">
          {percentage.toFixed(1)}% do total BR
        </span>
      </div>
    );
  };

  const PerformanceCell = ({ 
    dealerValue, 
    brValue, 
    formatter = formatPercentage 
  }: {
    dealerValue: number;
    brValue: number;
    formatter?: (value: number) => string;
  }) => {
    const indicator = getPerformanceIndicator(dealerValue, brValue, true);
    const Icon = indicator.icon;
    
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="font-medium">{formatter(dealerValue)}</span>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${indicator.bgColor}`}>
          <Icon className={`w-3 h-3 ${indicator.color}`} />
          <span className={`text-xs font-medium ${indicator.color}`}>
            {(indicator.value > 0 ? '+' : '') + indicator.value.toFixed(1) + 'pp'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section data-component="dealers-comparison">
      <Card className="funnel-card">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Comparativo por Concessionária
              </h2>
              <p className="text-muted-foreground text-sm">
                Performance de cada dealer com participação no total BR e comparação nas taxas de conversão
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Ordenar por:</label>
                <Select value={sortField} onValueChange={handleSortFieldChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione o critério" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Ordem:</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSortDirection}
                  className="gap-2 w-24"
                >
                  {sortDirection === 'asc' ? (
                    <>
                      <ArrowUp className="w-3 h-3" />
                      {sortField === 'dealerName' ? 'A-Z' : 'Menor'}
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-3 h-3" />
                      {sortField === 'dealerName' ? 'Z-A' : 'Maior'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-foreground bg-background">
                  Concessionária
                </th>
                <th className="text-right py-3 px-2 font-medium text-foreground bg-background">
                  Leads
                </th>
                <th className="text-right py-3 px-2 font-medium text-foreground bg-background">
                  Test Drives
                </th>
                <th className="text-right py-3 px-2 font-medium text-foreground bg-background">
                  Vendas
                </th>
                <th className="text-right py-3 px-2 font-medium text-foreground bg-background">
                  Taxa Lead→TD
                </th>
                <th className="text-right py-3 px-2 font-medium text-foreground bg-background">
                  Taxa TD→Venda
                </th>
              </tr>
              
              {/* Linha de referência BR */}
              <tr className="bg-secondary/30 border-b border-border sticky top-[49px] z-10">
                <td className="py-2 px-2 font-medium text-primary bg-secondary/30">Total BR</td>
                <td className="text-right py-2 px-2 text-sm font-medium bg-secondary/30">{formatNumber(data.brMetrics.leads)}</td>
                <td className="text-right py-2 px-2 text-sm font-medium bg-secondary/30">{formatNumber(data.brMetrics.testDrives)}</td>
                <td className="text-right py-2 px-2 text-sm font-medium bg-secondary/30">{formatNumber(data.brMetrics.sales)}</td>
                <td className="text-right py-2 px-2 text-sm font-medium bg-secondary/30">{formatPercentage(data.brMetrics.leadsToTestDriveRate)}</td>
                <td className="text-right py-2 px-2 text-sm font-medium bg-secondary/30">{formatPercentage(data.brMetrics.testDriveToSalesRate)}</td>
              </tr>
            </thead>
            
            <tbody>
              {sortedDealers.map((dealer) => (
                <tr key={dealer.dealerName} className="border-b border-border/50 hover:bg-accent/20">
                  <td className="py-3 px-2 font-medium">{dealer.dealerName}</td>
                  <td className="text-right py-3 px-2">
                    <AbsoluteValueCell 
                      dealerValue={dealer.leads} 
                      totalBrValue={data.brMetrics.leads}
                    />
                  </td>
                  <td className="text-right py-3 px-2">
                    <AbsoluteValueCell 
                      dealerValue={dealer.testDrives} 
                      totalBrValue={data.brMetrics.testDrives}
                    />
                  </td>
                  <td className="text-right py-3 px-2">
                    <AbsoluteValueCell 
                      dealerValue={dealer.sales} 
                      totalBrValue={data.brMetrics.sales}
                    />
                  </td>
                  <td className="text-right py-3 px-2">
                    <PerformanceCell 
                      dealerValue={dealer.leadsToTestDriveRate} 
                      brValue={data.brMetrics.leadsToTestDriveRate}
                    />
                  </td>
                  <td className="text-right py-3 px-2">
                    <PerformanceCell 
                      dealerValue={dealer.testDriveToSalesRate} 
                      brValue={data.brMetrics.testDriveToSalesRate}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span>Acima da média</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Minus className="w-3 h-3 text-yellow-600" />
              <span>Igual à média</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-600" />
              <span>Abaixo da média</span>
            </div>
          </div>
          <div>
            <span className="font-medium">pp</span> = pontos percentuais
          </div>
        </div>
      </Card>
    </section>
  );
}