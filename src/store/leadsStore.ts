import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lead, LeadStatus, ProductType, Interaction } from '@/types/crm';

interface LeadsState {
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  addInteraction: (leadId: string, interaction: Omit<Interaction, 'id'>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Sample data for demonstration
const sampleLeads: Lead[] = [
  {
    id: generateId(),
    name: 'Dr. João Silva',
    email: 'joao.silva@advocacia.com',
    phone: '(11) 99999-1234',
    product: 'consultoria',
    status: 'negociacao',
    value: 15000,
    source: 'Instagram',
    notes: 'Escritório com 5 advogados, muito interessado em automação',
    interactions: [
      { id: generateId(), date: '2024-01-15', type: 'whatsapp', description: 'Primeiro contato, demonstrou interesse' },
      { id: generateId(), date: '2024-01-17', type: 'reuniao', description: 'Reunião de apresentação realizada' }
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-17'
  },
  {
    id: generateId(),
    name: 'Dra. Maria Santos',
    email: 'maria@santosadvocacia.com.br',
    phone: '(21) 98888-5678',
    product: 'mentoria-individual',
    status: 'proposta-enviada',
    value: 5000,
    source: 'YouTube',
    notes: 'Advogada trabalhista, quer focar em produtividade',
    interactions: [
      { id: generateId(), date: '2024-01-10', type: 'email', description: 'Enviou formulário de interesse' },
      { id: generateId(), date: '2024-01-12', type: 'ligacao', description: 'Ligação de qualificação' },
      { id: generateId(), date: '2024-01-14', type: 'email', description: 'Proposta enviada' }
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-14'
  },
  {
    id: generateId(),
    name: 'Dr. Carlos Oliveira',
    email: 'carlos@oliveira.adv.br',
    phone: '(31) 97777-9012',
    product: 'curso-idea',
    status: 'novo',
    value: 997,
    source: 'Google',
    notes: 'Advogado iniciante, buscando aprender IA',
    interactions: [],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18'
  },
  {
    id: generateId(),
    name: 'Dra. Ana Costa',
    email: 'ana.costa@legal.com',
    phone: '(41) 96666-3456',
    product: 'mentoria-coletiva',
    status: 'contato-inicial',
    value: 2500,
    source: 'Indicação',
    notes: 'Indicada pelo Dr. João',
    interactions: [
      { id: generateId(), date: '2024-01-16', type: 'whatsapp', description: 'Primeiro contato via WhatsApp' }
    ],
    createdAt: '2024-01-16',
    updatedAt: '2024-01-16'
  },
  {
    id: generateId(),
    name: 'Dr. Pedro Lima',
    email: 'pedro@limalegal.com.br',
    phone: '(51) 95555-7890',
    product: 'combo-ebooks',
    status: 'fechado-ganho',
    value: 149,
    source: 'Instagram',
    notes: 'Comprou o combo, potencial para upgrade',
    interactions: [
      { id: generateId(), date: '2024-01-08', type: 'outro', description: 'Compra realizada pelo site' }
    ],
    createdAt: '2024-01-08',
    updatedAt: '2024-01-08'
  }
];

export const useLeadsStore = create<LeadsState>()(
  persist(
    (set) => ({
      leads: sampleLeads,
      
      addLead: (leadData) => set((state) => ({
        leads: [...state.leads, {
          ...leadData,
          id: generateId(),
          interactions: [],
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        }]
      })),
      
      updateLead: (id, updates) => set((state) => ({
        leads: state.leads.map(lead => 
          lead.id === id 
            ? { ...lead, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
            : lead
        )
      })),
      
      deleteLead: (id) => set((state) => ({
        leads: state.leads.filter(lead => lead.id !== id)
      })),
      
      updateLeadStatus: (id, status) => set((state) => ({
        leads: state.leads.map(lead =>
          lead.id === id
            ? { ...lead, status, updatedAt: new Date().toISOString().split('T')[0] }
            : lead
        )
      })),
      
      addInteraction: (leadId, interaction) => set((state) => ({
        leads: state.leads.map(lead =>
          lead.id === leadId
            ? {
                ...lead,
                interactions: [...lead.interactions, { ...interaction, id: generateId() }],
                updatedAt: new Date().toISOString().split('T')[0]
              }
            : lead
        )
      }))
    }),
    {
      name: 'crm-leads-storage'
    }
  )
);
