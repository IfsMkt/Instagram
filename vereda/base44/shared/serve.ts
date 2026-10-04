// Adaptador HTTP das funções do Base44: autentica pelo request, monta o contexto
// e delega para os handlers compartilhados em ./handlers.js.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { HttpError } from "./handlers.js";

type Handler = (ctx: Record<string, unknown>, input: Record<string, unknown>) => Promise<unknown>;

export function serve(handler: Handler) {
  return async (req: Request): Promise<Response> => {
    try {
      const base44 = createClientFromRequest(req);
      let user = null;
      try {
        user = await base44.auth.me();
      } catch {
        user = null; // visitante
      }
      const input = req.method === "POST" ? await req.json().catch(() => ({})) : {};
      const ctx = {
        user,
        service: base44.asServiceRole.entities,
        now: new Date(),
        allowDraft: false, // em produção, só conteúdo publicado é visível
        deleteAuthUser: async (u: { id: string }) => {
          await base44.asServiceRole.entities.User.delete(u.id);
          return true;
        },
      };
      return Response.json(await handler(ctx, input));
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message, details: error.details ?? null }, { status: error.status });
      }
      console.error(error);
      return Response.json({ error: "Erro inesperado no servidor." }, { status: 500 });
    }
  };
}
