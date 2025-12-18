import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, Settings2 } from 'lucide-react';
import { Lead, ProductType, LeadStatus, PRODUCTS, STATUSES } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ColumnMapper, ColumnMapping } from './ColumnMapper';

interface ImportedLead extends Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'> {
  importedCreatedAt?: string;
}

interface ExportImportLeadsProps {
  leads: Lead[];
  onImport: (leads: ImportedLead[]) => Promise<void>;
}

// Mapeamento inteligente de status Kiwify para CRM
const kiwifyStatusMap: Record<string, LeadStatus> = {
  // Vendas aprovadas/pagas
  'aprovada': 'fechado-ganho',
  'pago': 'fechado-ganho',
  'aprovado': 'fechado-ganho',
  'completo': 'fechado-ganho',
  'completed': 'fechado-ganho',
  'paid': 'fechado-ganho',
  'compra aprovada': 'fechado-ganho',
  'venda aprovada': 'fechado-ganho',
  
  // Carrinho abandonado / Aguardando pagamento (status 'novo' para permitir follow-up)
  'abandonado': 'novo',
  'carrinho abandonado': 'novo',
  'abandoned': 'novo',
  'pix gerado': 'novo',
  'boleto gerado': 'novo',
  'aguardando pagamento': 'novo',
  'waiting_payment': 'novo',
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
  'refused': 'fechado-perdido',
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

// Status que indicam carrinho abandonado (aguardando pagamento)
const abandonedCartStatuses = [
  'waiting_payment', 'aguardando pagamento', 'aguardando_pagamento',
  'pix gerado', 'pix_gerado', 'boleto gerado', 'boleto_gerado',
  'pendente', 'pending', 'aguardando', 'abandonado', 'abandoned', 'carrinho abandonado'
];

// Status que indicam reembolso
const refundStatuses = [
  'refunded', 'reembolsado', 'reembolso', 'refund', 'estornado', 'compra reembolsada'
];

// Status que indicam recusado
const refusedStatuses = [
  'refused', 'recusado', 'recusada', 'declined', 'cancelado', 'cancelada', 'canceled', 'cancelled'
];

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
  // Procura por colunas de status típicas da Kiwify (case-insensitive)
  const statusColumns = [
    'Status', 'status', 'Status da Compra', 'status da compra',
    'Situação', 'situação', 'Situacao', 'situacao',
    'Status do Pedido', 'status do pedido',
    'Estado', 'estado', 'Status da Venda', 'status da venda',
    'Tipo', 'tipo', 'Event', 'event', 'Evento', 'evento',
    'Status do Pagamento', 'status do pagamento'
  ];
  
  // Busca case-insensitive
  const findColumn = (keys: string[]): string | null => {
    for (const key of keys) {
      if (row[key]) return String(row[key]).toLowerCase().trim();
      const lowerKey = key.toLowerCase();
      for (const rowKey of Object.keys(row)) {
        if (rowKey.toLowerCase() === lowerKey && row[rowKey]) {
          return String(row[rowKey]).toLowerCase().trim();
        }
      }
    }
    return null;
  };
  
  const statusValue = findColumn(statusColumns);
  if (!statusValue) return null;
  
  // Busca exata primeiro
  if (kiwifyStatusMap[statusValue]) {
    return kiwifyStatusMap[statusValue];
  }
  
  // Busca parcial
  for (const [key, value] of Object.entries(kiwifyStatusMap)) {
    if (statusValue.includes(key) || key.includes(statusValue)) {
      return value;
    }
  }
  
  return null;
}

function detectKiwifyProduct(row: Record<string, unknown>): ProductType | null {
  const productColumns = [
    'Produto', 'produto', 'Product', 'product',
    'Nome do Produto', 'nome do produto',
    'Oferta', 'oferta', 'Item', 'item',
    'Nome da Oferta', 'nome da oferta',
    'Título', 'titulo', 'Title', 'title',
    'Curso', 'curso', 'Produto Adquirido', 'produto adquirido'
  ];
  
  // Busca case-insensitive
  const findColumn = (keys: string[]): string | null => {
    for (const key of keys) {
      if (row[key]) return String(row[key]).toLowerCase().trim();
      const lowerKey = key.toLowerCase();
      for (const rowKey of Object.keys(row)) {
        if (rowKey.toLowerCase() === lowerKey && row[rowKey]) {
          return String(row[rowKey]).toLowerCase().trim();
        }
      }
    }
    return null;
  };
  
  const productValue = findColumn(productColumns);
  if (!productValue) return null;
  
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
  
  return null;
}

function detectKiwifyValue(row: Record<string, unknown>): number {
  // IMPORTANTE: Para Kiwify, SEMPRE priorizar "Valor líquido" que é o valor real que a Kiwify mostra
  // Busca exata pela coluna "Valor líquido" primeiro
  
  const rowKeys = Object.keys(row);
  
  // 1. Busca EXATA por "Valor líquido" (com variações de case e acentuação)
  const liquidoVariations = ['Valor líquido', 'Valor Líquido', 'valor líquido', 'VALOR LÍQUIDO', 
                              'Valor liquido', 'Valor Liquido', 'valor liquido'];
  
  for (const col of liquidoVariations) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      const numValue = parseValue(row[col]);
      if (numValue > 0) return numValue;
    }
  }
  
  // 2. Busca case-insensitive por "Valor líquido"
  for (const key of rowKeys) {
    const lowerKey = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lowerKey === 'valor liquido') {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        const numValue = parseValue(row[key]);
        if (numValue > 0) return numValue;
      }
    }
  }
  
  // 3. Busca parcial - coluna que contém exatamente "líquido" (mas não outras colunas de valor)
  for (const key of rowKeys) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('líquido') || lowerKey.includes('liquido')) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        const numValue = parseValue(row[key]);
        if (numValue > 0) return numValue;
      }
    }
  }
  
  // 4. Fallback para outras colunas de valor (menos prioritárias)
  const fallbackColumns = [
    'Total com acréscimo', 'total com acréscimo',
    'Preço base do produto', 'preço base do produto',
    'Valor da compra em moeda da conta',
    'Valor', 'valor', 'Value', 'value',
    'Total', 'total'
  ];
  
  for (const col of fallbackColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      const numValue = parseValue(row[col]);
      if (numValue > 0) return numValue;
    }
  }
  
  return 0;
}

function parseValue(value: unknown): number {
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    let cleaned = value.replace(/[R$\s]/g, '').trim();
    
    // Se vazio ou zero, retorna 0
    if (!cleaned || cleaned === '0') return 0;
    
    // Detecta o formato: brasileiro (1.234,56) vs americano (1,234.56)
    // Brasileiro: vírgula seguida de 1-2 dígitos no final
    // Americano: ponto seguido de 1-2 dígitos no final
    const brazilianFormat = /,\d{1,2}$/.test(cleaned);
    const americanFormat = /\.\d{1,2}$/.test(cleaned);
    
    // Verifica também se há ponto como separador de milhar (brasileiro)
    // Padrão brasileiro típico: 1.234,56 (ponto como milhar, vírgula como decimal)
    const hasBrazilianThousands = /\d{1,3}\.\d{3}/.test(cleaned) && brazilianFormat;
    
    if (brazilianFormat || hasBrazilianThousands) {
      // Formato brasileiro: remove pontos de milhar, converte vírgula em ponto
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (americanFormat) {
      // Formato americano: remove vírgulas de milhar, mantém ponto decimal
      cleaned = cleaned.replace(/,/g, '');
    }
    // Se não detectou formato, assume que é um número simples sem separadores
    
    const numValue = parseFloat(cleaned);
    if (!isNaN(numValue) && numValue > 0) return numValue;
  }
  
  return 0;
}

function getEventType(row: Record<string, unknown>): string {
  // IMPORTANTE: Primeiro busca exatamente pela coluna "Status" da Kiwify
  // Esta é a coluna que indica o estado atual da transação (paid, refunded, refused, waiting_payment)
  // NÃO confundir com "Status do recebimento" que é outra coluna
  
  // Busca exata primeiro (prioridade máxima)
  if (row['Status'] !== undefined && row['Status'] !== null && row['Status'] !== '') {
    return String(row['Status']).trim();
  }
  
  // Busca case-insensitive nas chaves do objeto
  const rowKeys = Object.keys(row);
  for (const key of rowKeys) {
    // Busca apenas por "Status" exato (case-insensitive) para evitar pegar "Status do recebimento"
    if (key.toLowerCase() === 'status') {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return String(row[key]).trim();
      }
    }
  }
  
  // Fallback para outras colunas de status
  const fallbackColumns = [
    'status', 'Status da Compra', 'status da compra',
    'Situação', 'situação', 'Situacao', 'situacao'
  ];
  
  for (const col of fallbackColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
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
  const [showMapper, setShowMapper] = useState(false);
  const [rawExcelData, setRawExcelData] = useState<Record<string, unknown>[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
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
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
        
        // Salva dados brutos para mapeamento manual
        setRawExcelData(jsonData);
        if (jsonData.length > 0) {
          setExcelColumns(Object.keys(jsonData[0]));
        }

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
          // Função auxiliar para buscar valor em múltiplas colunas possíveis
          const findValue = (keys: string[]): string => {
            for (const key of keys) {
              // Busca exata
              if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                return String(row[key]).trim();
              }
              // Busca case-insensitive
              const lowerKey = key.toLowerCase();
              for (const rowKey of Object.keys(row)) {
                if (rowKey.toLowerCase() === lowerKey && row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') {
                  return String(row[rowKey]).trim();
                }
              }
            }
            return '';
          };

          // Detecta nome - suporta MUITOS formatos Kiwify
          const name = findValue([
            'Nome', 'name', 'Nome do Cliente', 'nome do cliente',
            'Cliente', 'cliente', 'Comprador', 'comprador',
            'Nome do Comprador', 'nome do comprador',
            'Nome Completo', 'nome completo',
            'Nome do Usuário', 'nome do usuário',
            'Buyer Name', 'buyer_name', 'customer_name',
            'Full Name', 'full_name',
            'Nome do Aluno', 'nome do aluno',
            'Aluno', 'aluno'
          ]);
          
          // Detecta email - suporta MUITOS formatos Kiwify
          const email = findValue([
            'Email', 'email', 'E-mail', 'e-mail',
            'Email do Cliente', 'email do cliente',
            'E-mail do Cliente', 'e-mail do cliente',
            'Email do Comprador', 'email do comprador',
            'E-mail do Comprador', 'e-mail do comprador',
            'Buyer Email', 'buyer_email', 'customer_email',
            'Email do Aluno', 'email do aluno',
            'E-mail do Aluno', 'e-mail do aluno'
          ]);

          // Detecta telefone - suporta MUITOS formatos Kiwify
          const phone = findValue([
            'Telefone', 'phone', 'Tel', 'tel',
            'Celular', 'celular', 'WhatsApp', 'whatsapp',
            'Telefone do Cliente', 'telefone do cliente',
            'Telefone do Comprador', 'telefone do comprador',
            'Phone', 'Mobile', 'mobile',
            'Número', 'numero', 'Número de Telefone',
            'Telefone do Aluno', 'telefone do aluno',
            'Cel', 'cel', 'Fone', 'fone'
          ]);

          // Se não tem nome E não tem email, pula
          if (!name && !email) continue;

          // Usa email como nome se nome vazio, ou vice-versa
          const finalName = name || email.split('@')[0] || 'Lead Importado';
          const finalEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@importado.com`;

          // Detecta status automaticamente (Kiwify)
          let status: LeadStatus = 'novo';
          const kiwifyStatus = detectKiwifyStatus(row);
          if (kiwifyStatus) {
            status = kiwifyStatus;
          } else {
            // Fallback para mapeamento tradicional
            const statusKey = findValue(['Status', 'status', 'Situação', 'situacao']).toLowerCase();
            status = statusNameMap[statusKey] || 'novo';
          }

          // Detecta produto automaticamente (Kiwify)
          let product: ProductType = 'consultoria';
          const kiwifyProduct = detectKiwifyProduct(row);
          if (kiwifyProduct) {
            product = kiwifyProduct;
          } else {
            const productKey = findValue(['Produto', 'product', 'Nome do Produto', 'Oferta']).toLowerCase();
            product = productNameMap[productKey] || 'consultoria';
          }

          // Detecta valor
          const value = detectKiwifyValue(row);

          // Detecta data da transação
          const transactionDate = detectKiwifyDate(row);
          if (transactionDate) {
            comData++;
          }

          // Contabiliza estatísticas baseado no status original da planilha
          const eventType = getEventType(row).toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos
          
          // DEBUG: Log para verificar cada transação
          console.log(`[IMPORT DEBUG] Row: ${finalName}, Status: "${eventType}", Value: ${value}`);
          
          // IMPORTANTE: Verifica diretamente se o status original é "paid" para contabilizar valor
          // Inclui verificações mais abrangentes para garantir que nenhuma venda seja perdida
          const isPaidTransaction = eventType === 'paid' || 
                                    eventType === 'aprovada' || 
                                    eventType === 'aprovado' ||
                                    eventType.startsWith('paid') ||
                                    eventType === 'compra aprovada' ||
                                    eventType.includes('paid') ||
                                    eventType === 'aprovado' ||
                                    eventType === 'aprovação';
          
          // Verifica se é carrinho abandonado (waiting_payment ou equivalente)
          const isAbandonedCart = abandonedCartStatuses.some(s => 
            eventType === s || eventType.includes(s)
          );
          
          // Verifica se é reembolso (NÃO contabiliza valor - estes foram estornados)
          const isRefund = refundStatuses.some(s => 
            eventType === s || eventType.includes(s)
          );
          
          // Verifica se é recusado
          const isRefused = refusedStatuses.some(s => 
            eventType === s || eventType.includes(s)
          );
          
          // Contabiliza APENAS transações com status "paid" original
          if (isPaidTransaction) {
            vendas++;
            valorTotal += value;
            console.log(`[IMPORT DEBUG] ✓ PAID: ${finalName} - R$ ${value.toFixed(2)} - Total acumulado: R$ ${valorTotal.toFixed(2)}`);
          } else if (isRefund) {
            reembolsos++;
            console.log(`[IMPORT DEBUG] ✗ REFUND: ${finalName} - R$ ${value.toFixed(2)}`);
          } else if (isAbandonedCart) {
            abandonados++;
          } else if (isRefused) {
            pendentes++;
          } else if (status === 'novo') {
            pendentes++;
          }

          // Gera nota com tipo do evento original
          const originalEvent = getEventType(row);
          const notes = originalEvent !== 'Desconhecido' 
            ? `Importado Kiwify: ${originalEvent}` 
            : findValue(['Observações', 'notes', 'Notas', 'Obs']);

          // Detecta origem
          const source = findValue(['Origem', 'source', 'Source', 'Canal', 'canal']) || 'Kiwify';

          importedLeads.push({
            name: finalName,
            email: finalEmail,
            phone,
            product,
            status,
            value,
            source,
            notes,
            importedCreatedAt: transactionDate || undefined
          });
        }

        // Consolida leads duplicados por email - se um lead foi recusado mas depois pagou, mantém como pago
        // E ACUMULA valores de todas as vendas aprovadas do mesmo cliente
        const consolidatedLeads = new Map<string, ImportedLead & { totalSalesValue: number }>();
        const statusPriority: Record<LeadStatus, number> = {
          'fechado-ganho': 6, // Mais alta prioridade
          'fechado-perdido': 1, // Mais baixa
          'proposta-enviada': 4,
          'negociacao': 3,
          'contato-inicial': 2,
          'novo': 5, // Carrinhos abandonados devem ter prioridade sobre recusados
        };
        
        for (const lead of importedLeads) {
          const key = lead.email.toLowerCase();
          const existing = consolidatedLeads.get(key);
          
          if (!existing) {
            consolidatedLeads.set(key, { 
              ...lead, 
              totalSalesValue: lead.status === 'fechado-ganho' ? lead.value : 0 
            });
          } else {
            // Acumula o valor se for uma venda aprovada
            if (lead.status === 'fechado-ganho') {
              existing.totalSalesValue += lead.value;
            }
            
            // Se o novo lead tem status com prioridade maior, atualiza (mas mantém o totalSalesValue acumulado)
            if (statusPriority[lead.status] > statusPriority[existing.status]) {
              const accumulatedValue = existing.totalSalesValue + (lead.status === 'fechado-ganho' ? 0 : 0); // Já foi adicionado acima
              consolidatedLeads.set(key, { 
                ...lead, 
                totalSalesValue: existing.totalSalesValue // Mantém o valor acumulado
              });
            }
          }
        }
        
        // Converte para array final, usando o valor acumulado para leads fechado-ganho
        const finalLeads = Array.from(consolidatedLeads.values()).map(lead => ({
          ...lead,
          value: lead.status === 'fechado-ganho' ? lead.totalSalesValue : lead.value
        }));
        
        // Recalcula apenas contagem de leads após consolidação (não o valor, que já foi calculado corretamente)
        let finalVendas = 0, finalAbandonados = 0, finalReembolsos = 0, finalPendentes = 0;
        
        for (const lead of finalLeads) {
          const eventNote = lead.notes?.toLowerCase() || '';
          
          if (lead.status === 'fechado-ganho') {
            finalVendas++;
          } else if (refundStatuses.some(s => eventNote.includes(s))) {
            finalReembolsos++;
          } else if (abandonedCartStatuses.some(s => eventNote.includes(s))) {
            finalAbandonados++;
          } else {
            finalPendentes++;
          }
        }

        if (finalLeads.length === 0) {
          // Mostra as colunas encontradas para ajudar na depuração
          const firstRow = jsonData[0] as Record<string, unknown> | undefined;
          const columnsFound = firstRow ? Object.keys(firstRow).slice(0, 10).join(', ') : 'Nenhuma';
          console.log('Colunas encontradas no arquivo:', firstRow ? Object.keys(firstRow) : []);
          console.log('Primeira linha:', firstRow);
          
          toast({
            title: "Nenhum lead encontrado",
            description: `Colunas detectadas: ${columnsFound}${Object.keys(firstRow || {}).length > 10 ? '...' : ''}. Verifique se há colunas de Nome/Email.`,
            variant: "destructive",
          });
          return;
        }

        // Mostra preview antes de importar
        // IMPORTANTE: Usa valorTotal calculado diretamente durante processamento (linhas 650-652)
        // que soma TODOS os valores líquidos de transações "paid"
        setPreviewData({
          leads: finalLeads,
          summary: {
            total: finalLeads.length,
            vendas,        // Usa o contador original de vendas
            abandonados,   // Usa o contador original
            reembolsos,    // Usa o contador original
            pendentes,     // Usa o contador original
            valorTotal,    // Usa o valor calculado diretamente, não recalculado
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

  // Processa os dados usando o mapeamento manual
  const processWithMapping = (mapping: ColumnMapping) => {
    const productNameMap: Record<string, ProductType> = {};
    PRODUCTS.forEach(p => {
      productNameMap[p.name.toLowerCase()] = p.id;
      productNameMap[p.shortName.toLowerCase()] = p.id;
      productNameMap[p.id] = p.id;
    });
    
    // Adiciona mapeamentos Kiwify
    Object.entries(kiwifyProductMap).forEach(([key, value]) => {
      productNameMap[key] = value;
    });

    const importedLeads: ImportedLead[] = [];
    let vendas = 0, abandonados = 0, reembolsos = 0, pendentes = 0, valorTotal = 0, comData = 0;

    for (const row of rawExcelData) {
      const getValue = (field: keyof ColumnMapping): string => {
        const column = mapping[field];
        if (!column || !row[column]) return '';
        return String(row[column]).trim();
      };

      const name = getValue('name');
      const email = getValue('email');
      const phone = getValue('phone');
      const statusRaw = getValue('status').toLowerCase();
      const productRaw = getValue('product').toLowerCase();
      const valueRaw = getValue('value');
      const source = getValue('source') || 'Kiwify';
      const notes = getValue('notes');
      const dateRaw = getValue('date');

      // Se não tem nome E não tem email, pula
      if (!name && !email) continue;

      const finalName = name || email.split('@')[0] || 'Lead Importado';
      const finalEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@importado.com`;

      // Detecta status
      let status: LeadStatus = 'novo';
      if (kiwifyStatusMap[statusRaw]) {
        status = kiwifyStatusMap[statusRaw];
      }

      // Detecta produto
      let product: ProductType = 'consultoria';
      if (productNameMap[productRaw]) {
        product = productNameMap[productRaw];
      } else {
        for (const [key, val] of Object.entries(productNameMap)) {
          if (productRaw.includes(key)) {
            product = val;
            break;
          }
        }
      }

      // Detecta valor
      let value = 0;
      if (valueRaw) {
        const cleanValue = valueRaw.replace(/[R$\s.]/g, '').replace(',', '.');
        const numValue = parseFloat(cleanValue);
        if (!isNaN(numValue) && numValue > 0) {
          value = numValue;
        }
      }

      // Detecta data
      let transactionDate: string | null = null;
      if (dateRaw) {
        const parsed = new Date(dateRaw);
        if (!isNaN(parsed.getTime())) {
          transactionDate = parsed.toISOString();
          comData++;
        }
      }

      // Contabiliza estatísticas
      const isAbandonedCart = abandonedCartStatuses.some(s => statusRaw === s || statusRaw.includes(s));
      const isRefund = refundStatuses.some(s => statusRaw === s || statusRaw.includes(s));
      const isPaidTransaction = statusRaw === 'paid' || statusRaw.includes('aprovada') || statusRaw.includes('aprovado');

      if (isPaidTransaction || status === 'fechado-ganho') {
        vendas++;
        valorTotal += value;
      } else if (isRefund) {
        reembolsos++;
      } else if (isAbandonedCart) {
        abandonados++;
      } else {
        pendentes++;
      }

      importedLeads.push({
        name: finalName,
        email: finalEmail,
        phone,
        product,
        status,
        value,
        source,
        notes: statusRaw ? `Importado: ${statusRaw}` : notes,
        importedCreatedAt: transactionDate || undefined
      });
    }

    // Consolida duplicatas
    const consolidatedLeads = new Map<string, ImportedLead>();
    const statusPriority: Record<LeadStatus, number> = {
      'fechado-ganho': 6,
      'fechado-perdido': 1,
      'proposta-enviada': 4,
      'negociacao': 3,
      'contato-inicial': 2,
      'novo': 5,
    };

    for (const lead of importedLeads) {
      const key = lead.email.toLowerCase();
      const existing = consolidatedLeads.get(key);
      if (!existing || statusPriority[lead.status] > statusPriority[existing.status]) {
        consolidatedLeads.set(key, lead);
      }
    }

    const finalLeads = Array.from(consolidatedLeads.values());

    // Recalcula estatísticas
    let finalVendas = 0, finalAbandonados = 0, finalReembolsos = 0, finalPendentes = 0, finalValorTotal = 0;
    for (const lead of finalLeads) {
      const eventNote = lead.notes?.toLowerCase() || '';
      const isPaid = eventNote.includes('paid') || eventNote.includes('aprovada') || eventNote.includes('aprovado');
      if (isPaid || lead.status === 'fechado-ganho') {
        finalVendas++;
        finalValorTotal += lead.value;
      } else if (refundStatuses.some(s => eventNote.includes(s))) {
        finalReembolsos++;
      } else if (abandonedCartStatuses.some(s => eventNote.includes(s))) {
        finalAbandonados++;
      } else {
        finalPendentes++;
      }
    }

    if (finalLeads.length === 0) {
      toast({
        title: "Nenhum lead encontrado",
        description: "Verifique o mapeamento das colunas",
        variant: "destructive",
      });
      return;
    }

    setShowMapper(false);
    setPreviewData({
      leads: finalLeads,
      summary: {
        total: finalLeads.length,
        vendas: finalVendas,
        abandonados: finalAbandonados,
        reembolsos: finalReembolsos,
        pendentes: finalPendentes,
        valorTotal: finalValorTotal,
        comData
      }
    });
    setShowPreview(true);
  };

  const openColumnMapper = () => {
    if (rawExcelData.length === 0) {
      toast({
        title: "Nenhum arquivo carregado",
        description: "Importe um arquivo Excel primeiro",
        variant: "destructive",
      });
      return;
    }
    setShowMapper(true);
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

        {rawExcelData.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={openColumnMapper}
            className="gap-2"
          >
            <Settings2 className="w-4 h-4" />
            Mapear Colunas
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
          <Download className="w-4 h-4" />
          Excel
        </Button>

        <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
          <Download className="w-4 h-4" />
          CSV
        </Button>
      </div>

      {/* Dialog do Mapeador de Colunas */}
      <Dialog open={showMapper} onOpenChange={setShowMapper}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mapeamento Manual de Colunas</DialogTitle>
            <DialogDescription>
              Associe as colunas do Excel aos campos do CRM para importação personalizada
            </DialogDescription>
          </DialogHeader>
          
          <ColumnMapper
            excelColumns={excelColumns}
            sampleData={rawExcelData}
            onConfirm={processWithMapping}
            onCancel={() => setShowMapper(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
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
