import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Copy, Check, QrCode, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function QRCodeGenerator() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  
  // URL para página de cadastro (não para o formulário de diagnóstico direto)
  const cadastroUrl = user ? `${window.location.origin}/cadastro-cliente/${user.id}` : "";
  
  useEffect(() => {
    if (!canvasRef.current || !cadastroUrl) return;
    
    QRCode.toCanvas(canvasRef.current, cadastroUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }, (error) => {
      if (error) {
        console.error("Error generating QR code:", error);
      }
    });
  }, [cadastroUrl]);
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(cadastroUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };
  
  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = "qrcode-cadastro-cliente.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("QR Code baixado!");
  };
  
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code para Cadastro de Clientes
        </CardTitle>
        <CardDescription>
          Compartilhe este QR Code ou link para novos clientes se cadastrarem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <canvas ref={canvasRef} className="w-[200px] h-[200px]" />
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <Label>Link de cadastro para clientes</Label>
              <div className="flex gap-2">
                <Input value={cadastroUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={cadastroUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleDownloadQR} className="gap-2">
                <Download className="w-4 h-4" />
                Baixar QR Code
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
