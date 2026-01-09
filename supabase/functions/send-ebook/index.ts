import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "Rafael Nunes <naoresponda@rafaelegg.com>";

// PDF URL from storage - Prompts para Fotos Profissionais
const PDF_URL = "https://ngzodolcmriqlcccpicz.supabase.co/storage/v1/object/public/ebooks/Prompts%20para%20Fotos%20Profissionais.pdf";

interface EbookCaptureRequest {
  name: string;
  email: string;
  phone: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EbookCaptureRequest = await req.json();
    console.log("Received capture request:", JSON.stringify(data));

    const { name, email, phone } = data;

    if (!name || !email || !phone) {
      return new Response(
        JSON.stringify({ error: "Nome, email e telefone são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get admin user to associate leads
    const { data: adminUser } = await supabase
      .from("profiles")
      .select("user_id")
      .limit(1)
      .single();

    const adminUserId = adminUser?.user_id;

    if (!adminUserId) {
      console.error("No admin user found");
      return new Response(
        JSON.stringify({ error: "Erro de configuração do sistema" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if lead already exists by email
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let leadId = existingLead?.id;

    // If lead doesn't exist, create a new one
    if (!leadId) {
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          user_id: adminUserId,
          name: name,
          email: email.toLowerCase(),
          phone: phone,
          product: "ebook_unitario",
          status: "novo",
          source: "evento",
          notes: "Lead capturado via formulário - Prompts para Fotos Profissionais com IA (evento)",
        })
        .select("id")
        .single();

      if (leadError) {
        console.error("Error creating lead:", leadError);
      } else {
        leadId = newLead?.id;
        console.log("Created new lead:", leadId);
      }
    } else {
      console.log("Lead already exists:", leadId);
      // Update notes to append event info
      await supabase
        .from("leads")
        .update({
          notes: "Lead existente - também baixou Prompts para Fotos Profissionais (evento)",
        })
        .eq("id", leadId);
    }

    // Add tag to lead
    if (leadId) {
      await supabase
        .from("lead_tags")
        .upsert({
          lead_id: leadId,
          tag: "evento",
        }, { onConflict: "lead_id,tag" });

      console.log("Added 'evento' tag to lead:", leadId);
    }

    // Save capture record
    const { error: captureError } = await supabase
      .from("ebook_captures")
      .insert({
        name: name,
        email: email.toLowerCase(),
        phone: phone,
        event_source: "evento",
        lead_id: leadId,
        email_sent: false,
      });

    if (captureError) {
      console.error("Error saving capture:", captureError);
    }

    // Sync to WhatsApp contacts
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone) {
      const { data: existingContact } = await supabase
        .from("whatsapp_contacts")
        .select("id")
        .eq("user_id", adminUserId)
        .eq("phone", normalizedPhone)
        .maybeSingle();

      if (!existingContact) {
        await supabase.from("whatsapp_contacts").insert({
          user_id: adminUserId,
          phone: normalizedPhone,
          name: name,
        });
        console.log("Created WhatsApp contact for:", name);
      }
    }

    // Send email with PDF
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6, #d946ef); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #d946ef); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; }
          .highlight { background: #faf5ff; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📸 Seus Prompts Chegaram!</h1>
          <p>Fotos Profissionais com Inteligência Artificial</p>
        </div>
        <div class="content">
          <p>Olá <strong>${name.split(" ")[0]}</strong>,</p>
          
          <p>Muito obrigado pelo interesse! Aqui está o seu material com prompts para criar fotos profissionais usando IA. 🎉</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${PDF_URL}" class="btn">📥 Baixar PDF Agora</a>
          </div>
          
          <div class="highlight">
            <strong>💡 Dica:</strong> Salve este e-mail para acessar os prompts quando quiser! Você pode usar com ChatGPT, Midjourney, Leonardo AI, e outras ferramentas.
          </div>
          
          <h3>O que você vai encontrar no material:</h3>
          <ul>
            <li>📷 Prompts prontos para fotos profissionais</li>
          </ul>
          
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <strong>🚀 Quer ir além com IA?</strong>
            <p style="margin: 10px 0 0;">Conheça a <strong>Consultoria IDEA</strong> - implementação completa de IA no seu negócio com acompanhamento personalizado!</p>
            <p style="margin: 10px 0 0;"><a href="https://rafaelegg.com/consultoria" style="color: #10b981; font-weight: 600;">👉 Acessar Consultoria IDEA</a></p>
          </div>
          
          <div class="footer">
            <p>Dúvidas? Entre em contato conosco pelo WhatsApp.</p>
            <p><strong>Rafael Nunes - Especialista em IA</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to:", email);
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "📸 Seus Prompts para Fotos Profissionais com IA - Baixe Agora!",
      html: emailHtml,
    });
    console.log("Email sent:", emailResponse);

    // Update capture record to mark email as sent
    await supabase
      .from("ebook_captures")
      .update({ email_sent: true })
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Material enviado com sucesso!",
        emailId: emailResponse.data?.id,
        leadId: leadId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in send-ebook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
