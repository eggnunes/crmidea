import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search } from "lucide-react";
import { AppStoreSale } from "@/hooks/useAppStoreSales";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SalesTableProps {
  sales: AppStoreSale[];
  isLoading: boolean;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'Estados Unidos',
  BR: 'Brasil',
  GB: 'Reino Unido',
  DE: 'Alemanha',
  FR: 'França',
  CA: 'Canadá',
  AU: 'Austrália',
  JP: 'Japão',
  MX: 'México',
  ES: 'Espanha',
  IT: 'Itália',
  PT: 'Portugal',
};

export function SalesTable({ sales, isLoading }: SalesTableProps) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const filteredSales = sales.filter((sale) => {
    const matchesSearch = !search || 
      sale.country_code?.toLowerCase().includes(search.toLowerCase()) ||
      sale.product_name?.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "all" || sale.country_code === countryFilter;
    const matchesProduct = productFilter === "all" || sale.product_type === productFilter;
    return matchesSearch && matchesCountry && matchesProduct;
  });

  const uniqueCountries = [...new Set(sales.map(s => s.country_code).filter(Boolean))];
  const uniqueProducts = [...new Set(sales.map(s => s.product_type).filter(Boolean))];

  const exportCSV = () => {
    const headers = ['Data', 'País', 'Tipo', 'Unidades', 'Receita', 'Moeda'];
    const rows = filteredSales.map(sale => [
      format(parseISO(sale.date), 'dd/MM/yyyy'),
      sale.country_code || '-',
      sale.product_type || '-',
      sale.units,
      sale.proceeds.toFixed(2),
      sale.currency,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas-appstore-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 p-6">
        <Skeleton className="h-4 w-40 bg-white/10 mb-4" />
        <Skeleton className="h-64 w-full bg-white/10" />
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-white">Vendas Detalhadas</h3>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 w-40"
            />
          </div>
          
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os países</SelectItem>
              {uniqueCountries.map((country) => (
                <SelectItem key={country} value={country!}>
                  {COUNTRY_NAMES[country!] || country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {uniqueProducts.map((product) => (
                <SelectItem key={product} value={product!}>
                  {product}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportCSV}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="py-12 text-center text-white/50">
          Nenhuma venda encontrada
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Data</TableHead>
                <TableHead className="text-white/60">País</TableHead>
                <TableHead className="text-white/60">Tipo</TableHead>
                <TableHead className="text-white/60 text-right">Unidades</TableHead>
                <TableHead className="text-white/60 text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.slice(0, 50).map((sale) => (
                <TableRow key={sale.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white">
                    {format(parseISO(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {COUNTRY_NAMES[sale.country_code || ''] || sale.country_code || '-'}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {sale.product_type || '-'}
                  </TableCell>
                  <TableCell className="text-white text-right">
                    {sale.units.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-green-400 text-right font-medium">
                    ${sale.proceeds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredSales.length > 50 && (
            <p className="text-center text-white/50 text-sm mt-4">
              Mostrando 50 de {filteredSales.length} registros
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
