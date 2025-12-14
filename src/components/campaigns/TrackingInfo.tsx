import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Link as LinkIcon, AlertCircle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaign } from '@/hooks/useCampaigns';

interface TrackingInfoProps {
  campaignId: string;
}

export function TrackingInfo({ campaignId }: TrackingInfoProps) {
  const [copiedView, setCopiedView] = useState(false);
  const [copiedClick, setCopiedClick] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedCampaignLink, setCopiedCampaignLink] = useState(false);
  const [checkUrl, setCheckUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    success: boolean;
    hasTrackerScript: boolean;
    hasCampaignId: boolean;
    message: string;
    scriptTags?: Array<{ fullTag: string; src: string }>;
  } | null>(null);
  const { data: campaign } = useCampaign(campaignId);
  
  // Note: Exposing the publishable key here is intentional and safe.
  // Supabase publishable keys are designed to be public and are already
  // exposed in client-side code. This is necessary for the tracking feature
  // to work when users copy the API examples.
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const viewUrl = `${baseUrl}/functions/v1/track-view`;
  const clickUrl = `${baseUrl}/functions/v1/track-click`;

  const copyToClipboard = async (text: string, type: 'view' | 'click' | 'code' | 'campaign-link', codeType?: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
    
    if (type === 'view') {
      setCopiedView(true);
      setTimeout(() => setCopiedView(false), 2000);
    } else if (type === 'click') {
      setCopiedClick(true);
      setTimeout(() => setCopiedClick(false), 2000);
    } else if (type === 'code') {
      setCopiedCode(codeType || null);
      setTimeout(() => setCopiedCode(null), 2000);
    } else if (type === 'campaign-link') {
      setCopiedCampaignLink(true);
      setTimeout(() => setCopiedCampaignLink(false), 2000);
    }
  };

  const getCampaignLink = () => {
    if (campaign?.target_link) {
      const url = new URL(campaign.target_link);
      url.searchParams.set('campaignId', campaignId);
      return url.toString();
    }
    // If no target link, return a generic format
    return `https://your-website.com/page?campaignId=${campaignId}`;
  };

  const checkScriptOnPage = async () => {
    if (!checkUrl.trim()) {
      toast.error('Please enter a URL to check');
      return;
    }

    setChecking(true);
    setCheckResult(null);

    try {
      const response = await fetch(`${baseUrl}/functions/v1/check-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ url: checkUrl.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check URL');
      }

      setCheckResult(data);
      if (data.hasTrackerScript) {
        toast.success('Tracker script found!');
      } else {
        toast.warning('Tracker script not found on this page');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to check URL');
      setCheckResult({
        success: false,
        hasTrackerScript: false,
        hasCampaignId: false,
        message: error instanceof Error ? error.message : 'Failed to check URL'
      });
    } finally {
      setChecking(false);
    }
  };

  const getCurlCommand = (url: string) => 
    `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '{"campaign_id": "${campaignId}"}'`;

  const getFetchCommand = (url: string) => 
    `fetch("${url}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": "${apiKey}",
    "Authorization": "Bearer ${apiKey}"
  },
  body: JSON.stringify({
    campaign_id: "${campaignId}"
  })
})
.then(response => response.json())
.then(data => console.log(data));`;

  const getPythonCommand = (url: string) => 
    `import requests

url = "${url}"
headers = {
    "Content-Type": "application/json",
    "apikey": "${apiKey}",
    "Authorization": f"Bearer ${apiKey}"
}
data = {
    "campaign_id": "${campaignId}"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`;

  return (
    <div className="bg-card rounded-lg border border-border/50 shadow-card p-6">
      <h3 className="font-medium mb-2">Public Tracking API</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Use these endpoints to track views and clicks from external sources.
      </p>
      
      <Tabs defaultValue="embed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="embed">Embed Script</TabsTrigger>
          <TabsTrigger value="view">Track View</TabsTrigger>
          <TabsTrigger value="click">Track Click</TabsTrigger>
        </TabsList>
        
        <TabsContent value="embed" className="space-y-4 mt-4">
          <div className="space-y-3">
            {/* Campaign Link Section */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Share Campaign Link</Label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = getCampaignLink();
                    copyToClipboard(link, 'campaign-link');
                  }}
                >
                  {copiedCampaignLink ? (
                    <>
                      <Check className="h-3 w-3 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Share this link with your creator. It includes the campaignId parameter and is ready to use.
              </p>
              <div className="bg-background rounded-md p-3 border border-border">
                <code className="text-xs break-all">{getCampaignLink()}</code>
              </div>
            </div>

            {/* Script Checker Section */}
            <div className="bg-muted/50 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Verify Script Installation</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Enter a URL to check if the tracker script is properly installed on that page.
              </p>
              
              <div className="flex gap-2 mb-3">
                <Input
                  type="url"
                  placeholder="https://example.com/page"
                  value={checkUrl}
                  onChange={(e) => setCheckUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !checking) {
                      checkScriptOnPage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={checkScriptOnPage}
                  disabled={checking || !checkUrl.trim()}
                  size="default"
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Check
                    </>
                  )}
                </Button>
              </div>

              {checkResult && (
                <div className={`mt-3 p-3 rounded-md border ${
                  checkResult.hasTrackerScript
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-2">
                    {checkResult.hasTrackerScript ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-xs font-medium mb-1 ${
                        checkResult.hasTrackerScript
                          ? 'text-green-900 dark:text-green-200'
                          : 'text-red-900 dark:text-red-200'
                      }`}>
                        {checkResult.message}
                      </p>
                      
                      {checkResult.scriptTags && checkResult.scriptTags.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Found script tags:</p>
                          {checkResult.scriptTags.map((tag, idx) => (
                            <code key={idx} className="text-xs bg-background px-2 py-1 rounded block mt-1 break-all">
                              {tag.src}
                            </code>
                          ))}
                        </div>
                      )}

                      {checkResult.hasCampaignId && (
                        <p className="text-xs text-muted-foreground mt-2">
                          ✓ Campaign ID parameter found in page
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Embeddable Tracking Script</Label>
              <p className="text-xs text-muted-foreground mb-4">
                Include this script in other projects to automatically track views and clicks. The script reads campaignId from URL parameters. The tracker script is hosted at <strong>https://creator-campaign-hub.vercel.app/tracker.js</strong>
              </p>
              
              {campaign?.target_link && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                        Target Link Restriction
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">
                        Tracking will only occur when the page URL matches:
                      </p>
                      <code className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded block break-all">
                        {campaign.target_link}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {!campaign?.target_link && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                        No Target Link Set
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Tracking will work on any page. To restrict tracking to a specific URL, set a target link in the campaign settings.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Script Tag</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => {
                    const scriptTag = `<script src="https://creator-campaign-hub.vercel.app/tracker.js"></script>`;
                    copyToClipboard(scriptTag, 'code', 'script-tag');
                  }}
                >
                  {copiedCode === 'script-tag' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                <code>{`<script src="https://creator-campaign-hub.vercel.app/tracker.js"></script>`}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Usage Example</Label>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  1. Include the script tag in your HTML:
                </p>
                <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  <code>{`<head>
  <script src="https://creator-campaign-hub.vercel.app/tracker.js"></script>
</head>`}</code>
                </pre>
                
                <p className="text-xs text-muted-foreground mt-3">
                  2. Add campaignId to your URLs:
                </p>
                <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  <code>{campaign?.target_link 
                    ? `${campaign.target_link}?campaignId=${campaignId}`
                    : `https://your-website.com/page?campaignId=${campaignId}`}</code>
                </pre>
                
                {campaign?.target_link ? (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-900 dark:text-blue-200 mb-2">
                      <strong>Target Link Restriction:</strong> This campaign is configured to only track on the target link below. Make sure your URLs match this domain and path.
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      Target: <code className="text-xs bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">{campaign.target_link}</code>
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300 mt-2">
                      Example URL: <code className="text-xs bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded break-all">{campaign.target_link}?campaignId={campaignId}</code>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    You can add the campaignId as a query parameter to any URL. The script will track views on any page where it's embedded.
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground mt-3">
                  3. The script automatically tracks views when the page loads with campaignId in the URL.
                  {campaign?.target_link && ' (Only if the page URL matches the target link above)'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Manual Tracking (JavaScript API)</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Track View</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => {
                      const code = `window.CampaignTracker.trackView('${campaignId}');`;
                      copyToClipboard(code, 'code', 'manual-view');
                    }}
                  >
                    {copiedCode === 'manual-view' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  <code>{`window.CampaignTracker.trackView('${campaignId}');`}</code>
                </pre>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Track Click</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => {
                      const code = `window.CampaignTracker.trackClick('${campaignId}');`;
                      copyToClipboard(code, 'code', 'manual-click');
                    }}
                  >
                    {copiedCode === 'manual-click' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                  <code>{`window.CampaignTracker.trackClick('${campaignId}');`}</code>
                </pre>
              </div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-900 dark:text-green-200">
                <strong>Features:</strong> Auto-tracks views from URL parameters, automatic click tracking on links with campaignId, and a JavaScript API for manual tracking.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="view" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={viewUrl}
                className="font-mono text-xs bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(viewUrl, 'view')}
              >
                {copiedView ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">How to Use</Label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">cURL</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(getCurlCommand(viewUrl), 'code', 'curl-view')}
                >
                  {copiedCode === 'curl-view' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                <code>{getCurlCommand(viewUrl)}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">JavaScript (Fetch)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(getFetchCommand(viewUrl), 'code', 'js-view')}
                >
                  {copiedCode === 'js-view' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                <code>{getFetchCommand(viewUrl)}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Python (Requests)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(getPythonCommand(viewUrl), 'code', 'py-view')}
                >
                  {copiedCode === 'py-view' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                <code>{getPythonCommand(viewUrl)}</code>
              </pre>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> This endpoint tracks a view event for the campaign. The campaign metrics (views, CTR, payout) will be automatically updated.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="click" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={clickUrl}
                className="font-mono text-xs bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(clickUrl, 'click')}
              >
                {copiedClick ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">How to Use</Label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">cURL</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(getCurlCommand(clickUrl), 'code', 'curl-click')}
                >
                  {copiedCode === 'curl-click' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                <code>{getCurlCommand(clickUrl)}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">JavaScript (Fetch)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(getFetchCommand(clickUrl), 'code', 'js-click')}
                >
                  {copiedCode === 'js-click' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                <code>{getFetchCommand(clickUrl)}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Python (Requests)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(getPythonCommand(clickUrl), 'code', 'py-click')}
                >
                  {copiedCode === 'py-click' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                <code>{getPythonCommand(clickUrl)}</code>
              </pre>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> This endpoint tracks a click event for the campaign. The campaign metrics (clicks, CTR, payout) will be automatically updated.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}