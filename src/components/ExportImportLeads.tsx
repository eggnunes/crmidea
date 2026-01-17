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
import { ProductMapper, ProductMapping } from './ProductMapper';

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
  
  // Mentoria IDEA
  'mentoria coletiva': 'mentoria-coletiva',
  'mentoria individual': 'mentoria-individual',
  'mentoria idea': 'mentoria-coletiva',
  'mentoria idea (inteligência de dados e artificial)': 'mentoria-coletiva',
  
  // Curso IDEA
  'curso idea': 'curso-idea',
  
  // E-books Unitários (Guia de IA + Código dos Prompts unificados)
  'guia de ia para advogados': 'ebook-unitario',
  'guia de ia para advogados com rafael egg': 'ebook-unitario',
  'guia de ia': 'ebook-unitario',
  'guia ia': 'ebook-unitario',
  'código dos prompts': 'ebook-unitario',
  'codigo dos prompts': 'ebook-unitario',
  'código de prompts': 'ebook-unitario',
  'prompts': 'ebook-unitario',
  
  // Combo E-books (separado)
  'combo': 'combo-ebooks',
  'combo ebooks': 'combo-ebooks',
  'combo e-books': 'combo-ebooks',
  'pacote ebooks': 'combo-ebooks',
  
  // Imersão IDEA
  'imersão idea': 'imersao-idea',
  'imersao idea': 'imersao-idea',
  'imersão idea com rafael egg': 'imersao-idea',
  'orderbump - imersão idea com rafael egg': 'imersao-idea',
  'orderbump imersão idea': 'imersao-idea',
  
  // Fraternidade Safe Black
  'fraternidade safe black': 'fraternidade-safe-black',
  'safe black': 'fraternidade-safe-black',
  
  // Clube MQP
  'clube mqp': 'clube-mqp',
  'mqp': 'clube-mqp',
  
  // Fraternidade Safe Pró
  'fraternidade safe pró': 'fraternidade-safe-pro',
  'fraternidade safe pro': 'fraternidade-safe-pro',
  'safe pró': 'fraternidade-safe-pro',
  'safe pro': 'fraternidade-safe-pro',
  
  // Safe Skills
  'safe skills': 'safe-skills',
  
  // Safe Experience
  'safe experience': 'safe-experience',
  
  // Mentoria Marcello Safe
  'mentoria marcello safe': 'mentoria-marcello-safe',
  'marcello safe': 'mentoria-marcello-safe',
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
  
  // Busca parcial por palavras-chave
  const productLower = productValue.toLowerCase();
  
  // Mapeamentos por palavra-chave específica
  if (productLower.includes('fraternidade') && productLower.includes('black')) return 'fraternidade-safe-black';
  if (productLower.includes('fraternidade') && (productLower.includes('pró') || productLower.includes('pro'))) return 'fraternidade-safe-pro';
  if (productLower.includes('safe skills')) return 'safe-skills';
  if (productLower.includes('safe experience')) return 'safe-experience';
  if (productLower.includes('marcello') || productLower.includes('mentoria safe')) return 'mentoria-marcello-safe';
  if (productLower.includes('mqp') || productLower.includes('clube mqp')) return 'clube-mqp';
  if (productLower.includes('imersão') || productLower.includes('imersao') || productLower.includes('orderbump')) return 'imersao-idea';
  if (productLower.includes('consultoria')) return 'consultoria';
  if (productLower.includes('mentoria') && productLower.includes('idea')) return 'mentoria-coletiva';
  if (productLower.includes('curso') && productLower.includes('idea')) return 'curso-idea';
  if (productLower.includes('combo')) return 'combo-ebooks';
  if (productLower.includes('guia') || productLower.includes('código') || productLower.includes('codigo') || productLower.includes('prompts')) return 'ebook-unitario';
  
  // Busca parcial genérica no mapa
  for (const [key, value] of Object.entries(kiwifyProductMap)) {
    if (productValue.includes(key) || key.includes(productValue)) {
      return value;
    }
  }
  
  // Log produto não reconhecido
  console.warn(`[PRODUTO NÃO RECONHECIDO] "${productValue}"`);
  
  return null;
}

function detectKiwifyValue(row: Record<string, unknown>): number {
  // IMPORTANTE: Para Kiwify, SEMPRE priorizar "Valor líquido"
  const rowKeys = Object.keys(row);
  
  // Função auxiliar para normalizar nome de coluna
  const normalizeKey = (key: string): string => {
    return key.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, ''); // Remove caracteres especiais
  };
  
  // 1. Busca DIRETA por coluna "Valor líquido" ou variações
  for (const key of rowKeys) {
    const normalized = normalizeKey(key);
    // Busca "valorliquido" (sem espaços/acentos)
    if (normalized === 'valorliquido' || normalized.includes('valorliquido')) {
      const rawValue = row[key];
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        const numValue = parseValue(rawValue);
        if (numValue > 0) return numValue;
      }
    }
  }
  
  // 2. Busca parcial por "liquido" 
  for (const key of rowKeys) {
    const normalized = normalizeKey(key);
    if (normalized.includes('liquido')) {
      const rawValue = row[key];
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        const numValue = parseValue(rawValue);
        if (numValue > 0) return numValue;
      }
    }
  }
  
  // 3. Para AFILIADOS: busca por "comissão do afiliado"
  for (const key of rowKeys) {
    const normalized = normalizeKey(key);
    if (normalized.includes('comissao') && normalized.includes('afiliado')) {
      const rawValue = row[key];
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        const numValue = parseValue(rawValue);
        if (numValue > 0) return numValue;
      }
    }
  }
  
  // 4. Fallback: busca por outras colunas de valor
  const fallbackPatterns = ['totalcomacrescimo', 'precobasedoproduto', 'valordacompra', 'valor', 'total', 'value'];
  for (const pattern of fallbackPatterns) {
    for (const key of rowKeys) {
      const normalized = normalizeKey(key);
      if (normalized.includes(pattern)) {
        const rawValue = row[key];
        if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
          const numValue = parseValue(rawValue);
          if (numValue > 0) return numValue;
        }
      }
    }
  }
  
  return 0;
}

function parseValue(value: unknown): number {
  if (typeof value === 'number') {
    // Arredonda para 2 casas decimais para evitar problemas de precisão
    return Math.round(value * 100) / 100;
  }
  
  if (typeof value === 'string') {
    // Remove QUALQUER caractere que não seja dígito, vírgula, ponto ou sinal de menos
    // Isso inclui espaços invisíveis, símbolos de moeda, etc.
    let cleaned = value.replace(/[^\d,.+-]/g, '').trim();
    
    // Se vazio ou zero, retorna 0
    if (!cleaned || cleaned === '0' || cleaned === '0,00' || cleaned === '0.00') return 0;
    
    // Conta separadores
    const commas = (cleaned.match(/,/g) || []).length;
    const dots = (cleaned.match(/\./g) || []).length;
    
    // Lógica de detecção de formato:
    // 1. Se tem vírgula seguida de 1-2 dígitos no final = brasileiro (ex: 1.234,56 ou 1234,56)
    // 2. Se tem ponto seguido de 1-2 dígitos no final = americano (ex: 1,234.56 ou 1234.56)
    // 3. Casos especiais
    
    const endsWithCommaDecimals = /,\d{1,2}$/.test(cleaned);
    const endsWithDotDecimals = /\.\d{1,2}$/.test(cleaned);
    
    if (endsWithCommaDecimals) {
      // Formato brasileiro: vírgula como decimal
      // Remove pontos (separador de milhar) e converte vírgula para ponto
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (endsWithDotDecimals) {
      // Formato americano: ponto como decimal
      // Remove vírgulas (separador de milhar)
      cleaned = cleaned.replace(/,/g, '');
    } else if (commas === 1 && dots === 0) {
      // Só uma vírgula, pode ser decimal brasileiro sem milhar (ex: "99,99")
      cleaned = cleaned.replace(',', '.');
    } else if (dots === 1 && commas === 0) {
      // Só um ponto, pode ser decimal americano sem milhar (ex: "99.99") - já está OK
    } else {
      // Caso ambíguo: remove todos os separadores exceto o último
      // Prioriza vírgula como decimal se existir
      if (commas > 0) {
        cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    
    const numValue = parseFloat(cleaned);
    if (!isNaN(numValue) && isFinite(numValue)) {
      // Arredonda para 2 casas decimais para evitar problemas de precisão
      return Math.round(numValue * 100) / 100;
    }
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
  // IMPORTANTE: Inclui "Data de liberação" que é o formato usado na Kiwify
  const dateColumns = [
    // Kiwify específico
    'Data de liberação', 'data de liberação', 'Data de Liberação',
    'Data de liberacao', 'data de liberacao',
    // Outros formatos comuns
    'Data', 'data', 'Date', 'date',
    'Data da Compra', 'data da compra',
    'Data do Pedido', 'data do pedido',
    'Data da Transação', 'data da transação',
    'Data da Venda', 'data da venda',
    'Created', 'created', 'Created At', 'created_at',
    'Data de Criação', 'data de criação',
    'Data/Hora', 'data/hora'
  ];
  
  // Primeiro tenta busca exata
  for (const col of dateColumns) {
    if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
      const dateValue = row[col];
      const parsed = parseDateValue(dateValue);
      if (parsed) return parsed;
    }
  }
  
  // Busca case-insensitive e com normalização de acentos
  const rowKeys = Object.keys(row);
  for (const key of rowKeys) {
    const normalizedKey = key.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    // Busca por "data de liberacao" ou variações
    if (normalizedKey.includes('data') && (
      normalizedKey.includes('liberacao') || 
      normalizedKey.includes('compra') || 
      normalizedKey.includes('pedido') ||
      normalizedKey.includes('transacao') ||
      normalizedKey.includes('venda') ||
      normalizedKey.includes('criacao')
    )) {
      const dateValue = row[key];
      if (dateValue !== undefined && dateValue !== null && dateValue !== '') {
        const parsed = parseDateValue(dateValue);
        if (parsed) return parsed;
      }
    }
  }
  
  // Fallback: qualquer coluna que contenha "data" ou "date"
  for (const key of rowKeys) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.includes('data') || normalizedKey.includes('date')) {
      const dateValue = row[key];
      if (dateValue !== undefined && dateValue !== null && dateValue !== '') {
        const parsed = parseDateValue(dateValue);
        if (parsed) return parsed;
      }
    }
  }
  
  return null;
}

function parseDateValue(dateValue: unknown): string | null {
  // Se for número (Excel serial date)
  if (typeof dateValue === 'number') {
    // Excel usa dias desde 1/1/1900, ajuste para JavaScript
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString();
    }
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
  
  return null;
}

export function ExportImportLeads({ leads, onImport }: ExportImportLeadsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [showMapper, setShowMapper] = useState(false);
  const [showProductMapper, setShowProductMapper] = useState(false);
  const [rawExcelData, setRawExcelData] = useState<Record<string, unknown>[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [detectedProducts, setDetectedProducts] = useState<string[]>([]);
  const [productMapping, setProductMapping] = useState<ProductMapping>({});
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

        // PASSO 1: Detecta todos os produtos únicos da planilha
        const productColumns = [
          'Produto', 'produto', 'Product', 'product',
          'Nome do Produto', 'nome do produto',
          'Oferta', 'oferta', 'Item', 'item'
        ];
        
        const uniqueProducts = new Set<string>();
        for (const row of jsonData) {
          for (const col of productColumns) {
            const value = row[col];
            if (value && typeof value === 'string' && value.trim()) {
              uniqueProducts.add(value.trim());
              break;
            }
            // Busca case-insensitive
            for (const rowKey of Object.keys(row)) {
              if (rowKey.toLowerCase() === col.toLowerCase() && row[rowKey]) {
                const val = String(row[rowKey]).trim();
                if (val) {
                  uniqueProducts.add(val);
                  break;
                }
              }
            }
          }
        }
        
        const productsArray = Array.from(uniqueProducts).sort();
        console.log('Produtos únicos detectados:', productsArray);
        
        // Se encontrou produtos, mostra tela de correspondência
        if (productsArray.length > 0) {
          setDetectedProducts(productsArray);
          setShowProductMapper(true);
          toast({
            title: `${productsArray.length} produto(s) detectado(s)`,
            description: "Configure a correspondência dos produtos antes de importar",
          });
        } else {
          // Se não detectou produtos, processa direto
          processImportData(jsonData, {});
        }
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

  // Função que processa a importação com o mapeamento de produtos
  const processImportData = (jsonData: Record<string, unknown>[], appliedProductMapping: ProductMapping) => {
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

        // PASSO 1: Encontrar as colunas exatas de Status e Valor líquido na primeira linha
        const firstRow = jsonData[0] as Record<string, unknown>;
        const allColumns = Object.keys(firstRow);
        
        // Encontra coluna de Status (busca exata primeiro, depois variações)
        let statusColumnKey = allColumns.find(col => col === 'Status') 
          || allColumns.find(col => col.toLowerCase() === 'status')
          || allColumns.find(col => col.toLowerCase().includes('status') && !col.toLowerCase().includes('recebimento'));
        
        // Encontra coluna de Valor líquido (busca exata primeiro, depois variações)
        let valorColumnKey = allColumns.find(col => col === 'Valor líquido')
          || allColumns.find(col => col.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('valor liquido'))
          || allColumns.find(col => col.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('liquido'));
        
        console.log('=== ANÁLISE DE COLUNAS ===');
        console.log('Todas as colunas:', allColumns);
        console.log('Coluna Status encontrada:', statusColumnKey);
        console.log('Coluna Valor encontrada:', valorColumnKey);

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
            'E-mail do Aluno', 'e-mail do aluno',
            'Email do Aluno', 'email do aluno'
          ]);

          // SIMPLIFICADO: Pega Status direto da coluna encontrada
          const rawStatus = statusColumnKey ? String(row[statusColumnKey] || '').toLowerCase().trim() : '';
          
          // SIMPLIFICADO: Pega Valor direto da coluna encontrada
          let rawValue = 0;
          if (valorColumnKey && row[valorColumnKey] !== undefined && row[valorColumnKey] !== null && row[valorColumnKey] !== '') {
            const valStr = row[valorColumnKey];
            if (typeof valStr === 'number') {
              rawValue = Math.round(valStr * 100) / 100;
            } else {
              // Parse simples: remove tudo exceto dígitos, vírgula e ponto
              let cleaned = String(valStr).replace(/[^\d,.]/g, '').trim();
              // Se termina com vírgula + 2 dígitos, é formato brasileiro
              if (/,\d{1,2}$/.test(cleaned)) {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
              } else if (/\.\d{1,2}$/.test(cleaned)) {
                cleaned = cleaned.replace(/,/g, '');
              }
              const parsed = parseFloat(cleaned);
              if (!isNaN(parsed)) {
                rawValue = Math.round(parsed * 100) / 100;
              }
            }
          }
          
          // Verifica se está faltando dados obrigatórios
          if (!name && !email) continue;

          // Detecta telefone
          const phone = findValue([
            'Telefone', 'telefone', 'Phone', 'phone',
            'Celular', 'celular', 'Mobile', 'mobile',
            'WhatsApp', 'whatsapp', 'Contato', 'contato',
            'Número', 'numero', 'Fone', 'fone'
          ]);

          // Detecta produto - PRIMEIRO verifica o mapeamento do usuário
          let product: ProductType = 'ebook-unitario'; // Default
          const rawProductValue = findValue(['Produto', 'product', 'Oferta', 'oferta', 'Item']);
          
          // Verifica se há mapeamento definido pelo usuário
          if (rawProductValue && appliedProductMapping[rawProductValue]) {
            const mapping = appliedProductMapping[rawProductValue];
            if (mapping.targetProduct !== 'NEW') {
              product = mapping.targetProduct;
            }
            // Se é NEW, usa o default ebook-unitario
          } else {
            // Fallback para detecção automática
            const kiwifyProduct = detectKiwifyProduct(row);
            if (kiwifyProduct) {
              product = kiwifyProduct;
            } else {
              const rawProduct = rawProductValue?.toLowerCase();
              if (rawProduct && productNameMap[rawProduct]) {
                product = productNameMap[rawProduct];
              }
            }
          }

          // Detecta status do CRM baseado no status Kiwify
          let status: LeadStatus = 'novo';
          const kiwifyStatus = detectKiwifyStatus(row);
          if (kiwifyStatus) {
            status = kiwifyStatus;
          } else {
            const rawStatusForCRM = findValue(['Status', 'status'])?.toLowerCase();
            if (rawStatusForCRM && statusNameMap[rawStatusForCRM]) {
              status = statusNameMap[rawStatusForCRM];
            }
          }

          // Usa o valor detectado (ou busca em outras colunas como fallback)
          const value = rawValue > 0 ? rawValue : detectKiwifyValue(row);

          // Nome final (com fallback)
          let finalName = name;
          if (!finalName) {
            const emailPart = email.split('@')[0];
            finalName = emailPart.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          }
          
          // Email final (com fallback)
          const finalEmail = email || `${name.toLowerCase().replace(/\s+/g, '.')}@importado.com`;

          // Detecta data da transação
          const transactionDate = detectKiwifyDate(row);
          if (transactionDate) {
            comData++;
          } else {
            console.log(`[SEM DATA] ${finalName} - Colunas disponíveis:`, Object.keys(row).filter(k => k.toLowerCase().includes('data')));
          }

          // CONTABILIZA APENAS SE STATUS É "PAID"
          const isPaidTransaction = rawStatus === 'paid';
          const isAbandonedCart = rawStatus === 'waiting_payment' || rawStatus.includes('waiting') || rawStatus.includes('aguardando');
          const isRefund = rawStatus === 'refunded' || rawStatus.includes('reembolso') || rawStatus.includes('reembolsado');
          const isRefused = rawStatus === 'refused' || rawStatus.includes('recusado');
          
          // Log para debug de carrinhos abandonados
          if (isAbandonedCart && transactionDate) {
            console.log(`[ABANDONADO] ${finalName}: Data = ${new Date(transactionDate).toLocaleDateString('pt-BR')}`);
          }
          
          // Soma APENAS transações com status "paid"
          if (isPaidTransaction) {
            vendas++;
            valorTotal = Math.round((valorTotal + value) * 100) / 100;
            console.log(`[PAID] ${finalName}: R$ ${value.toFixed(2)} | Total acumulado: R$ ${valorTotal.toFixed(2)}`);
          } else if (isRefund) {
            reembolsos++;
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

  // Handler para quando o usuário confirma o mapeamento de produtos
  const handleProductMappingConfirm = (mapping: ProductMapping, newProducts: { id: string; name: string }[]) => {
    setProductMapping(mapping);
    setShowProductMapper(false);
    
    // Log novos produtos que precisariam ser criados
    if (newProducts.length > 0) {
      console.log('Novos produtos a criar:', newProducts);
      toast({
        title: `${newProducts.length} novo(s) produto(s)`,
        description: "Esses produtos serão tratados como 'E-book Unitário' por enquanto",
      });
    }
    
    // Processa os dados com o mapeamento aplicado
    processImportData(rawExcelData, mapping);
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

      {/* Dialog de Correspondência de Produtos */}
      <Dialog open={showProductMapper} onOpenChange={setShowProductMapper}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Correspondência de Produtos</DialogTitle>
            <DialogDescription>
              Mapeie os produtos da planilha para os produtos cadastrados no CRM
            </DialogDescription>
          </DialogHeader>
          
          <ProductMapper
            detectedProducts={detectedProducts}
            onConfirm={handleProductMappingConfirm}
            onCancel={() => setShowProductMapper(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
