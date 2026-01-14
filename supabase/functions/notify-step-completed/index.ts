import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientId,
      clientName, 
      clientPhone, 
      completedStep, 
      completedStepTitle,
      totalSteps,
      nextStepTitle,
      nextStepOrder
    } = await req.json();

    console.log("Sending step completion notification:", { 
      clientId, 
      clientName, 
      completedStep, 
      totalSteps 
    });

    const ZAPI_INSTANCE_ID = Deno.env.get("ZAPI_INSTANCE_ID");
    const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");
    const ZAPI_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN");

    if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
      console.log("Z-API credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Z-API not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!clientPhone) {
      console.log("No client phone provided");
      return new Response(
        JSON.stringify({ success: false, error: "No phone provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number
    let formattedPhone = clientPhone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    // Calculate progress
    const progressPercent = Math.round((completedStep / totalSteps) * 100);
    const remainingSteps = totalSteps - completedStep;

    // Create message based on progress
    let message = "";
    
    if (completedStep === totalSteps) {
      // All steps completed - celebration message!
      message = `🎉🎉🎉 *PARABÉNS, ${clientName.split(" ")[0]}!* 🎉🎉🎉

Você concluiu TODAS as ${totalSteps} etapas da implementação da sua intranet!

🏆 *SUA INTRANET ESTÁ COMPLETA!*

Agora você tem uma intranet jurídica totalmente personalizada, pronta para revolucionar a gestão do seu escritório.

📊 *Conquista:*
${Array(10).fill('🟩').join('')} 100%

💡 *Próximos passos:*
1. Teste todas as funcionalidades
2. Personalize as configurações
3. Convide sua equipe
4. Comece a usar no dia a dia!

Qualquer dúvida sobre a utilização, estou à disposição.

*Parabéns pela dedicação!* 🚀

_Rafael Egg - Consultoria IDEA_`;
    } else {
      // Progress message with next step info
      const progressBar = Array(10)
        .fill('')
        .map((_, i) => i < Math.floor(progressPercent / 10) ? '🟩' : '⬜')
        .join('');

      message = `✅ *Etapa ${completedStep} Concluída!*

Olá, ${clientName.split(" ")[0]}! 👋

Parabéns! Você acabou de concluir a *Etapa ${completedStep}: ${completedStepTitle}* 🎉

📊 *Seu Progresso:*
${progressBar} ${progressPercent}%
${completedStep}/${totalSteps} etapas concluídas

${nextStepTitle ? `
🚀 *Próxima Etapa:*
*Etapa ${nextStepOrder}: ${nextStepTitle}*

Continue no mesmo ritmo! ${remainingSteps === 1 ? 'Falta apenas 1 etapa!' : `Faltam apenas ${remainingSteps} etapas!`}
` : ''}
💪 Você está indo muito bem! Continue assim!

_Rafael Egg - Consultoria IDEA_`;
    }

    // Send WhatsApp message via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;

    const response = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ZAPI_CLIENT_TOKEN && { "Client-Token": ZAPI_CLIENT_TOKEN }),
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const result = await response.json();
    console.log("Z-API response:", result);

    if (!response.ok) {
      throw new Error(`Z-API error: ${JSON.stringify(result)}`);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-step-completed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
