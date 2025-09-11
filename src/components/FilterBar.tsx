import { useState } from 'react';
import { Calendar, CalendarDays, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FilterOptions } from '@/utils/dataFilters';

interface FilterBarProps {
  dealers: string[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  originalPeriod: {
    start: Date | null;
    end: Date | null;
  };
}

export default function FilterBar({ dealers, filters, onFiltersChange, originalPeriod }: FilterBarProps) {
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleStartDateSelect = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        start: date || null
      }
    });
    setStartDateOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        end: date || null
      }
    });
    setEndDateOpen(false);
  };

  const handleDealerToggle = (dealer: string) => {
    const isSelected = filters.selectedDealers.includes(dealer);
    const newDealers = isSelected
      ? filters.selectedDealers.filter(d => d !== dealer)
      : [...filters.selectedDealers, dealer];
    
    onFiltersChange({
      ...filters,
      selectedDealers: newDealers
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: { start: null, end: null },
      selectedDealers: []
    });
  };

  const hasActiveFilters = filters.selectedDealers.length > 0 || 
                          filters.dateRange.start !== null || 
                          filters.dateRange.end !== null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-start">
        {/* Filtro de Período */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Período</label>
          <div className="flex gap-2">
            {/* Data Início */}
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 px-3 justify-start text-left font-normal",
                    !filters.dateRange.start && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-3 w-3" />
                  {filters.dateRange.start ? (
                    format(filters.dateRange.start, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Data início"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateRange.start || undefined}
                  onSelect={handleStartDateSelect}
                  disabled={(date) => {
                    if (originalPeriod.start && date < originalPeriod.start) return true;
                    if (originalPeriod.end && date > originalPeriod.end) return true;
                    if (filters.dateRange.end && date > filters.dateRange.end) return true;
                    return false;
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Data Fim */}
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 px-3 justify-start text-left font-normal",
                    !filters.dateRange.end && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-3 w-3" />
                  {filters.dateRange.end ? (
                    format(filters.dateRange.end, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Data fim"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateRange.end || undefined}
                  onSelect={handleEndDateSelect}
                  disabled={(date) => {
                    if (originalPeriod.start && date < originalPeriod.start) return true;
                    if (originalPeriod.end && date > originalPeriod.end) return true;
                    if (filters.dateRange.start && date < filters.dateRange.start) return true;
                    return false;
                  }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filtro de Concessionárias */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">Concessionárias</label>
          <Select onValueChange={handleDealerToggle}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Selecionar concessionária" />
            </SelectTrigger>
            <SelectContent>
              {dealers.map((dealer) => (
                <SelectItem 
                  key={dealer} 
                  value={dealer}
                  className="flex items-center justify-between"
                >
                  <span>{dealer}</span>
                  {filters.selectedDealers.includes(dealer) && (
                    <Badge variant="secondary" className="ml-2 h-4 text-xs">
                      ✓
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros Ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {filters.dateRange.start && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Início: {format(filters.dateRange.start, "dd/MM/yyyy", { locale: ptBR })}
              <button
                onClick={() => handleStartDateSelect(undefined)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.dateRange.end && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Fim: {format(filters.dateRange.end, "dd/MM/yyyy", { locale: ptBR })}
              <button
                onClick={() => handleEndDateSelect(undefined)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.selectedDealers.map((dealer) => (
            <Badge key={dealer} variant="secondary" className="flex items-center gap-1">
              {dealer}
              <button
                onClick={() => handleDealerToggle(dealer)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}