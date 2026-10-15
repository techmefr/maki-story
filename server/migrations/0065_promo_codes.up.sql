alter table families add column if not exists plan_until timestamptz;

create table if not exists promo_codes (
    code text primary key,
    kind text not null check (kind in ('premium_days', 'lifetime')),
    days integer,
    max_uses integer,
    uses integer not null default 0,
    expires_at timestamptz,
    note text not null default '',
    created_at timestamptz not null default now()
);

create table if not exists promo_redemptions (
    code text not null references promo_codes(code) on delete cascade,
    family_id text not null references families(id) on delete cascade,
    redeemed_at timestamptz not null default now(),
    primary key (code, family_id)
);
