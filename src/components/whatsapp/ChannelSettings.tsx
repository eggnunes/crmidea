import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageCircle, Instagram, Facebook, Music2, Mail, Send, ExternalLink, Copy, Check, Bot } from "lucide-react";
import { useChannelConfigs, ChannelType } from "@/hooks/useChannelConfigs";
import { toast } from "sonner";

const CHANNELS = [
  {
    id: 'whatsapp' as ChannelType,
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500',
    description: 'Conectado via Z-API',
    configurable: false,
    hasAI: true
  },
  {
    id: 'instagram' as ChannelType,
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Instagram Direct Messages via Meta API',
    configurable: true,
    hasAI: true,
    fields: ['access_token', 'page_id']
  },
  {
    id: 'facebook' as ChannelType,
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Facebook Messenger via Meta API',
    configurable: true,
    hasAI: true,
    fields: ['access_token', 'page_id']
  },
  {
    id: 'tiktok' as ChannelType,
    name: 'TikTok',
    icon: Music2,
    color: 'bg-black',
    description: 'TikTok Messages (em breve)',
    configurable: false,
    hasAI: false,
    comingSoon: true
  },
  {
    id: 'telegram' as ChannelType,
    name: 'Telegram',
    icon: Send,
    color: 'bg-sky-500',
    description: 'Telegram Bot API (em breve)',
    configurable: false,
    hasAI: false,
    comingSoon: true
  },
  {
    id: 'email' as ChannelType,
    name: 'Email',
    icon: Mail,
    color: 'bg-gray-600',
    description: 'Email via SMTP/API (em breve)',
    configurable: false,
    hasAI: false,
    comingSoon: true
  }
];

export function ChannelSettings() {
  const { configs, loading, getChannelConfig, saveChannelConfig, toggleChannel, toggleAI } = useChannelConfigs();
  const [editingChannel, setEditingChannel] = useState<ChannelType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const getWebhookUrl = (channel: ChannelType) => {
    if (channel === 'instagram') {
      return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-webhook`;
    }
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-webhook`;
  };

  const handleCopyWebhook = async (channel: ChannelType) => {
    const url = getWebhookUrl(channel);
    await navigator.clipboard.writeText(url);
    setCopied(channel);
    toast.success('URL do webhook copiada!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleEdit = (channel: ChannelType) => {
    const config = getChannelConfig(channel);
    setFormData({
      access_token: config?.access_token || '',
      page_id: config?.page_id || ''
    });
    setEditingChannel(channel);
  };

  const handleSave = async () => {
    if (!editingChannel) return;
    
    setSaving(true);
    try {
      await saveChannelConfig(editingChannel, {
        access_token: formData.access_token,
        page_id: formData.page_id,
        webhook_verify_token: crypto.randomUUID()
      });
      setEditingChannel(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Canais de Comunicação</h3>
        <p className="text-sm text-muted-foreground">
          Configure e gerencie seus canais de atendimento omnichannel.
        </p>
      </div>

      <div className="grid gap-4">
        {CHANNELS.map((channel) => {
          const config = getChannelConfig(channel.id);
          const Icon = channel.icon;
          const isEditing = editingChannel === channel.id;
          const isWhatsApp = channel.id === 'whatsapp';
          
          return (
            <Card key={channel.id} className={channel.comingSoon ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${channel.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {channel.name}
                        {channel.comingSoon && (
                          <Badge variant="secondary" className="text-xs">Em breve</Badge>
                        )}
                        {config?.is_active && !channel.comingSoon && !isWhatsApp && (
                          <Badge variant="default" className="text-xs bg-green-500">Ativo</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </div>
                  </div>
                  
                  {!channel.comingSoon && !isWhatsApp && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config?.is_active || false}
                        onCheckedChange={(checked) => toggleChannel(channel.id, checked)}
                        disabled={!config?.access_token}
                      />
                      {channel.configurable && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(channel.id)}
                        >
                          Configurar
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {isWhatsApp && (
                    <Badge variant="default" className="bg-green-500">Conectado via Z-API</Badge>
                  )}
                </div>
              </CardHeader>
              
              {/* AI Toggle Section */}
              {channel.hasAI && !channel.comingSoon && (config?.is_active || isWhatsApp) && (
                <CardContent className="pt-0 pb-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">IA Automática</p>
                        <p className="text-xs text-muted-foreground">
                          Respostas automáticas para este canal
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isWhatsApp ? true : (config?.ai_enabled ?? true)}
                      onCheckedChange={(checked) => toggleAI(channel.id, checked)}
                      disabled={isWhatsApp}
                    />
                  </div>
                  {isWhatsApp && (
                    <p className="text-xs text-muted-foreground mt-2">
                      A IA do WhatsApp é controlada nas configurações principais do assistente.
                    </p>
                  )}
                </CardContent>
              )}
              
              {isEditing && (
                <CardContent className="space-y-4 border-t pt-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-sm">📋 Passo a passo para configurar:</h4>
                    <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                      <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Meta for Developers</a> e crie um App</li>
                      <li>Adicione o produto "{channel.id === 'instagram' ? 'Instagram' : 'Messenger'}" ao seu App</li>
                      <li>Gere um Access Token com permissões de mensagens</li>
                      <li>Configure o Webhook URL abaixo no painel do Meta</li>
                      <li>Inscreva-se nos eventos de mensagens</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <Label>Access Token (Meta)</Label>
                    <Input
                      type="password"
                      value={formData.access_token || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                      placeholder="Digite seu Access Token do Meta"
                    />
                    <p className="text-xs text-muted-foreground">
                      Token de acesso com permissões: {channel.id === 'instagram' ? 'instagram_manage_messages, instagram_basic' : 'pages_messaging, pages_manage_metadata'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{channel.id === 'instagram' ? 'Instagram Business Account ID' : 'Facebook Page ID'}</Label>
                    <Input
                      value={formData.page_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, page_id: e.target.value }))}
                      placeholder={channel.id === 'instagram' ? 'ID da conta Instagram Business' : 'ID da página do Facebook'}
                    />
                    <p className="text-xs text-muted-foreground">
                      {channel.id === 'instagram' 
                        ? 'Encontre em: Business Suite → Configurações → Instagram → ID da conta'
                        : 'Encontre em: Configurações da Página → Sobre → ID da Página'
                      }
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Webhook URL (configure no Meta)</Label>
                    <div className="flex gap-2">
                      <Input value={getWebhookUrl(channel.id)} readOnly className="font-mono text-xs bg-muted" />
                      <Button variant="outline" size="icon" onClick={() => handleCopyWebhook(channel.id)}>
                        {copied === channel.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Verify Token (para validação do webhook)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={config?.webhook_verify_token || 'Será gerado ao salvar'} 
                        readOnly 
                        className="font-mono text-xs bg-muted" 
                      />
                      {config?.webhook_verify_token && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => {
                            navigator.clipboard.writeText(config.webhook_verify_token || '');
                            toast.success('Verify Token copiado!');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use este token no campo "Verify Token" ao configurar o webhook no Meta.
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar Configurações
                    </Button>
                    <Button variant="outline" onClick={() => setEditingChannel(null)}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
