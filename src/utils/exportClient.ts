import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { CONSULTING_FEATURES } from '@/data/consultingFeatures';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConsultingClientExport {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cpf_cnpj?: string | null;
  oab_number?: string | null;
  office_name: string;
  office_address: string;
  address_number?: string | null;
  address_complement?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  website?: string | null;
  foundation_year?: number | null;
  num_lawyers: number;
  num_employees: number;
  practice_areas?: string | null;
  created_at: string;
  has_used_ai?: boolean | null;
  has_used_chatgpt?: boolean | null;
  has_chatgpt_paid?: boolean | null;
  has_chatgpt_app?: boolean | null;
  ai_familiarity_level?: string | null;
  ai_usage_frequency?: string | null;
  ai_tools_used?: string | null;
  ai_tasks_used?: string | null;
  ai_difficulties?: string | null;
  other_ai_tools?: string | null;
  comfortable_with_tech?: boolean | null;
  case_management_system?: string | null;
  case_management_other?: string | null;
  case_management_flow?: string | null;
  client_service_flow?: string | null;
  selected_features?: number[] | null;
  custom_features?: string | null;
  motivations?: string[] | null;
  motivations_other?: string | null;
  expected_results?: string[] | null;
  expected_results_other?: string | null;
  tasks_to_automate?: string | null;
  logo_url?: string | null;
}

const formatBoolean = (value: boolean | null | undefined): string => {
  if (value === null || value === undefined) return 'Não informado';
  return value ? 'Sim' : 'Não';
};

const formatAddress = (client: ConsultingClientExport): string => {
  const parts = [
    client.office_address,
    client.address_number ? `nº ${client.address_number}` : null,
    client.address_complement,
    client.bairro,
    client.cidade && client.estado ? `${client.cidade} - ${client.estado}` : client.cidade || client.estado,
  ].filter(Boolean);
  return parts.join(', ') || 'Não informado';
};

const getSelectedFeatureNames = (selectedIds: number[] | null | undefined): string[] => {
  if (!selectedIds || selectedIds.length === 0) return ['Nenhuma funcionalidade selecionada'];
  return selectedIds
    .map(id => CONSULTING_FEATURES.find(f => f.id === id))
    .filter(Boolean)
    .map(f => `• ${f!.name}`);
};

const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const loadImageAsArrayBuffer = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    const response = await fetch(url);
    return await response.arrayBuffer();
  } catch {
    return null;
  }
};

export const exportClientToPDF = async (client: ConsultingClientExport): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  const lineHeight = 7;
  const marginLeft = 20;
  const maxWidth = pageWidth - 40;

  // Add logo if available
  if (client.logo_url) {
    try {
      const logoBase64 = await loadImageAsBase64(client.logo_url);
      if (logoBase64) {
        const logoHeight = 25;
        const logoWidth = 50;
        doc.addImage(logoBase64, 'PNG', pageWidth / 2 - logoWidth / 2, y, logoWidth, logoHeight);
        y += logoHeight + 10;
      }
    } catch (e) {
      console.log('Could not load logo for PDF');
    }
  }

  const addTitle = (text: string) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(text, marginLeft, y);
    y += lineHeight + 3;
    doc.setDrawColor(200);
    doc.line(marginLeft, y - 2, pageWidth - marginLeft, y - 2);
    y += 3;
  };

  const addField = (label: string, value: string) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, marginLeft, y);
    doc.setFont('helvetica', 'normal');
    
    const labelWidth = doc.getTextWidth(`${label}: `);
    const valueLines = doc.splitTextToSize(value || 'Não informado', maxWidth - labelWidth);
    
    if (valueLines.length === 1) {
      doc.text(value || 'Não informado', marginLeft + labelWidth, y);
      y += lineHeight;
    } else {
      y += lineHeight;
      valueLines.forEach((line: string) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, marginLeft + 5, y);
        y += lineHeight - 1;
      });
    }
  };

  const addMultilineField = (label: string, value: string) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, marginLeft, y);
    y += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value || 'Não informado', maxWidth - 5);
    lines.forEach((line: string) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, marginLeft + 5, y);
      y += lineHeight - 1;
    });
    y += 2;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DIAGNÓSTICO ESTRATÉGICO', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(14);
  doc.text(`Consultoria IDEA - ${client.office_name}`, pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Section 1: Basic Info
  addTitle('1. INFORMAÇÕES BÁSICAS DO ESCRITÓRIO');
  addField('Nome completo', client.full_name);
  addField('Telefone', client.phone);
  addField('E-mail', client.email);
  if (client.cpf_cnpj) addField('CPF/CNPJ', client.cpf_cnpj);
  if (client.oab_number) addField('OAB', client.oab_number);
  addField('Nome do escritório', client.office_name);
  addField('Endereço', formatAddress(client));
  if (client.website) addField('Website', client.website);
  addField('Ano de fundação', client.foundation_year?.toString() || 'Não informado');
  addField('Número de advogados', client.num_lawyers.toString());
  addField('Total de colaboradores', client.num_employees.toString());
  if (client.practice_areas) addMultilineField('Áreas de atuação', client.practice_areas);
  y += 5;

  // Section 2: AI Experience
  addTitle('2. CONHECIMENTO E USO DE IA');
  addField('Já utilizou IA', formatBoolean(client.has_used_ai));
  addField('Já utilizou ChatGPT', formatBoolean(client.has_used_chatgpt));
  addField('Tem ChatGPT pago', formatBoolean(client.has_chatgpt_paid));
  addField('Tem app do ChatGPT', formatBoolean(client.has_chatgpt_app));
  addField('Nível de familiaridade', client.ai_familiarity_level || 'Não informado');
  addField('Frequência de uso', client.ai_usage_frequency || 'Não informado');
  if (client.ai_tools_used) addMultilineField('Ferramentas de IA utilizadas', client.ai_tools_used);
  if (client.ai_tasks_used) addMultilineField('Tarefas com IA', client.ai_tasks_used);
  if (client.ai_difficulties) addMultilineField('Dificuldades com IA', client.ai_difficulties);
  if (client.other_ai_tools) addMultilineField('Outras IAs utilizadas', client.other_ai_tools);
  addField('Confortável com tecnologia', formatBoolean(client.comfortable_with_tech));
  y += 5;

  // Section 3: Processes
  addTitle('3. PROCESSOS E FLUXOS DE TRABALHO');
  addField('Sistema de gestão processual', client.case_management_system || 'Não informado');
  if (client.case_management_other) addField('Outro sistema', client.case_management_other);
  if (client.client_service_flow) addMultilineField('Fluxo de atendimento ao cliente', client.client_service_flow);
  if (client.case_management_flow) addMultilineField('Fluxo de gestão de processos', client.case_management_flow);
  y += 5;

  // Section 4: Expectations
  addTitle('4. EXPECTATIVAS E MOTIVAÇÕES');
  if (client.tasks_to_automate) addMultilineField('Tarefas a automatizar', client.tasks_to_automate);
  if (client.motivations && client.motivations.length > 0) {
    addMultilineField('Motivações', client.motivations.join(', '));
  }
  if (client.motivations_other) addField('Outras motivações', client.motivations_other);
  if (client.expected_results && client.expected_results.length > 0) {
    addMultilineField('Resultados esperados', client.expected_results.join(', '));
  }
  if (client.expected_results_other) addField('Outros resultados', client.expected_results_other);
  y += 5;

  // Section 5: Features
  addTitle('5. FUNCIONALIDADES DESEJADAS');
  const featureNames = getSelectedFeatureNames(client.selected_features);
  featureNames.forEach(name => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(name, marginLeft + 5, y);
    y += lineHeight - 1;
  });
  if (client.custom_features) {
    y += 3;
    addMultilineField('Funcionalidades adicionais', client.custom_features);
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    290,
    { align: 'center' }
  );

  // Save
  const fileName = `diagnostico-${client.office_name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
  doc.save(fileName);
};

export const exportClientToDOCX = async (client: ConsultingClientExport): Promise<void> => {
  const featureNames = getSelectedFeatureNames(client.selected_features);

  const createParagraph = (text: string, heading?: typeof HeadingLevel[keyof typeof HeadingLevel]) => {
    return new Paragraph({
      text,
      heading,
      spacing: { after: 100 },
    });
  };

  const createFieldParagraph = (label: string, value: string) => {
    return new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true }),
        new TextRun(value || 'Não informado'),
      ],
      spacing: { after: 100 },
    });
  };

  // Build header children array
  const headerChildren: Paragraph[] = [];
  
  // Try to add logo
  if (client.logo_url) {
    try {
      const logoBuffer = await loadImageAsArrayBuffer(client.logo_url);
      if (logoBuffer) {
        headerChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBuffer,
                transformation: {
                  width: 150,
                  height: 75,
                },
                type: 'png',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }
    } catch (e) {
      console.log('Could not load logo for DOCX');
    }
  }

  headerChildren.push(
    new Paragraph({
      text: 'DIAGNÓSTICO ESTRATÉGICO',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        ...headerChildren,
        new Paragraph({
          text: `Consultoria IDEA - ${client.office_name}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Data: ${format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Section 1
        createParagraph('1. INFORMAÇÕES BÁSICAS DO ESCRITÓRIO', HeadingLevel.HEADING_2),
        createFieldParagraph('Nome completo', client.full_name),
        createFieldParagraph('Telefone', client.phone),
        createFieldParagraph('E-mail', client.email),
        ...(client.cpf_cnpj ? [createFieldParagraph('CPF/CNPJ', client.cpf_cnpj)] : []),
        ...(client.oab_number ? [createFieldParagraph('OAB', client.oab_number)] : []),
        createFieldParagraph('Nome do escritório', client.office_name),
        createFieldParagraph('Endereço', formatAddress(client)),
        ...(client.website ? [createFieldParagraph('Website', client.website)] : []),
        createFieldParagraph('Ano de fundação', client.foundation_year?.toString() || 'Não informado'),
        createFieldParagraph('Número de advogados', client.num_lawyers.toString()),
        createFieldParagraph('Total de colaboradores', client.num_employees.toString()),
        ...(client.practice_areas ? [createFieldParagraph('Áreas de atuação', client.practice_areas)] : []),

        // Section 2
        new Paragraph({ text: '', spacing: { after: 200 } }),
        createParagraph('2. CONHECIMENTO E USO DE IA', HeadingLevel.HEADING_2),
        createFieldParagraph('Já utilizou IA', formatBoolean(client.has_used_ai)),
        createFieldParagraph('Já utilizou ChatGPT', formatBoolean(client.has_used_chatgpt)),
        createFieldParagraph('Tem ChatGPT pago', formatBoolean(client.has_chatgpt_paid)),
        createFieldParagraph('Tem app do ChatGPT', formatBoolean(client.has_chatgpt_app)),
        createFieldParagraph('Nível de familiaridade', client.ai_familiarity_level || 'Não informado'),
        createFieldParagraph('Frequência de uso', client.ai_usage_frequency || 'Não informado'),
        ...(client.ai_tools_used ? [createFieldParagraph('Ferramentas utilizadas', client.ai_tools_used)] : []),
        ...(client.ai_tasks_used ? [createFieldParagraph('Tarefas com IA', client.ai_tasks_used)] : []),
        ...(client.ai_difficulties ? [createFieldParagraph('Dificuldades', client.ai_difficulties)] : []),
        ...(client.other_ai_tools ? [createFieldParagraph('Outras IAs', client.other_ai_tools)] : []),
        createFieldParagraph('Confortável com tecnologia', formatBoolean(client.comfortable_with_tech)),

        // Section 3
        new Paragraph({ text: '', spacing: { after: 200 } }),
        createParagraph('3. PROCESSOS E FLUXOS DE TRABALHO', HeadingLevel.HEADING_2),
        createFieldParagraph('Sistema de gestão processual', client.case_management_system || 'Não informado'),
        ...(client.case_management_other ? [createFieldParagraph('Outro sistema', client.case_management_other)] : []),
        ...(client.client_service_flow ? [createFieldParagraph('Fluxo de atendimento', client.client_service_flow)] : []),
        ...(client.case_management_flow ? [createFieldParagraph('Fluxo de processos', client.case_management_flow)] : []),

        // Section 4
        new Paragraph({ text: '', spacing: { after: 200 } }),
        createParagraph('4. EXPECTATIVAS E MOTIVAÇÕES', HeadingLevel.HEADING_2),
        ...(client.tasks_to_automate ? [createFieldParagraph('Tarefas a automatizar', client.tasks_to_automate)] : []),
        ...(client.motivations?.length ? [createFieldParagraph('Motivações', client.motivations.join(', '))] : []),
        ...(client.motivations_other ? [createFieldParagraph('Outras motivações', client.motivations_other)] : []),
        ...(client.expected_results?.length ? [createFieldParagraph('Resultados esperados', client.expected_results.join(', '))] : []),
        ...(client.expected_results_other ? [createFieldParagraph('Outros resultados', client.expected_results_other)] : []),

        // Section 5
        new Paragraph({ text: '', spacing: { after: 200 } }),
        createParagraph('5. FUNCIONALIDADES DESEJADAS', HeadingLevel.HEADING_2),
        ...featureNames.map(name => new Paragraph({ text: name, spacing: { after: 50 } })),
        ...(client.custom_features ? [
          new Paragraph({ text: '', spacing: { after: 100 } }),
          createFieldParagraph('Funcionalidades adicionais', client.custom_features),
        ] : []),

        // Footer
        new Paragraph({ text: '', spacing: { after: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
              italics: true,
              size: 18,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `diagnostico-${client.office_name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.docx`;
  saveAs(blob, fileName);
};
