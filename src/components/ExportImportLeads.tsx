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
        Status: 'fechado-ganho',
        Valor: 15000,
        Origem: 'Kiwify',
        Observações: 'Venda realizada em Janeiro/2024'
      },
      {
        Nome: 'Dra. Maria Santos',
        Email: 'maria@exemplo.com',
        Telefone: '(21) 98888-5678',
        Produto: 'guia-ia',
        Status: 'fechado-ganho',
        Valor: 99,
        Origem: 'Kiwify',
        Observações: 'E-book vendido em Fevereiro/2024'
      },
      {
        Nome: 'Dr. Carlos Lima',
        Email: 'carlos@exemplo.com',
        Telefone: '(31) 97777-9012',
        Produto: 'curso-idea',
        Status: 'fechado-ganho',
        Valor: 497,
        Origem: 'Kiwify',
        Observações: 'Curso vendido em Março/2024'
      }
    ];

    // Add instructions sheet
    const instructionsData = [
      { Campo: 'Nome', Descrição: 'Nome completo do cliente', Obrigatório: 'Sim', Exemplo: 'Dr. João Silva' },
      { Campo: 'Email', Descrição: 'E-mail do cliente', Obrigatório: 'Sim', Exemplo: 'joao@exemplo.com' },
      { Campo: 'Telefone', Descrição: 'Telefone com DDD', Obrigatório: 'Não', Exemplo: '(11) 99999-1234' },
      { Campo: 'Produto', Descrição: 'ID do produto (ver lista abaixo)', Obrigatório: 'Sim', Exemplo: 'consultoria' },
      { Campo: 'Status', Descrição: 'Status do lead (ver lista abaixo)', Obrigatório: 'Sim', Exemplo: 'fechado-ganho' },
      { Campo: 'Valor', Descrição: 'Valor da venda em R$ (sem centavos)', Obrigatório: 'Sim para vendas', Exemplo: '15000' },
      { Campo: 'Origem', Descrição: 'Origem do lead', Obrigatório: 'Não', Exemplo: 'Kiwify' },
      { Campo: 'Observações', Descrição: 'Notas adicionais', Obrigatório: 'Não', Exemplo: 'Venda de Janeiro/2024' },
    ];

    const productsData = [
      { ID: 'consultoria', Nome: 'Consultoria IDEA', Ticket: 'Alto' },
      { ID: 'mentoria-coletiva', Nome: 'Mentoria Coletiva', Ticket: 'Médio' },
      { ID: 'mentoria-individual', Nome: 'Mentoria Individual', Ticket: 'Médio-Alto' },
      { ID: 'curso-idea', Nome: 'Curso IDEA', Ticket: 'Baixo-Médio' },
      { ID: 'guia-ia', Nome: 'Guia de IA para Advogados', Ticket: 'R$ 99' },
      { ID: 'codigo-prompts', Nome: 'Código dos Prompts', Ticket: 'R$ 99' },
      { ID: 'combo-ebooks', Nome: 'Combo de E-books', Ticket: 'R$ 149' },
    ];

    const statusData = [
      { ID: 'novo', Nome: 'Novo Lead', Descrição: 'Lead recém capturado' },
      { ID: 'contato-inicial', Nome: 'Contato Inicial', Descrição: 'Primeiro contato realizado' },
      { ID: 'negociacao', Nome: 'Em Negociação', Descrição: 'Negociando com o cliente' },
      { ID: 'proposta-enviada', Nome: 'Proposta Enviada', Descrição: 'Proposta foi enviada' },
      { ID: 'fechado-ganho', Nome: 'Fechado (Ganho)', Descrição: 'VENDA REALIZADA ✓' },
      { ID: 'fechado-perdido', Nome: 'Fechado (Perdido)', Descrição: 'Lead perdido' },
    ];

    const wb = XLSX.utils.book_new();
    
    // Template sheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 22 }, { wch: 28 }, { wch: 18 }, { wch: 20 },
      { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');

    // Instructions sheet
    const wsInst = XLSX.utils.json_to_sheet(instructionsData);
    wsInst['!cols'] = [{ wch: 15 }, { wch: 35 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instruções');

    // Products reference sheet
    const wsProd = XLSX.utils.json_to_sheet(productsData);
    wsProd['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsProd, 'Produtos');

    // Status reference sheet
    const wsStat = XLSX.utils.json_to_sheet(statusData);
    wsStat['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsStat, 'Status');

    XLSX.writeFile(wb, 'template_importacao_leads.xlsx');

    toast({
      title: "Template baixado!",
      description: "Inclui instruções, lista de produtos e status",
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
