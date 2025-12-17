import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { WelcomeTemplate } from '@/types/notifications';

const defaultTemplates: Record<string, string> = {
  consultoria: `🎯 *Parabéns pela decisão, {{nome}}!*

Seja muito bem-vindo(a) à *Consultoria de IA para Escritórios de Advocacia*! 🚀

Esta é uma jornada de transformação digital personalizada para seu escritório. Em breve, entrarei em contato para agendar nossa primeira reunião estratégica.

Prepare-se para revolucionar a forma como você trabalha! 💼

_Rafael Nogueira - IDEA_

💬 Se precisar falar diretamente comigo, digite *"falar com Rafael"* a qualquer momento.`,
  
  mentoria_coletiva: `🌟 *Bem-vindo(a) à Mentoria Coletiva, {{nome}}!*

Parabéns pela sua decisão de investir no seu desenvolvimento profissional! 🎓

Você faz parte agora de um grupo seleto de advogados que estão na vanguarda da tecnologia.

Em breve você receberá todos os detalhes de acesso e nosso cronograma.

_Equipe IDEA_

💬 Se precisar falar diretamente comigo, digite *"falar com Rafael"* a qualquer momento.`,
  
  mentoria_individual: `🌟 *Bem-vindo(a) à Mentoria Individual, {{nome}}!*

Parabéns pela sua decisão de investir no seu desenvolvimento profissional! 🎓

Você terá acompanhamento exclusivo e personalizado para dominar a IA na advocacia.

Em breve você receberá todos os detalhes de acesso e nosso cronograma.

_Equipe IDEA_

💬 Se precisar falar diretamente comigo, digite *"falar com Rafael"* a qualquer momento.`,
  
  curso_idea: `🎉 *Parabéns, {{nome}}!*

Seja muito bem-vindo(a) ao *Curso IDEA* - 11 módulos e mais de 70 aulas sobre Inteligência Artificial na Advocacia! 📚

Você está prestes a descobrir como a IA pode transformar sua prática jurídica. Seu acesso será liberado em instantes!

Prepare-se para uma jornada incrível de aprendizado! 🚀

_Equipe IDEA_

💬 Se precisar falar diretamente comigo, digite *"falar com Rafael"* a qualquer momento.`,
  
  guia_ia: `📖 *Excelente escolha, {{nome}}!*

Seja bem-vindo(a) ao *Guia de IA para Advogados*! ⚖️

Este e-book vai te dar uma visão completa de como aplicar Inteligência Artificial no seu dia a dia jurídico.

Seu acesso será enviado em instantes. Boa leitura! 📱

_Equipe IDEA_

💬 Se precisar falar diretamente comigo, digite *"falar com Rafael"* a qualquer momento.`,
  
  codigo_prompts: `🔑 *Parabéns pela aquisição, {{nome}}!*

Seja bem-vindo(a) ao *Código de Prompts*! 💡

Você agora tem acesso a uma biblioteca de prompts prontos e otimizados para advogados. Prepare-se para acelerar seu trabalho com IA!

Seu acesso será enviado em instantes.

_Equipe IDEA_

💬 Se precisar falar diretamente comigo, digite *"falar com Rafael"* a qualquer momento.`,
  
  combo_ebooks: `📚 *Incrível, {{nome}}!*

Você adquiriu o *Combo Completo de E-books*! 🎁

Guia de IA para Advogados + Código de Prompts + bônus exclusivos. Tudo que você precisa para dominar a IA na advocacia!

Seus acessos serão enviados em instantes. Aproveite! 🚀

_Equipe IDEA_

💬 Se precisar falar diretamente comigo, digite *"falar com Rafael"* a qualquer momento.`,
};

export function useWelcomeTemplates() {
  const [templates, setTemplates] = useState<WelcomeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('welcome_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('product_type');

      if (error) throw error;

      setTemplates((data || []) as WelcomeTemplate[]);
    } catch (error) {
      console.error('Error fetching welcome templates:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveTemplate = useCallback(async (productType: string, messageTemplate: string) => {
    if (!user) return;

    try {
      const existing = templates.find(t => t.product_type === productType);

      if (existing) {
        const { error } = await supabase
          .from('welcome_templates')
          .update({ message_template: messageTemplate })
          .eq('id', existing.id);

        if (error) throw error;

        setTemplates(prev => prev.map(t => 
          t.id === existing.id ? { ...t, message_template: messageTemplate } : t
        ));
      } else {
        const { data, error } = await supabase
          .from('welcome_templates')
          .insert({
            user_id: user.id,
            product_type: productType,
            message_template: messageTemplate,
          })
          .select()
          .single();

        if (error) throw error;

        setTemplates(prev => [...prev, data as WelcomeTemplate]);
      }

      toast({
        title: 'Template salvo',
        description: 'O template de boas-vindas foi atualizado.',
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o template.',
        variant: 'destructive',
      });
    }
  }, [user, templates, toast]);

  const getTemplate = useCallback((productType: string): string => {
    const template = templates.find(t => t.product_type === productType);
    return template?.message_template || defaultTemplates[productType] || '';
  }, [templates]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    saveTemplate,
    getTemplate,
    defaultTemplates,
    refetch: fetchTemplates,
  };
}
