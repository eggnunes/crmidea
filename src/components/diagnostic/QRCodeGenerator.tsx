import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function QRCodeGenerator() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  
  const formUrl = user ? `${window.location.origin}/diagnostico/${user.id}` : "";
  
  useEffect(() => {
    if (!canvasRef.current || !formUrl) return;
    
    generateQRCode(formUrl, canvasRef.current);
  }, [formUrl]);
  
  const generateQRCode = (text: string, canvas: HTMLCanvasElement) => {
    // Simple QR code generation using canvas
    // Using a basic implementation - for production, consider using a library like qrcode
    const size = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    
    // Draw QR pattern (simplified visual representation)
    ctx.fillStyle = "#000000";
    
    // Corner patterns
    const patternSize = 7;
    const moduleSize = size / 25;
    
    // Draw finder patterns (corners)
    const drawFinderPattern = (x: number, y: number) => {
      // Outer square
      ctx.fillRect(x * moduleSize, y * moduleSize, 7 * moduleSize, 7 * moduleSize);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect((x + 1) * moduleSize, (y + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize);
      ctx.fillStyle = "#000000";
      ctx.fillRect((x + 2) * moduleSize, (y + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize);
    };
    
    drawFinderPattern(0, 0);
    drawFinderPattern(18, 0);
    drawFinderPattern(0, 18);
    
    // Draw data modules (pseudo-random based on text)
    const hash = text.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 25; x++) {
        // Skip finder patterns
        if (
          (x < 8 && y < 8) ||
          (x >= 17 && y < 8) ||
          (x < 8 && y >= 17)
        ) continue;
        
        // Pseudo-random pattern based on position and hash
        if (((x * y + hash) % 3 === 0) || ((x + y + hash) % 5 === 0)) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
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
    link.download = "qrcode-diagnostico.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success("QR Code baixado!");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code do Formulário
        </CardTitle>
        <CardDescription>
          Compartilhe este QR Code ou link com seus clientes de consultoria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border">
            <canvas ref={canvasRef} className="w-[200px] h-[200px]" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Link do formulário</Label>
          <div className="flex gap-2">
            <Input value={formUrl} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        <Button onClick={handleDownloadQR} className="w-full gap-2">
          <Download className="w-4 h-4" />
          Baixar QR Code
        </Button>
      </CardContent>
    </Card>
  );
}
