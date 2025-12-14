-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create creators table
CREATE TABLE public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create campaign status enum
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'completed');

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  cpm_rate DECIMAL(10,4) NOT NULL DEFAULT 0,
  cpc_rate DECIMAL(10,4) NOT NULL DEFAULT 0,
  total_views BIGINT NOT NULL DEFAULT 0,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  ctr DECIMAL(5,2) NOT NULL DEFAULT 0,
  estimated_payout DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create event type enum
CREATE TYPE public.event_type AS ENUM ('view', 'click');

-- Create campaign_events table
CREATE TABLE public.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  event_type event_type NOT NULL,
  source TEXT DEFAULT 'api',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Creators policies
CREATE POLICY "Users can view own creators" ON public.creators
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creators" ON public.creators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creators" ON public.creators
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creators" ON public.creators
  FOR DELETE USING (auth.uid() = user_id);

-- Campaigns policies
CREATE POLICY "Users can view own campaigns" ON public.campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON public.campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON public.campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Campaign events policies (public insert for tracking API)
CREATE POLICY "Anyone can insert events" ON public.campaign_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view events for own campaigns" ON public.campaign_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_events.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update campaign metrics
CREATE OR REPLACE FUNCTION public.update_campaign_metrics(campaign_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_views BIGINT;
  v_clicks BIGINT;
  v_ctr DECIMAL(5,2);
  v_payout DECIMAL(12,2);
  v_cpm DECIMAL(10,4);
  v_cpc DECIMAL(10,4);
BEGIN
  -- Get current rates
  SELECT cpm_rate, cpc_rate INTO v_cpm, v_cpc
  FROM public.campaigns WHERE id = campaign_uuid;
  
  -- Count events
  SELECT 
    COALESCE(SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0)
  INTO v_views, v_clicks
  FROM public.campaign_events
  WHERE campaign_id = campaign_uuid;
  
  -- Calculate CTR
  IF v_views > 0 THEN
    v_ctr := ROUND((v_clicks::DECIMAL / v_views::DECIMAL) * 100, 2);
  ELSE
    v_ctr := 0;
  END IF;
  
  -- Calculate payout: (views/1000 * CPM) + (clicks * CPC)
  v_payout := ROUND((v_views / 1000.0 * v_cpm) + (v_clicks * v_cpc), 2);
  
  -- Update campaign
  UPDATE public.campaigns
  SET 
    total_views = v_views,
    total_clicks = v_clicks,
    ctr = v_ctr,
    estimated_payout = v_payout,
    updated_at = now()
  WHERE id = campaign_uuid;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();