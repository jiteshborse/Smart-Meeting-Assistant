-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE (Fixes the signup error)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup automatically
-- SECURITY DEFINER is crucial here: it allows the function to bypass RLS when inserted by the trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- MEETINGS TABLE
create table if not exists public.meetings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  status text check (status in ('recording', 'processing', 'completed', 'failed')) default 'recording',
  audio_url text,
  duration integer, -- in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS on meetings
alter table public.meetings enable row level security;

-- Policies for meetings
create policy "Users can view their own meetings." on meetings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own meetings." on meetings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own meetings." on meetings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own meetings." on meetings
  for delete using (auth.uid() = user_id);


-- TRANSCRIPTS TABLE
create table if not exists public.transcripts (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings on delete cascade not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on transcripts
alter table public.transcripts enable row level security;

-- Policies for transcripts (Inherit access from meeting)
create policy "Users can view transcripts of their meetings." on transcripts
  for select using (
    exists ( select 1 from meetings where id = transcripts.meeting_id and user_id = auth.uid() )
  );

create policy "Users can insert transcripts for their meetings." on transcripts
  for insert with check (
    exists ( select 1 from meetings where id = transcripts.meeting_id and user_id = auth.uid() )
  );


-- SUMMARIES TABLE
create table if not exists public.summaries (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings on delete cascade not null,
  summary jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on summaries
alter table public.summaries enable row level security;

-- Policies for summaries
create policy "Users can view summaries of their meetings." on summaries
  for select using (
    exists ( select 1 from meetings where id = summaries.meeting_id and user_id = auth.uid() )
  );


-- ACTION ITEMS TABLE
create table if not exists public.action_items (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings on delete cascade not null,
  description text not null,
  assignee text,
  due_date timestamp with time zone,
  status text check (status in ('pending', 'in_progress', 'completed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on action_items
alter table public.action_items enable row level security;

-- Policies for action_items
create policy "Users can view action items of their meetings." on action_items
  for select using (
    exists ( select 1 from meetings where id = action_items.meeting_id and user_id = auth.uid() )
  );

create policy "Users can update action items of their meetings." on action_items
  for update using (
    exists ( select 1 from meetings where id = action_items.meeting_id and user_id = auth.uid() )
  );
