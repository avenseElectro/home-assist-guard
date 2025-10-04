import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Server-side validation schema
const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  subject: z.string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  message: z.string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message must be less than 2000 characters")
});

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData: ContactEmailRequest = await req.json();

    // Validate and sanitize input
    const validatedData = contactFormSchema.parse(rawData);
    const { name, email, subject, message } = validatedData;

    console.log("Received contact form submission:", { name, email, subject });

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "HomeSafe <onboarding@resend.dev>",
      to: [email],
      subject: "Recebemos a sua mensagem! | We received your message!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Obrigado por nos contactar, ${name}!</h1>
          <p>Recebemos a sua mensagem e entraremos em contacto em breve.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Resumo da sua mensagem:</h3>
            <p><strong>Assunto:</strong> ${subject}</p>
            <p><strong>Mensagem:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p>Tempo de resposta estimado:</p>
          <ul>
            <li><strong>Free:</strong> Suporte comunitário (best effort)</li>
            <li><strong>Pro:</strong> 48h úteis</li>
            <li><strong>Business:</strong> 24h úteis</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

          <h2 style="color: #2563eb;">Thank you for contacting us, ${name}!</h2>
          <p>We have received your message and will get back to you soon.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Summary of your message:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p>Expected response time:</p>
          <ul>
            <li><strong>Free:</strong> Community support (best effort)</li>
            <li><strong>Pro:</strong> 48h business days</li>
            <li><strong>Business:</strong> 24h business days</li>
          </ul>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Melhores cumprimentos / Best regards,<br>
            <strong>Equipa HomeSafe / HomeSafe Team</strong>
          </p>
        </div>
      `,
    });

    console.log("User confirmation email sent:", userEmailResponse);

    // Send notification to support team
    const supportEmailResponse = await resend.emails.send({
      from: "HomeSafe Contact Form <onboarding@resend.dev>",
      to: ["support@homesafe.com"], // Change to your actual support email
      subject: `[Contact Form] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Nova mensagem do formulário de contacto</h1>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>De:</strong> ${name} (${email})</p>
            <p><strong>Assunto:</strong> ${subject}</p>
            <p><strong>Mensagem:</strong></p>
            <p style="white-space: pre-wrap; background-color: white; padding: 15px; border-radius: 4px;">${message}</p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Esta mensagem foi enviada através do formulário de contacto em ${new Date().toLocaleString('pt-PT')}
          </p>
        </div>
      `,
    });

    console.log("Support notification email sent:", supportEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        userEmail: userEmailResponse,
        supportEmail: supportEmailResponse
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    
    // Handle validation errors separately
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Validation failed",
          details: error.errors
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
