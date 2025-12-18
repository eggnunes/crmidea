import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDateChange: (start: Date | undefined, end: Date | undefined) => void;
}

export function DateRangeFilter({ startDate, endDate, onDateChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = () => {
    onDateChange(undefined, undefined);
  };

  const hasDateFilter = startDate || endDate;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal min-w-[200px]",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate && endDate ? (
              <span>
                {format(startDate, "dd/MM/yy", { locale: ptBR })} - {format(endDate, "dd/MM/yy", { locale: ptBR })}
              </span>
            ) : startDate ? (
              <span>A partir de {format(startDate, "dd/MM/yy", { locale: ptBR })}</span>
            ) : endDate ? (
              <span>Até {format(endDate, "dd/MM/yy", { locale: ptBR })}</span>
            ) : (
              <span>Período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium text-muted-foreground">Selecione o período</p>
          </div>
          <div className="flex">
            <div className="p-2 border-r border-border">
              <p className="text-xs text-muted-foreground mb-2 px-2">Data inicial</p>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => onDateChange(date, endDate)}
                locale={ptBR}
                initialFocus
              />
            </div>
            <div className="p-2">
              <p className="text-xs text-muted-foreground mb-2 px-2">Data final</p>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => onDateChange(startDate, date)}
                locale={ptBR}
                disabled={(date) => startDate ? date < startDate : false}
              />
            </div>
          </div>
          <div className="p-3 border-t border-border flex justify-end">
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {hasDateFilter && (
        <Button variant="ghost" size="icon" onClick={handleClear} className="h-9 w-9">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
