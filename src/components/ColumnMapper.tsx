import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Check, X, FileSpreadsheet, Columns } from 'lucide-react';

interface ColumnMapperProps {
  excelColumns: string[];
  sampleData: Record<string, unknown>[];
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

export interface ColumnMapping {
  name: string | null;
  email: string | null;
  phone: string | null;
  product: string | null;
  status: string | null;
  value: string | null;
  source: string | null;
  notes: string | null;
  date: string | null;
}

const CRM_FIELDS = [
  { key: 'name', label: 'Nome', required: true, description: 'Nome do lead/cliente' },
  { key: 'email', label: 'Email', required: true, description: 'Email do lead' },
  { key: 'phone', label: 'Telefone', required: false, description: 'Telefone/WhatsApp' },
  { key: 'product', label: 'Produto', required: false, description: 'Produto adquirido/interessado' },
  { key: 'status', label: 'Status', required: false, description: 'Status da compra (paid, waiting_payment, etc.)' },
  { key: 'value', label: 'Valor', required: false, description: 'Valor da compra' },
  { key: 'source', label: 'Origem', required: false, description: 'Origem do lead' },
  { key: 'notes', label: 'Observações', required: false, description: 'Notas adicionais' },
  { key: 'date', label: 'Data', required: false, description: 'Data da transação' },
] as const;

export function ColumnMapper({ excelColumns, sampleData, onConfirm, onCancel }: ColumnMapperProps) {
  // Auto-detect initial mapping based on column names
  const initialMapping = useMemo(() => {
    const mapping: ColumnMapping = {
      name: null,
      email: null,
      phone: null,
      product: null,
      status: null,
      value: null,
      source: null,
      notes: null,
      date: null,
    };

    const findMatch = (patterns: string[]): string | null => {
      for (const col of excelColumns) {
        const lowerCol = col.toLowerCase();
        for (const pattern of patterns) {
          if (lowerCol.includes(pattern)) {
            return col;
          }
        }
      }
      return null;
    };

    mapping.name = findMatch(['nome', 'name', 'cliente', 'comprador', 'buyer', 'aluno']);
    mapping.email = findMatch(['email', 'e-mail', 'mail']);
    mapping.phone = findMatch(['telefone', 'phone', 'celular', 'whatsapp', 'tel', 'fone', 'mobile']);
    mapping.product = findMatch(['produto', 'product', 'oferta', 'item', 'curso', 'título', 'title']);
    mapping.status = findMatch(['status', 'situação', 'situacao', 'estado']);
    mapping.value = findMatch(['valor', 'value', 'preço', 'preco', 'price', 'total']);
    mapping.source = findMatch(['origem', 'source', 'canal']);
    mapping.notes = findMatch(['observ', 'notes', 'notas', 'obs']);
    mapping.date = findMatch(['data', 'date', 'created', 'hora']);

    return mapping;
  }, [excelColumns]);

  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping);

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: value === '_none_' ? null : value,
    }));
  };

  const getMappedValue = (row: Record<string, unknown>, field: keyof ColumnMapping): string => {
    const column = mapping[field];
    if (!column || !row[column]) return '-';
    return String(row[column]).substring(0, 30) + (String(row[column]).length > 30 ? '...' : '');
  };

  const isValid = mapping.name || mapping.email;

  const usedColumns = Object.values(mapping).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Columns className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Mapeamento de Colunas</h3>
          <p className="text-sm text-muted-foreground">
            Associe as colunas do Excel aos campos do CRM
          </p>
        </div>
      </div>

      {/* Column Mapping */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Campos do CRM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {CRM_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-4">
                <div className="w-32 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{field.description}</span>
                </div>
                
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                
                <Select
                  value={mapping[field.key as keyof ColumnMapping] || '_none_'}
                  onValueChange={(value) => handleMappingChange(field.key as keyof ColumnMapping, value)}
                >
                  <SelectTrigger className="w-64 bg-background">
                    <SelectValue placeholder="Selecionar coluna..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="_none_">
                      <span className="text-muted-foreground">Não mapear</span>
                    </SelectItem>
                    {excelColumns.map(col => (
                      <SelectItem 
                        key={col} 
                        value={col}
                        disabled={usedColumns.includes(col) && mapping[field.key as keyof ColumnMapping] !== col}
                      >
                        <div className="flex items-center gap-2">
                          {col}
                          {usedColumns.includes(col) && mapping[field.key as keyof ColumnMapping] === col && (
                            <Check className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {mapping[field.key as keyof ColumnMapping] && (
                  <Badge variant="secondary" className="text-xs">
                    Mapeado
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Preview dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {CRM_FIELDS.slice(0, 6).map(field => (
                    <th key={field.key} className="text-left p-2 font-medium">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    {CRM_FIELDS.slice(0, 6).map(field => (
                      <td key={field.key} className="p-2 text-muted-foreground">
                        {getMappedValue(row, field.key as keyof ColumnMapping)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
          <p className="text-xs text-muted-foreground mt-2">
            Mostrando {Math.min(5, sampleData.length)} de {sampleData.length} linhas
          </p>
        </CardContent>
      </Card>

      {/* Validation */}
      {!isValid && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <X className="h-4 w-4" />
          Mapeie pelo menos o campo Nome ou Email para continuar
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onConfirm(mapping)} disabled={!isValid}>
          <Check className="h-4 w-4 mr-2" />
          Confirmar Mapeamento
        </Button>
      </div>
    </div>
  );
}
