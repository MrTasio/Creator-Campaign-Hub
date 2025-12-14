import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TrackingInfoProps {
  campaignId: string;
}

export function TrackingInfo({ campaignId }: TrackingInfoProps) {
  const [copiedView, setCopiedView] = useState(false);
  const [copiedClick, setCopiedClick] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Note: Exposing the publishable key here is intentional and safe.
  // Supabase publishable keys are designed to be public and are already
  // exposed in client-side code. This is necessary for the tracking feature
  // to work when users copy the API examples.
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const viewUrl = `${baseUrl}/functions/v1/track-view`;
  const clickUrl = `${baseUrl}/functions/v1/track-click`;

  const copyToClipboard = async (text: string, type: 'view' | 'click' | 'code', codeType?: string) => {
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
            <div>
              <Label className="text-sm font-medium mb-2">Embeddable Tracking Script</Label>
              <p className="text-xs text-muted-foreground mb-4">
                Include this script in other projects to automatically track views and clicks. The script reads campaignId from URL parameters. The tracker script is hosted at <strong>https://creator-campaign-hub.vercel.app/tracker.js</strong>
              </p>
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
                  <code>{`https://other-project.com/page?campaignId=${campaignId}&creatorId=xyz789`}</code>
                </pre>
                
                <p className="text-xs text-muted-foreground mt-3">
                  3. The script automatically tracks views when the page loads with campaignId in the URL.
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