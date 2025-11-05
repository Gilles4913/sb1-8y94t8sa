import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vitePublicBackendName = Deno.env.get("VITE_PUBLIC_BACKEND_NAME");
    const nextPublicBackendName = Deno.env.get("NEXT_PUBLIC_BACKEND_NAME");

    const data = {
      RESEND_API_KEY: !!resendApiKey,
      SUPABASE_SERVICE_ROLE: !!supabaseServiceRole,
      SERVICE_ROLE_LENGTH: supabaseServiceRole?.length ?? 0,
      NODE_ENV: Deno.env.get("NODE_ENV") || "unknown",
      BACKEND_NAME: vitePublicBackendName || nextPublicBackendName || "unknown",
    };

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in env-check:", error);

    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
