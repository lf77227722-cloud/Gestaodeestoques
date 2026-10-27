-- Each authenticated account owns its own records.
create table public.products (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), name text not null, category text not null, price_cents integer not null check (price_cents >= 0), packaging_cents integer not null check (packaging_cents >= 0));
create table public.ingredients (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), name text not null, unit text not null, opening_qty numeric not null check (opening_qty >= 0), unit_cost_cents integer not null check (unit_cost_cents >= 0), min_qty numeric not null check (min_qty >= 0));
create table public.recipes (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), product_id uuid not null, ingredient_id uuid not null, qty numeric not null check (qty > 0));
create table public.sales (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), date date not null, product_id uuid not null, product_name text not null, qty numeric not null check (qty > 0), unit_price_cents integer not null check (unit_price_cents >= 0), discount_cents integer not null check (discount_cents >= 0), delivery_cents integer not null check (delivery_cents >= 0), fee_cents integer not null check (fee_cents >= 0), channel text not null, payment text not null, received_at date, note text, recipe_snapshot jsonb not null default '[]'::jsonb);
create table public.expenses (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), date date not null, description text not null, category text not null, amount_cents integer not null check (amount_cents >= 0), due_at date, paid_at date, paid_cents integer check (paid_cents >= 0), note text);
create table public.movements (id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), date date not null, ingredient_id uuid not null, kind text not null check (kind in ('Compra','Entrada ajuste','Perda','Saída ajuste')), qty numeric not null check (qty > 0), note text);

create unique index products_owner_id_id on public.products(owner_id,id);
create unique index ingredients_owner_id_id on public.ingredients(owner_id,id);
alter table public.recipes add constraint recipes_product_owner_fk foreign key (owner_id,product_id) references public.products(owner_id,id);
alter table public.recipes add constraint recipes_ingredient_owner_fk foreign key (owner_id,ingredient_id) references public.ingredients(owner_id,id);
alter table public.sales add constraint sales_product_owner_fk foreign key (owner_id,product_id) references public.products(owner_id,id);
alter table public.movements add constraint movements_ingredient_owner_fk foreign key (owner_id,ingredient_id) references public.ingredients(owner_id,id);
create index recipes_owner_product on public.recipes(owner_id,product_id);
create index sales_owner_date on public.sales(owner_id,date);
create index movements_owner_ingredient on public.movements(owner_id,ingredient_id);
create index expenses_owner_date on public.expenses(owner_id,date);

alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.movements enable row level security;

do $$ declare t text; begin
  foreach t in array array['products','ingredients','recipes','sales','expenses','movements'] loop
    execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = owner_id)',t);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)',t);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)',t);
    execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  end loop;
end $$;
