import { useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type FilterType = '7days' | '30days' | 'thisMonth' | 'custom';

interface DailyExpenseFilterProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  customRange: { from: Date | undefined; to: Date | undefined };
  onCustomRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onExport: () => void;
}

export function DailyExpenseFilter({
  filter,
  onFilterChange,
  customRange,
  onCustomRangeChange,
  onExport,
}: DailyExpenseFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: '7days', label: '7 Hari' },
    { value: '30days', label: '30 Hari' },
    { value: 'thisMonth', label: 'Bulan Ini' },
    { value: 'custom', label: 'Rentang Kustom' },
  ];

  const handleDateSelect = (date: Date | undefined) => {
    if (!customRange.from || (customRange.from && customRange.to)) {
      onCustomRangeChange({ from: date, to: undefined });
    } else {
      if (date && date >= customRange.from) {
        onCustomRangeChange({ from: customRange.from, to: date });
        setIsCalendarOpen(false);
      } else {
        onCustomRangeChange({ from: date, to: undefined });
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onFilterChange(option.value);
              if (option.value === 'custom') {
                setIsCalendarOpen(true);
              }
            }}
            className={cn(
              'text-xs sm:text-sm transition-all',
              filter === option.value && 'shadow-md'
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {filter === 'custom' && (
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                {customRange.from ? (
                  customRange.to ? (
                    <>
                      {format(customRange.from, 'd MMM', { locale: id })} -{' '}
                      {format(customRange.to, 'd MMM', { locale: id })}
                    </>
                  ) : (
                    format(customRange.from, 'd MMM yyyy', { locale: id })
                  )
                ) : (
                  'Pilih Tanggal'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={customRange.to || customRange.from}
                onSelect={handleDateSelect}
                disabled={(date) => date > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
              <div className="p-3 border-t text-xs text-muted-foreground">
                {customRange.from ? (
                  customRange.to ? (
                    <span className="text-success">
                      ✓ {format(customRange.from, 'd MMM', { locale: id })} -{' '}
                      {format(customRange.to, 'd MMM yyyy', { locale: id })}
                    </span>
                  ) : (
                    <span>Pilih tanggal akhir...</span>
                  )
                ) : (
                  <span>Pilih tanggal mulai...</span>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="text-xs sm:text-sm gap-1"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Ekspor Excel</span>
        </Button>
      </div>
    </div>
  );
}
