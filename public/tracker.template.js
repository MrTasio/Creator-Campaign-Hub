/**
 * Campaign Tracker - Embeddable Tracking Script
 * 
 * Usage:
 * <script src="https://your-domain.com/tracker.js"></script>
 * 
 * Then add query parameters to your URLs:
 * https://other-project.com/page?campaignId=abc123&creatorId=xyz789
 * 
 * The script will automatically track views when the page loads.
 * For click tracking, use: window.CampaignTracker.trackClick()
 * 
 * NOTE: This file is generated at build time from tracker.template.js
 * Credentials are injected from environment variables.
 */

(function() {
  'use strict';

  // Configuration - Injected at build time from environment variables
  const CONFIG = {
    SUPABASE_URL: '{{SUPABASE_URL}}',
    API_KEY: '{{API_KEY}}'
  };

  /**
   * Parse URL query parameters
   */
  function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      campaignId: params.get('campaignId') || params.get('campaign_id'),
      creatorId: params.get('creatorId') || params.get('creator_id')
    };
  }

  /**
   * Track an event (view or click)
   */
  function trackEvent(eventType, campaignId) {
    if (!campaignId) {
      console.warn('Campaign Tracker: campaignId is required');
      return Promise.reject(new Error('campaignId is required'));
    }

    const endpoint = eventType === 'click' 
      ? `${CONFIG.SUPABASE_URL}/functions/v1/track-click`
      : `${CONFIG.SUPABASE_URL}/functions/v1/track-view`;

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.API_KEY,
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        campaign_id: campaignId
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Campaign Tracker: ${eventType} tracked successfully`, data);
      return data;
    })
    .catch(error => {
      console.error(`Campaign Tracker: Error tracking ${eventType}`, error);
      throw error;
    });
  }

  /**
   * Track a view event
   */
  function trackView(campaignId) {
    const id = campaignId || getQueryParams().campaignId;
    return trackEvent('view', id);
  }

  /**
   * Track a click event
   */
  function trackClick(campaignId) {
    const id = campaignId || getQueryParams().campaignId;
    return trackEvent('click', id);
  }

  /**
   * Auto-track view on page load if campaignId is in URL
   */
  function autoTrack() {
    const params = getQueryParams();
    if (params.campaignId) {
      // Small delay to ensure page is fully loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => trackView(params.campaignId), 100);
        });
      } else {
        setTimeout(() => trackView(params.campaignId), 100);
      }
    }
  }

  /**
   * Setup click tracking on links with campaignId
   */
  function setupClickTracking() {
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a');
      if (link && link.href) {
        try {
          const url = new URL(link.href);
          const campaignId = url.searchParams.get('campaignId') || url.searchParams.get('campaign_id');
          if (campaignId) {
            trackClick(campaignId).catch(() => {
              // Silently fail - don't interrupt navigation
            });
          }
        } catch (error) {
          // Invalid URL, ignore
        }
      }
    }, true);
  }

  // Public API
  window.CampaignTracker = {
    trackView: trackView,
    trackClick: trackClick,
    getQueryParams: getQueryParams,
    config: CONFIG
  };

  // Auto-initialize
  autoTrack();
  setupClickTracking();

  console.log('Campaign Tracker: Script loaded');
})();

