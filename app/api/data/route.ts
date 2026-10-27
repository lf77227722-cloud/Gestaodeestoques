import { authenticatedClient } from "@/lib/server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const context = await authenticatedClient(request);
  if (!context) return Response.json({ error: "Acesso não autorizado" }, { status: 401 });
  const names = ["products", "ingredients", "recipes", "sales", "expenses", "movements"] as const;
  const result: Record<string, unknown[]> = {};
  for (const name of names) {
    const { data, error } = await context.db.from(name).select("*").order("created_at", { ascending: false });
    if (error) return Response.json({ error: "Falha ao carregar dados" }, { status: 500 });
    result[name] = name === "sales" ? (data ?? []).map(row => ({ ...row, recipe_snapshot: JSON.stringify(row.recipe_snapshot) })) : data ?? [];
  }
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
