export type ProductType = 
  | 'consultoria'
  | 'mentoria-coletiva'
  | 'mentoria-individual'
  | 'curso-idea'
  | 'guia-ia'
  | 'codigo-prompts'
  | 'combo-ebooks';

export type LeadStatus = 
  | 'novo'
  | 'contato-inicial'
  | 'negociacao'
  | 'proposta-enviada'
  | 'fechado-ganho'
  | 'fechado-perdido';

export interface Product {
  id: ProductType;
  name: string;
  shortName: string;
  price: string;
  color: string;
  description: string;
}

export interface Interaction {
  id: string;
  date: string;
  type: 'whatsapp' | 'email' | 'ligacao' | 'reuniao' | 'outro';
  description: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  product: ProductType;
  status: LeadStatus;
  value: number;
  source: string;
  notes: string;
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'consultoria',
    name: 'Consultoria IDEA',
    shortName: 'Consultoria',
    price: 'Alto Ticket',
    color: 'consultoria',
    description: 'Implementação completa de IA no escritório'
  },
  {
    id: 'mentoria-coletiva',
    name: 'Mentoria IDEA (Coletiva)',
    shortName: 'Mentoria Col.',
    price: 'Médio Ticket',
    color: 'mentoria',
    description: 'Mentoria em grupo sobre IA para advogados'
  },
  {
    id: 'mentoria-individual',
    name: 'Mentoria IDEA (Individual)',
    shortName: 'Mentoria Ind.',
    price: 'Médio-Alto Ticket',
    color: 'mentoria',
    description: 'Mentoria individual personalizada'
  },
  {
    id: 'curso-idea',
    name: 'Curso IDEA',
    shortName: 'Curso',
    price: 'Baixo-Médio Ticket',
    color: 'curso',
    description: '11 módulos e 70+ aulas sobre IA na advocacia'
  },
  {
    id: 'guia-ia',
    name: 'Guia de IA para Advogados',
    shortName: 'Guia IA',
    price: 'R$ 99',
    color: 'ebook',
    description: 'E-book com fundamentos de IA'
  },
  {
    id: 'codigo-prompts',
    name: 'Código dos Prompts',
    shortName: 'Prompts',
    price: 'R$ 99',
    color: 'ebook',
    description: 'E-book com método P.R.O.M.P.T.'
  },
  {
    id: 'combo-ebooks',
    name: 'Combo de E-books',
    shortName: 'Combo',
    price: 'R$ 149',
    color: 'ebook',
    description: '2 e-books + bônus ferramentas de IA'
  }
];

export const STATUSES: { id: LeadStatus; name: string; color: string }[] = [
  { id: 'novo', name: 'Novo Lead', color: 'info' },
  { id: 'contato-inicial', name: 'Contato Inicial', color: 'primary' },
  { id: 'negociacao', name: 'Em Negociação', color: 'warning' },
  { id: 'proposta-enviada', name: 'Proposta Enviada', color: 'mentoria' },
  { id: 'fechado-ganho', name: 'Fechado (Ganho)', color: 'success' },
  { id: 'fechado-perdido', name: 'Fechado (Perdido)', color: 'destructive' }
];
