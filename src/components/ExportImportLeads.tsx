import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import { Lead, ProductType, LeadStatus, PRODUCTS, STATUSES } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImportedLead extends Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'> {
  importedCreatedAt?: string;
}

interface ExportImportLeadsProps {
  leads: Lead[];
  onImport: (leads: ImportedLead[]) => Promise<void>;
}

// Mapeamento inteligente de status Kiwify para CRM
const kiwifyStatusMap: Record<string, LeadStatus> = {
  // Vendas aprovadas
  'aprovada': 'fechado-ganho',
  'pago': 'fechado-ganho',
  'aprovado': 'fechado-ganho',
  'completo': 'fechado-ganho',
  'completed': 'fechado-ganho',
  'paid': 'fechado-ganho',
  'compra aprovada': 'fechado-ganho',
  'venda aprovada': 'fechado-ganho',
  
  // Carrinho abandonado / PIX gerado
  'abandonado': 'fechado-perdido',
  'carrinho abandonado': 'fechado-perdido',
  'abandoned': 'fechado-perdido',
  'pix gerado': 'novo',
  'boleto gerado': 'novo',
  'aguardando pagamento': 'novo',
  'aguardando': 'novo',
  'pendente': 'novo',
  'pending': 'novo',
  
  // Reembolsos
  'reembolsado': 'fechado-perdido',
  'reembolso': 'fechado-perdido',
  'refunded': 'fechado-perdido',
  'refund': 'fechado-perdido',
  'estornado': 'fechado-perdido',
  'compra reembolsada': 'fechado-perdido',
  
  // Recusado/Cancelado
  'recusado': 'fechado-perdido',
  'recusada': 'fechado-perdido',
  'cancelado': 'fechado-perdido',
  'cancelada': 'fechado-perdido',
  'declined': 'fechado-perdido',
  'canceled': 'fechado-perdido',
  'cancelled': 'fechado-perdido',
  'compra recusada': 'fechado-perdido',
  
  // Chargeback
  'chargeback': 'fechado-perdido',
  'disputa': 'fechado-perdido',
  
  // Assinaturas
  'assinatura ativa': 'fechado-ganho',
  'assinatura cancelada': 'fechado-perdido',
  'assinatura atrasada': 'negociacao',
  'assinatura renovada': 'fechado-ganho',
};

// Mapeamento de produtos Kiwify para CRM
const kiwifyProductMap: Record<string, ProductType> = {
  // Consultoria
  'consultoria': 'consultoria',
  'consultoria idea': 'consultoria',
  'consultoria ia': 'consultoria',
  
  // Mentoria
  'mentoria coletiva': 'mentoria-coletiva',
  'mentoria individual': 'mentoria-individual',
  'mentoria': 'mentoria-coletiva',
  
  // Curso
  'curso idea': 'curso-idea',
  'curso': 'curso-idea',
  'idea': 'curso-idea',
  
  // E-books
  'guia de ia para advogados': 'guia-ia',
  'guia de ia': 'guia-ia',
  'guia ia': 'guia-ia',
  'ebook guia': 'guia-ia',
  
  'código dos prompts': 'codigo-prompts',
  'codigo dos prompts': 'codigo-prompts',
  'código de prompts': 'codigo-prompts',
  'prompts': 'codigo-prompts',
  
  'combo': 'combo-ebooks',
  'combo ebooks': 'combo-ebooks',
  'combo e-books': 'combo-ebooks',
  'pacote ebooks': 'combo-ebooks',
};

function detectKiwifyStatus(row: Record<string, unknown>): LeadStatus | null {
  // Procura por colunas de status típicas da Kiwify
  const statusColumns = [
    'Status', 'status', 'Status da Compra', 'status da compra',
    'Situação', 'situação', 'Situacao', 'situacao',
    'Status do Pedido', 'status do pedido',
    'Estado', 'estado'
  ];
  
  for (const col of statusColumns) {
    if (row[col]) {
      const statusValue = String(row[col]).toLowerCase().trim();
      if (kiwifyStatusMap[statusValue]) {
        return kiwifyStatusMap[statusValue];
      }
    }
  }
  
  return null;
}

function detectKiwifyProduct(row: Record<string, unknown>): ProductType | null {
  const productColumns = [
    'Produto', 'produto', 'Product', 'product',
    'Nome do Produto', 'nome do produto',
    'Oferta', 'oferta', 'Item', 'item'
  ];
  
  for (const col of productColumns) {
    if (row[col]) {
      const productValue = String(row[col]).toLowerCase().trim();
      
      // Busca exata primeiro
      if (kiwifyProductMap[productValue]) {
        return kiwifyProductMap[productValue];
      }
      
      // Busca parcial
      for (const [key, value] of Object.entries(kiwifyProductMap)) {
        if (productValue.includes(key) || key.includes(productValue)) {
          return value;
        }
      }
    }
  }
  
  return null;
}

function detectKiwifyValue(row: Record<string, unknown>): number {
  const valueColumns = [
    'Valor', 'valor', 'Value', 'value',
    'Preço', 'preco', 'preço', 'Price', 'price',
    'Valor da Compra', 'valor da compra',
    'Total', 'total', 'Valor Total', 'valor total'
  ];
  
  for (const col of valueColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      let value = row[col];
      
      // Se for string, limpa e converte
      if (typeof value === 'string') {
        // Remove R$, espaços, pontos de milhar
        value = value.replace(/[R$\s.]/g, '').replace(',', '.');
      }
      
      const numValue = parseFloat(String(value));
      if (!isNaN(numValue) && numValue > 0) {
        return numValue;
      }
    }
  }
  
  return 0;
}

function getEventType(row: Record<string, unknown>): string {
  const statusColumns = [
    'Status', 'status', 'Status da Compra', 'status da compra',
    'Situação', 'situação', 'Situacao', 'situacao'
  ];
  
  for (const col of statusColumns) {
    if (row[col]) {
      return String(row[col]).trim();
    }
  }
  
  return 'Desconhecido';
}

function detectKiwifyDate(row: Record<string, unknown>): string | null {
  const dateColumns = [
    'Data', 'data', 'Date', 'date',
    'Data da Compra', 'data da compra',
    'Data do Pedido', 'data do pedido',
    'Data da Transação', 'data da transação',
    'Data da Venda', 'data da venda',
    'Created', 'created', 'Created At', 'created_at',
    'Data de Criação', 'data de criação',
    'Data/Hora', 'data/hora'
  ];
  
  for (const col of dateColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      const dateValue = row[col];
      
      // Se for número (Excel serial date)
      if (typeof dateValue === 'number') {
        // Excel usa dias desde 1/1/1900, ajuste para JavaScript
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
        return jsDate.toISOString();
      }
      
      // Se for string, tenta parsear
      if (typeof dateValue === 'string') {
        const dateStr = dateValue.trim();
        
        // Tenta formato DD/MM/YYYY ou DD/MM/YYYY HH:MM
        const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
        if (brMatch) {
          const [, day, month, year, hour = '0', min = '0', sec = '0'] = brMatch;
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(min),
            parseInt(sec)
          );
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
        
        // Tenta formato YYYY-MM-DD
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
        
        // Tenta parse genérico
        const genericParsed = new Date(dateStr);
        if (!isNaN(genericParsed.getTime())) {
          return genericParsed.toISOString();
        }
      }
    }
  }
  
  return null;
}

export function ExportImportLeads({ leads, onImport }: ExportImportLeadsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    leads: ImportedLead[];
    summary: {
      total: number;
      vendas: number;
      abandonados: number;
      reembolsos: number;
      pendentes: number;
      valorTotal: number;
      comData: number;
    };
  } | null>(null);

  const exportToExcel = () => {
    const exportData = leads.map(lead => ({
      Nome: lead.name,
      Email: lead.email,
      Telefone: lead.phone,
      Produto: PRODUCTS.find(p => p.id === lead.product)?.name || lead.product,
      Status: STATUSES.find(s => s.id === lead.status)?.name || lead.status,
      Valor: lead.value,
      Origem: lead.source,
      Observações: lead.notes,
      'Data de Criação': lead.createdAt,
      'Última Atualização': lead.updatedAt,
      'Qtd Interações': lead.interactions.length
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');

    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `leads_${date}.xlsx`);

    toast({
      title: "Exportação concluída!",
      description: `${leads.length} leads exportados para Excel`,
    });
  };

  const exportToCSV = () => {
    const exportData = leads.map(lead => ({
      Nome: lead.name,
      Email: lead.email,
      Telefone: lead.phone,
      Produto: lead.product,
      Status: lead.status,
      Valor: lead.value,
      Origem: lead.source,
      Observações: lead.notes,
      'Data de Criação': lead.createdAt,
      'Última Atualização': lead.updatedAt
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${date}.csv`;
    link.click();

    toast({
      title: "Exportação concluída!",
      description: `${leads.length} leads exportados para CSV`,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Map para produtos e status CRM
        const productNameMap: Record<string, ProductType> = {};
        PRODUCTS.forEach(p => {
          productNameMap[p.name.toLowerCase()] = p.id;
          productNameMap[p.shortName.toLowerCase()] = p.id;
          productNameMap[p.id] = p.id;
        });

        const statusNameMap: Record<string, LeadStatus> = {};
        STATUSES.forEach(s => {
          statusNameMap[s.name.toLowerCase()] = s.id;
          statusNameMap[s.id] = s.id;
        });

        const importedLeads: ImportedLead[] = [];
        let vendas = 0, abandonados = 0, reembolsos = 0, pendentes = 0, valorTotal = 0, comData = 0;

        for (const row of jsonData as Record<string, unknown>[]) {
          // Detecta nome - suporta vários formatos
          const name = String(
            row['Nome'] || row['name'] || row['Nome do Cliente'] || 
            row['nome do cliente'] || row['Cliente'] || row['cliente'] ||
            row['Comprador'] || row['comprador'] || ''
          ).trim();
          
          // Detecta email
          const email = String(
            row['Email'] || row['email'] || row['E-mail'] || row['e-mail'] ||
            row['Email do Cliente'] || row['email do cliente'] || ''
          ).trim();

          if (!name || !email) continue;

          // Detecta status automaticamente (Kiwify)
          let status: LeadStatus = 'novo';
          const kiwifyStatus = detectKiwifyStatus(row);
          if (kiwifyStatus) {
            status = kiwifyStatus;
          } else {
            // Fallback para mapeamento tradicional
            const statusKey = String(row['Status'] || row['status'] || 'novo').toLowerCase();
            status = statusNameMap[statusKey] || 'novo';
          }

          // Detecta produto automaticamente (Kiwify)
          let product: ProductType = 'consultoria';
          const kiwifyProduct = detectKiwifyProduct(row);
          if (kiwifyProduct) {
            product = kiwifyProduct;
          } else {
            const productKey = String(row['Produto'] || row['product'] || 'consultoria').toLowerCase();
            product = productNameMap[productKey] || 'consultoria';
          }

          // Detecta valor
          const value = detectKiwifyValue(row);

          // Detecta data da transação
          const transactionDate = detectKiwifyDate(row);
          if (transactionDate) {
            comData++;
          }

          // Contabiliza estatísticas
          const eventType = getEventType(row).toLowerCase();
          if (status === 'fechado-ganho') {
            vendas++;
            valorTotal += value;
          } else if (eventType.includes('abandon') || eventType.includes('carrinho')) {
            abandonados++;
          } else if (eventType.includes('reembolso') || eventType.includes('refund')) {
            reembolsos++;
          } else if (status === 'novo') {
            pendentes++;
          }

          // Detecta telefone
          const phone = String(
            row['Telefone'] || row['phone'] || row['Tel'] || row['tel'] ||
            row['Celular'] || row['celular'] || row['WhatsApp'] || row['whatsapp'] || ''
          ).trim();

          // Gera nota com tipo do evento original
          const originalEvent = getEventType(row);
          const notes = originalEvent !== 'Desconhecido' 
            ? `Importado Kiwify: ${originalEvent}` 
            : String(row['Observações'] || row['notes'] || '');

          importedLeads.push({
            name,
            email,
            phone,
            product,
            status,
            value,
            source: String(row['Origem'] || row['source'] || 'Kiwify'),
            notes,
            importedCreatedAt: transactionDate || undefined
          });
        }

        if (importedLeads.length === 0) {
          toast({
            title: "Nenhum lead encontrado",
            description: "Verifique se o arquivo tem as colunas corretas (Nome, Email, etc.)",
            variant: "destructive",
          });
          return;
        }

        // Mostra preview antes de importar
        setPreviewData({
          leads: importedLeads,
          summary: {
            total: importedLeads.length,
            vendas,
            abandonados,
            reembolsos,
            pendentes,
            valorTotal,
            comData
          }
        });
        setShowPreview(true);
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error importing file:', error);
      toast({
        title: "Erro ao importar",
        description: "Verifique o formato do arquivo",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!previewData) return;
    
    await onImport(previewData.leads);
    setShowPreview(false);
    setPreviewData(null);
  };


  return (
    <>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Importar Kiwify
        </Button>


        <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
          <Download className="w-4 h-4" />
          Excel
        </Button>

        <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
          <Download className="w-4 h-4" />
          CSV
        </Button>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Prévia da Importação Kiwify
            </DialogTitle>
            <DialogDescription>
              O sistema detectou automaticamente os status dos leads
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold">{previewData.summary.total}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-600">Vendas Aprovadas</p>
                  <p className="text-2xl font-bold text-green-600">{previewData.summary.vendas}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-600">Carrinhos Abandonados</p>
                  <p className="text-2xl font-bold text-yellow-600">{previewData.summary.abandonados}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-600">Reembolsos</p>
                  <p className="text-2xl font-bold text-red-600">{previewData.summary.reembolsos}</p>
                </div>
              </div>

              {previewData.summary.comData > 0 && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-600">Datas Reconhecidas</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {previewData.summary.comData} de {previewData.summary.total} leads com data original
                  </p>
                </div>
              )}

              {previewData.summary.valorTotal > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Valor Total em Vendas</p>
                  <p className="text-3xl font-bold text-primary">
                    {previewData.summary.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowPreview(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={confirmImport} className="flex-1">
                  Importar {previewData.summary.total} Leads
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
