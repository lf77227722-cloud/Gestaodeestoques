import { authenticatedClient } from "@/lib/server";
import type { SupabaseClient } from "@supabase/supabase-js";
export const dynamic="force-dynamic";
type Row=Record<string,unknown>;
const schemas:Record<string,Record<string,"text"|"number"|"optionalText"|"optionalNumber">>={
  products:{name:"text",category:"text",price_cents:"number",packaging_cents:"number"},
  ingredients:{name:"text",unit:"text",opening_qty:"number",unit_cost_cents:"number",min_qty:"number"},
  recipes:{product_id:"text",ingredient_id:"text",qty:"number"},
  sales:{date:"text",product_id:"text",product_name:"text",qty:"number",unit_price_cents:"number",discount_cents:"number",delivery_cents:"number",fee_cents:"number",channel:"text",payment:"text",received_at:"optionalText",note:"optionalText"},
  expenses:{date:"text",description:"text",category:"text",amount_cents:"number",due_at:"optionalText",paid_at:"optionalText",paid_cents:"optionalNumber",note:"optionalText"},
  movements:{date:"text",ingredient_id:"text",kind:"text",qty:"number",note:"optionalText"},
};
function clean(table:string,payload:Row){
  const result:Row={};
  for(const [key,type] of Object.entries(schemas[table])){
    const value=payload[key];
    if(type==="text"||type==="optionalText"){
      if(value==null||value===""){if(type==="text")throw Error(`Preencha ${key}`);result[key]=null;}
      else if(typeof value==="string"&&value.trim().length<=180)result[key]=value.trim();
      else throw Error(`Valor inválido: ${key}`);
    } else if(value==null||value===""){
      if(type==="optionalNumber")result[key]=null;else throw Error(`Preencha ${key}`);
    } else if(typeof value==="number"&&Number.isFinite(value)&&value>=0&&(key!=="qty"||value>0))result[key]=value;
    else throw Error(`Número inválido: ${key}`);
  }
  for(const key of ["date","received_at","paid_at","due_at"])if(typeof result[key]==="string"&&!/^\d{4}-\d{2}-\d{2}$/.test(result[key]))throw Error("Data inválida");
  return result;
}
async function exists(db: SupabaseClient, table: string, id: string) {
  const { data, error } = await db.from(table).select("id").eq("id",id).maybeSingle();
  if(error) throw error;
  return !!data;
}
export async function POST(request: Request) {
  const context = await authenticatedClient(request);
  if(!context) return Response.json({error:"Acesso não autorizado"},{status:401});
  const {db,user}=context;
  try {
    const body=await request.json() as {table?:string;action?:string;id?:string;data?:Row};
    const {table,action,id}=body;
    if(!table||!schemas[table]||!["save","delete"].includes(action??""))return Response.json({error:"Ação inválida"},{status:400});
    if(action==="delete") {
      if(!id||!(await exists(db,table,id)))return Response.json({error:"Registro não encontrado"},{status:404});
      if(table==="products"||table==="ingredients") {
        const field=table==="products"?"product_id":"ingredient_id";
        const {data:linked}=await db.from("recipes").select("id").eq(field,id).limit(1);
        if(linked?.length)return Response.json({error:"Remova a ficha vinculada antes de excluir"},{status:409});
        const dependent=table==="products"?"sales":"movements";
        const {data:used}=await db.from(dependent).select("id").eq(field,id).limit(1);
        if(used?.length)return Response.json({error:table==="products"?"Produto já usado em vendas":"Insumo já usado no estoque"},{status:409});
      }
      const {error}=await db.from(table).delete().eq("id",id);
      if(error)throw error;
      return Response.json({ok:true});
    }
    const data=clean(table,body.data??{});
    if((table==="sales"||table==="recipes")&&!(await exists(db,"products",String(data.product_id))))throw Error("Produto não encontrado");
    if((table==="recipes"||table==="movements")&&!(await exists(db,"ingredients",String(data.ingredient_id))))throw Error("Insumo não encontrado");
    if(table==="sales"&&Number(data.discount_cents)>Number(data.qty)*Number(data.unit_price_cents)+Number(data.delivery_cents))throw Error("Desconto maior que a venda");
    if(table==="expenses"&&data.paid_at&&data.paid_cents==null)throw Error("Informe o valor pago");
    if(table==="sales") {
      const {data:previous}=id?await db.from("sales").select("product_id,recipe_snapshot").eq("id",id).maybeSingle():{data:null};
      if(!previous||previous.product_id!==data.product_id||!Array.isArray(previous.recipe_snapshot)||!previous.recipe_snapshot.length) {
        const {data:recipeRows,error}=await db.from("recipes").select("ingredient_id,qty").eq("product_id",String(data.product_id));
        if(error)throw error;
        data.recipe_snapshot=(recipeRows??[]).map(r=>({ingredient_id:r.ingredient_id,qty:r.qty}));
      } else data.recipe_snapshot=previous.recipe_snapshot;
    }
    if(id) {
      if(!(await exists(db,table,id)))return Response.json({error:"Registro não encontrado"},{status:404});
      const {error}=await db.from(table).update(data).eq("id",id);
      if(error)throw error;
    } else {
      const {error}=await db.from(table).insert({...data,owner_id:user.id});
      if(error)throw error;
    }
    return Response.json({ok:true});
  }catch(e){return Response.json({error:e instanceof Error?e.message:"Falha ao salvar"},{status:400});}
}
