-- Add target_link column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS target_link TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.campaigns.target_link IS 'The target URL where tracking should be active. If set, the embed script will only track events when the current page URL matches this target link.';

