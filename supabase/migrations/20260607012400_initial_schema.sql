create extension if not exists pgcrypto;

create table public.app_counters (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  next_ordem_numero integer not null default 1,
  next_produto_codigo integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  cpf_cnpj text not null default '',
  rg_ie text not null default '',
  telefone text not null default '',
  endereco text not null default '',
  numero text not null default '',
  bairro text not null default '',
  cidade text not null default '',
  estado text not null default '',
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome_fantasia text not null default '',
  razao_social text not null default '',
  cnpj text not null default '',
  inscricao_estadual text not null default '',
  telefone text not null default '',
  whatsapp text not null default '',
  endereco text not null default '',
  numero text not null default '',
  bairro text not null default '',
  cidade text not null default '',
  estado text not null default '',
  cep text not null default '',
  logo text not null default '',
  observacao_padrao text not null default '',
  vendedor text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  codigo text not null,
  descricao text not null,
  unidade text not null default 'UN',
  valor_unitario numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, codigo)
);

create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero text not null,
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nome text not null default '',
  data_emissao timestamptz not null default now(),
  subtotal numeric(14, 2) not null default 0,
  desconto numeric(14, 2) not null default 0,
  acrescimo numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  vendedor text not null default '',
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, numero)
);

create table public.ordem_servico_itens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  ordem_servico_id uuid not null references public.ordens_servico(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null,
  codigo text not null default '',
  descricao text not null default '',
  unidade text not null default 'UN',
  quantidade numeric(14, 2) not null default 0,
  valor_unitario numeric(14, 2) not null default 0,
  valor_total numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.claim_next_ordem_numero(p_owner_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  with upserted as (
    insert into public.app_counters (owner_id, next_ordem_numero, next_produto_codigo)
    values (p_owner_id, 2, 1)
    on conflict (owner_id) do update
      set next_ordem_numero = public.app_counters.next_ordem_numero + 1,
          updated_at = now()
    returning next_ordem_numero - 1 as numero
  )
  select numero::text from upserted;
$$;

create or replace function public.claim_next_produto_codigo(p_owner_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  with upserted as (
    insert into public.app_counters (owner_id, next_ordem_numero, next_produto_codigo)
    values (p_owner_id, 1, 2)
    on conflict (owner_id) do update
      set next_produto_codigo = public.app_counters.next_produto_codigo + 1,
          updated_at = now()
    returning next_produto_codigo - 1 as codigo
  )
  select codigo::text from upserted;
$$;

create or replace function public.fill_ordem_numero()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is null then
    new.owner_id = auth.uid();
  end if;

  if nullif(trim(new.numero), '') is null then
    new.numero = public.claim_next_ordem_numero(new.owner_id);
  end if;

  return new;
end;
$$;

create or replace function public.fill_produto_codigo()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is null then
    new.owner_id = auth.uid();
  end if;

  if nullif(trim(new.codigo), '') is null then
    new.codigo = public.claim_next_produto_codigo(new.owner_id);
  end if;

  return new;
end;
$$;

create trigger clientes_touch_updated_at
before update on public.clientes
for each row execute function public.touch_updated_at();

create trigger empresas_touch_updated_at
before update on public.empresas
for each row execute function public.touch_updated_at();

create trigger produtos_touch_updated_at
before update on public.produtos
for each row execute function public.touch_updated_at();

create trigger ordens_touch_updated_at
before update on public.ordens_servico
for each row execute function public.touch_updated_at();

create trigger produtos_fill_codigo
before insert on public.produtos
for each row execute function public.fill_produto_codigo();

create trigger ordens_fill_numero
before insert on public.ordens_servico
for each row execute function public.fill_ordem_numero();

create or replace function public.save_ordem_servico(
  p_ordem_id uuid,
  p_cliente_id uuid,
  p_cliente_nome text,
  p_subtotal numeric,
  p_desconto numeric,
  p_acrescimo numeric,
  p_total numeric,
  p_vendedor text,
  p_observacoes text,
  p_itens jsonb
)
returns table (id uuid, numero text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_id uuid;
  v_numero text;
begin
  if v_owner is null then
    raise exception 'Usuário não autenticado';
  end if;

  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione ao menos um produto';
  end if;

  if p_ordem_id is null then
    insert into public.ordens_servico (
      owner_id, numero, cliente_id, cliente_nome, subtotal, desconto,
      acrescimo, total, vendedor, observacoes
    )
    values (
      v_owner, '', p_cliente_id, coalesce(p_cliente_nome, ''), coalesce(p_subtotal, 0),
      coalesce(p_desconto, 0), coalesce(p_acrescimo, 0), coalesce(p_total, 0),
      coalesce(p_vendedor, ''), coalesce(p_observacoes, '')
    )
    returning ordens_servico.id, ordens_servico.numero into v_id, v_numero;
  else
    update public.ordens_servico
    set cliente_id = p_cliente_id,
        cliente_nome = coalesce(p_cliente_nome, ''),
        subtotal = coalesce(p_subtotal, 0),
        desconto = coalesce(p_desconto, 0),
        acrescimo = coalesce(p_acrescimo, 0),
        total = coalesce(p_total, 0),
        vendedor = coalesce(p_vendedor, ''),
        observacoes = coalesce(p_observacoes, '')
    where ordens_servico.id = p_ordem_id
      and ordens_servico.owner_id = v_owner
    returning ordens_servico.id, ordens_servico.numero into v_id, v_numero;

    if v_id is null then
      raise exception 'Ordem de serviço não encontrada';
    end if;

    delete from public.ordem_servico_itens
    where ordem_servico_id = v_id
      and owner_id = v_owner;
  end if;

  insert into public.ordem_servico_itens (
    owner_id, ordem_servico_id, produto_id, codigo, descricao, unidade,
    quantidade, valor_unitario, valor_total
  )
  select
    v_owner,
    v_id,
    nullif(item->>'produto_id', '')::uuid,
    coalesce(item->>'codigo', ''),
    coalesce(item->>'descricao', ''),
    coalesce(item->>'unidade', 'UN'),
    coalesce((item->>'quantidade')::numeric, 0),
    coalesce((item->>'valor_unitario')::numeric, 0),
    coalesce((item->>'valor_total')::numeric, 0)
  from jsonb_array_elements(p_itens) as item;

  return query select v_id, v_numero;
end;
$$;

alter table public.app_counters enable row level security;
alter table public.clientes enable row level security;
alter table public.empresas enable row level security;
alter table public.produtos enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.ordem_servico_itens enable row level security;

create policy "Users manage own counters" on public.app_counters
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users manage own clientes" on public.clientes
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users manage own empresas" on public.empresas
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users manage own produtos" on public.produtos
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users manage own ordens" on public.ordens_servico
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users manage own ordem itens" on public.ordem_servico_itens
for all using (owner_id = auth.uid())
with check (owner_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant execute on function public.save_ordem_servico(uuid, uuid, text, numeric, numeric, numeric, numeric, text, text, jsonb) to authenticated;
