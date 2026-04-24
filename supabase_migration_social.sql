-- Create social_accounts table
create table public.social_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  platform text not null, -- 'Facebook', 'Instagram'
  account_name text not null, -- Page Name or IG Username
  account_id text not null, -- Page ID or IG User ID
  status text not null default 'Connected',
  access_token text not null, -- Long-lived page access token
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.social_accounts enable row level security;

create policy "Users can view own social accounts"
  on social_accounts for select
  using ( auth.uid() = user_id );

create policy "Users can insert own social accounts"
  on social_accounts for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own social accounts"
  on social_accounts for delete
  using ( auth.uid() = user_id );


-- Create social_posts table
create table public.social_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  campaign_id uuid references public.campaigns not null,
  platform text not null,
  social_account_id uuid references public.social_accounts not null,
  scheduled_at timestamp with time zone not null,
  status text not null default 'Pending', -- 'Pending', 'Processing', 'Posted', 'Failed'
  post_url text,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.social_posts enable row level security;

create policy "Users can view own social posts"
  on social_posts for select
  using ( auth.uid() = user_id );

create policy "Users can insert own social posts"
  on social_posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own social posts"
  on social_posts for update
  using ( auth.uid() = user_id );
