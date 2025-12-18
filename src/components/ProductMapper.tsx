import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRODUCTS, ProductType } from '@/types/crm';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ProductMapping {
  [originalProduct: string]: {
    targetProduct: ProductType | 'NEW';
    newProductName?: string;
  };
}

interface ProductMapperProps {
  detectedProducts: string[];
  onConfirm: (mapping: ProductMapping, newProducts: { id: string; name: string }[]) => void;
  onCancel: () => void;
}

export function ProductMapper({ detectedProducts, onConfirm, onCancel }: ProductMapperProps) {
  const [mapping, setMapping] = useState<ProductMapping>(() => {
    const initial: ProductMapping = {};
    detectedProducts.forEach(product => {
      // Tenta encontrar correspondência automática
      const normalized = product.toLowerCase().trim();
      let matched: ProductType | null = null;
      
      // Busca por correspondência exata ou parcial
      for (const p of PRODUCTS) {
        const pName = p.name.toLowerCase();
        const pShort = p.shortName.toLowerCase();
        const pId = p.id.toLowerCase();
        
        if (normalized === pName || normalized === pShort || normalized === pId) {
          matched = p.id;
          break;
        }
        if (normalized.includes(pName) || pName.includes(normalized) ||
            normalized.includes(pShort) || pShort.includes(normalized)) {
          matched = p.id;
          break;
        }
      }
      
      // Keywords específicas
      if (!matched) {
        if (normalized.includes('consultoria')) matched = 'consultoria';
        else if (normalized.includes('mentoria') && normalized.includes('marcello')) matched = 'mentoria-marcello-safe';
        else if (normalized.includes('mentoria') && (normalized.includes('coletiva') || normalized.includes('idea'))) matched = 'mentoria-coletiva';
        else if (normalized.includes('mentoria') && normalized.includes('individual')) matched = 'mentoria-individual';
        else if (normalized.includes('curso') && normalized.includes('idea')) matched = 'curso-idea';
        else if (normalized.includes('imersão') || normalized.includes('imersao') || normalized.includes('orderbump')) matched = 'imersao-idea';
        else if (normalized.includes('fraternidade') && normalized.includes('black')) matched = 'fraternidade-safe-black';
        else if (normalized.includes('fraternidade') && (normalized.includes('pró') || normalized.includes('pro'))) matched = 'fraternidade-safe-pro';
        else if (normalized.includes('mqp') || normalized.includes('clube')) matched = 'clube-mqp';
        else if (normalized.includes('safe skills')) matched = 'safe-skills';
        else if (normalized.includes('safe experience')) matched = 'safe-experience';
        else if (normalized.includes('combo')) matched = 'combo-ebooks';
        else if (normalized.includes('guia') || normalized.includes('código') || normalized.includes('codigo') || normalized.includes('prompts')) matched = 'ebook-unitario';
      }
      
      initial[product] = { targetProduct: matched || 'NEW', newProductName: matched ? undefined : product };
    });
    return initial;
  });

  const [newProducts, setNewProducts] = useState<{ id: string; name: string }[]>([]);

  const handleMappingChange = (originalProduct: string, targetProduct: ProductType | 'NEW') => {
    setMapping(prev => ({
      ...prev,
      [originalProduct]: { 
        targetProduct, 
        newProductName: targetProduct === 'NEW' ? (prev[originalProduct]?.newProductName || originalProduct) : undefined 
      }
    }));
  };

  const handleNewProductNameChange = (originalProduct: string, newName: string) => {
    setMapping(prev => ({
      ...prev,
      [originalProduct]: { ...prev[originalProduct], newProductName: newName }
    }));
  };

  const handleConfirm = () => {
    // Coleta novos produtos para criar
    const productsToCreate: { id: string; name: string }[] = [];
    
    Object.entries(mapping).forEach(([original, config]) => {
      if (config.targetProduct === 'NEW' && config.newProductName) {
        const id = config.newProductName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        
        if (!productsToCreate.find(p => p.id === id)) {
          productsToCreate.push({ id, name: config.newProductName });
        }
      }
    });

    onConfirm(mapping, productsToCreate);
  };

  const getMatchedCount = () => {
    return Object.values(mapping).filter(m => m.targetProduct !== 'NEW').length;
  };

  const getNewCount = () => {
    return Object.values(mapping).filter(m => m.targetProduct === 'NEW').length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Correspondência de Produtos</h3>
          <p className="text-sm text-muted-foreground">
            Mapeie os produtos da planilha para os produtos do CRM
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-success/10 text-success">
            {getMatchedCount()} mapeados
          </Badge>
          {getNewCount() > 0 && (
            <Badge variant="outline" className="bg-warning/10 text-warning">
              {getNewCount()} novos
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {detectedProducts.map(product => (
            <div 
              key={product} 
              className="p-3 rounded-lg border border-border bg-card/50 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm truncate flex-1" title={product}>
                  {product}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
              
              <div className="flex gap-2">
                <Select
                  value={mapping[product]?.targetProduct || 'NEW'}
                  onValueChange={(value) => handleMappingChange(product, value as ProductType | 'NEW')}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Criar novo produto
                      </span>
                    </SelectItem>
                    {PRODUCTS.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mapping[product]?.targetProduct === 'NEW' && (
                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">Nome do novo produto</Label>
                  <Input
                    value={mapping[product]?.newProductName || ''}
                    onChange={(e) => handleNewProductNameChange(product, e.target.value)}
                    placeholder="Nome do produto"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm}>
          Confirmar e Importar
        </Button>
      </div>
    </div>
  );
}
