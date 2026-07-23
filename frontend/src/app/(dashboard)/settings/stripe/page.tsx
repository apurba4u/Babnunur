'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/axios';

interface StripeConfig {
  enabled: boolean;
  publishableKey: string;
  sandbox: boolean;
}

export default function StripeSettingsPage() {
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [sandbox, setSandbox] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/stripe/admin/settings').then((res) => {
      const data = res.data.data;
      setConfig(data);
      setEnabled(data.enabled);
      setPublishableKey(data.publishableKey);
      setSandbox(data.sandbox);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/stripe/admin/settings', {
        enabled, publishableKey, secretKey, webhookSecret, sandbox,
      });
      setConfig(res.data.data);
      setMessage('Settings saved successfully.');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Stripe Settings</h1>

      <Card>
        <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes('successfully') ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
              {message}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Enable Stripe</label>
              <p className="text-xs text-muted-foreground">Allow payments via Stripe</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-input'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Sandbox Mode</label>
              <p className="text-xs text-muted-foreground">Use test keys</p>
            </div>
            <button
              onClick={() => setSandbox(!sandbox)}
              className={`relative h-6 w-11 rounded-full transition-colors ${sandbox ? 'bg-primary' : 'bg-input'}`}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${sandbox ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Publishable Key</label>
            <Input value={publishableKey} onChange={(e) => setPublishableKey(e.target.value)} placeholder="pk_test_..." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Secret Key</label>
            <Input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="sk_test_..." />
            <p className="text-xs text-muted-foreground">Stored encrypted. Never exposed to frontend.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Webhook Secret</label>
            <Input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="whsec_..." />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Enabled</span><span className={config?.enabled ? 'text-green-600' : 'text-muted-foreground'}>{config?.enabled ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span>Mode</span><span>{config?.sandbox ? 'Sandbox (Test)' : 'Production'}</span></div>
            <div className="flex justify-between"><span>Publishable Key</span><span>{config?.publishableKey ? 'Configured' : 'Not set'}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
