import { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { Lead, ProductType, LeadStatus, PRODUCTS, STATUSES } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

interface ExportImportLeadsProps {
  leads: Lead[];
  onImport: (leads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>[]) => Promise<void>;
}

export function ExportImportLeads({ leads, onImport }: ExportImportLeadsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

    // Auto-size columns
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

        // Map imported data to Lead format
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

        const importedLeads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>[] = [];

        for (const row of jsonData as Record<string, unknown>[]) {
          const name = String(row['Nome'] || row['name'] || '').trim();
          const email = String(row['Email'] || row['email'] || '').trim();

          if (!name || !email) continue;

          const productKey = String(row['Produto'] || row['product'] || 'consultoria').toLowerCase();
          const statusKey = String(row['Status'] || row['status'] || 'novo').toLowerCase();

          importedLeads.push({
            name,
            email,
            phone: String(row['Telefone'] || row['phone'] || ''),
            product: productNameMap[productKey] || 'consultoria',
            status: statusNameMap[statusKey] || 'novo',
            value: Number(row['Valor'] || row['value']) || 0,
            source: String(row['Origem'] || row['source'] || ''),
            notes: String(row['Observações'] || row['notes'] || '')
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

        await onImport(importedLeads);
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Nome: 'Dr. João Silva',
        Email: 'joao@exemplo.com',
        Telefone: '(11) 99999-1234',
        Produto: 'consultoria',
        Status: 'novo',
        Valor: 15000,
        Origem: 'Instagram',
        Observações: 'Lead qualificado'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    ws['!cols'] = [
      { wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 20 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 30 }
    ];

    XLSX.writeFile(wb, 'template_leads.xlsx');

    toast({
      title: "Template baixado!",
      description: "Use este modelo para importar seus leads",
    });
  };

  return (
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
        Importar
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={downloadTemplate}
        className="gap-2"
      >
        Template
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={exportToExcel}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Excel
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={exportToCSV}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        CSV
      </Button>
    </div>
  );
}
