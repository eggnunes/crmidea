import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Instagram, Facebook, Music2, Mail, Send, ExternalLink, Copy, Check } from "lucide-react";
import { useChannelConfigs, ChannelType } from "@/hooks/useChannelConfigs";
import { toast } from "sonner";

const CHANNELS = [
  {
    id: 'whatsapp' as ChannelType,
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-500',
    description: 'Conectado via Z-API',
    configurable: false
  },
  {
    id: 'instagram' as ChannelType,
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Instagram Direct Messages via Meta API',
    configurable: true,
    fields: ['access_token', 'page_id']
  },
  {
    id: 'facebook' as ChannelType,
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    description: 'Facebook Messenger via Meta API',
    configurable: true,
    fields: ['access_token', 'page_id']
  },
  {
    id: 'tiktok' as ChannelType,
    name: 'TikTok',
    icon: Music2,
    color: 'bg-black',
    description: 'TikTok Messages (em breve)',
    configurable: false,
    comingSoon: true
  },
  {
    id: 'telegram' as ChannelType,
    name: 'Telegram',
    icon: Send,
    color: 'bg-sky-500',
    description: 'Telegram Bot API (em breve)',
    configurable: false,
    comingSoon: true
  },
  {
    id: 'email' as ChannelType,
    name: 'Email',
    icon: Mail,
    color: 'bg-gray-600',
    description: 'Email via SMTP/API (em breve)',
    configurable: false,
    comingSoon: true
  }
];

export function ChannelSettings() {
  const { configs, loading, getChannelConfig, saveChannelConfig, toggleChannel } = useChannelConfigs();
  const [editingChannel, setEditingChannel] = useState<ChannelType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/instagram-webhook`;

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('URL do webhook copiada!');
    setTimeout(() => setCopied(false), 2000);
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
                        {config?.is_active && !channel.comingSoon && (
                          <Badge variant="default" className="text-xs bg-green-500">Ativo</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </div>
                  </div>
                  
                  {!channel.comingSoon && channel.id !== 'whatsapp' && (
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
                  
                  {channel.id === 'whatsapp' && (
                    <Badge variant="default" className="bg-green-500">Conectado via Z-API</Badge>
                  )}
                </div>
              </CardHeader>
              
              {isEditing && (
                <CardContent className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label>Access Token (Meta)</Label>
                    <Input
                      type="password"
                      value={formData.access_token || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                      placeholder="Digite seu Access Token do Meta"
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtenha em{' '}
                      <a 
                        href="https://developers.facebook.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Meta for Developers <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Page ID / Instagram Business Account ID</Label>
                    <Input
                      value={formData.page_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, page_id: e.target.value }))}
                      placeholder="ID da página ou conta"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook URL (para configurar no Meta)</Label>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Configure este URL como webhook callback no painel do Meta.
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar
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
