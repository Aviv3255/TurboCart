'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// SVG Icons
const Icons = {
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  fire: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  back: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

interface TimerSettings {
  enabled: boolean;
  position: string;
  duration_minutes: number;
  reset_on_activity: boolean;
  message_template: string;
  expired_message: string;
  urgency_message: string | null;
  style: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  timer_color: string;
  font_size: number;
  padding: number;
  border_radius: number;
  animation: string;
  animate_last_minute: boolean;
  show_progress_bar: boolean;
  play_sound_warning: boolean;
  sound_warning_seconds: number;
  min_cart_value: number;
}

const MESSAGE_TEMPLATES = [
  { msg: 'Your items are reserved for {time}. Complete checkout to secure your order.', label: 'Standard' },
  { msg: 'Items reserved for {time} only! Complete checkout now.', label: 'Urgency' },
  { msg: 'Complete order in {time} to lock in prices', label: 'Scarcity' },
  { msg: 'Cart reserved for {time} - checkout to secure items', label: 'Direct' },
  { msg: 'Hurry! Only {time} left to secure your items', label: 'FOMO' },
  { msg: '{time} remaining before reservation expires', label: 'Neutral' },
];

export default function TimerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewTime, setPreviewTime] = useState('09:59');

  const [settings, setSettings] = useState<TimerSettings>({
    enabled: false,
    position: 'top',
    duration_minutes: 10,
    reset_on_activity: true,
    message_template: 'Your items are reserved for {time}. Complete checkout to secure your order.',
    expired_message: 'Your reservation has expired. Items may no longer be available.',
    urgency_message: 'Hurry! Items only reserved for {time} more!',
    style: 'bar',
    background_color: '#f3f4f6',
    text_color: '#374151',
    accent_color: '#6b7280',
    timer_color: '#111827',
    font_size: 14,
    padding: 12,
    border_radius: 8,
    animation: 'none',
    animate_last_minute: true,
    show_progress_bar: false,
    play_sound_warning: false,
    sound_warning_seconds: 60,
    min_cart_value: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await authenticatedFetch('/api/admin/timer-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch timer settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await authenticatedFetch('/api/admin/timer-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const getPreviewMessage = () => {
    return settings.message_template.replace('{time}', `<span class="timer-value">${previewTime}</span>`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading timer settings...</p>
        <style jsx>{`
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; background: #f6f6f7; }
          .loading-spinner { width: 40px; height: 40px; border: 3px solid #e4e5e7; border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          p { margin-top: 16px; color: #6d7175; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="timer-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={() => router.push('/dashboard')}>
            {Icons.back}
          </button>
          <div className="header-content">
            <h1>Urgency Timer</h1>
            <p>Create purchase urgency with a countdown timer</p>
          </div>
        </div>
        <div className="header-actions">
          <label className="master-toggle">
            <span>Enable Timer</span>
            <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />
            <span className="toggle-slider"></span>
          </label>
          <button onClick={saveChanges} disabled={saving} className={`save-button ${saveSuccess ? 'success' : ''}`}>
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="content-grid">
        {/* Preview Column */}
        <div className="preview-column">
          <div className="preview-card">
            <h3>Live Preview</h3>
            <div className={`timer-preview ${settings.style} ${settings.animation !== 'none' ? 'animate-' + settings.animation : ''}`} style={{
              background: settings.background_color,
              color: settings.text_color,
              fontSize: `${settings.font_size}px`,
              padding: `${settings.padding}px`,
              borderRadius: `${settings.border_radius}px`,
            }}>
              <span className="timer-icon">{Icons.clock}</span>
              <span className="timer-message" dangerouslySetInnerHTML={{ __html: getPreviewMessage() }} />
              {settings.show_progress_bar && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '60%', background: settings.accent_color }}></div>
                </div>
              )}
            </div>
            <div className="preview-controls">
              <label>Preview Time:</label>
              <input type="text" value={previewTime} onChange={(e) => setPreviewTime(e.target.value)} placeholder="09:59" />
            </div>
          </div>

          <div className="preview-card urgency">
            <h3>Urgency Mode (Last Minute)</h3>
            <div className={`timer-preview bar animate-pulse`} style={{
              background: '#fee2e2',
              color: '#991b1b',
              fontSize: `${settings.font_size}px`,
              padding: `${settings.padding}px`,
              borderRadius: `${settings.border_radius}px`,
            }}>
              <span className="timer-icon">{Icons.fire}</span>
              <span className="timer-message">{settings.urgency_message?.replace('{time}', '00:45') || 'Hurry! Only 00:45 left!'}</span>
            </div>
          </div>

          <div className="preview-card expired">
            <h3>Expired State</h3>
            <div className="timer-preview bar" style={{
              background: '#f3f4f6',
              color: '#6b7280',
              fontSize: `${settings.font_size}px`,
              padding: `${settings.padding}px`,
              borderRadius: `${settings.border_radius}px`,
            }}>
              <span className="timer-icon">{Icons.alert}</span>
              <span className="timer-message">{settings.expired_message}</span>
            </div>
          </div>
        </div>

        {/* Settings Column */}
        <div className="settings-column">
          {/* Timer Configuration */}
          <div className="settings-section">
            <h3>Timer Configuration</h3>
            <div className="settings-card">
              <div className="field-group">
                <label>Countdown Duration</label>
                <div className="duration-input">
                  <input type="number" min="1" max="60" value={settings.duration_minutes} onChange={(e) => setSettings({ ...settings, duration_minutes: parseInt(e.target.value) || 10 })} className="field-input" />
                  <span className="duration-label">minutes</span>
                </div>
                <span className="field-hint">Timer will count down from this duration</span>
              </div>

              <div className="field-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={settings.reset_on_activity} onChange={(e) => setSettings({ ...settings, reset_on_activity: e.target.checked })} />
                  <span>Reset timer when cart changes</span>
                </label>
                <span className="field-hint">Timer restarts when items are added or removed</span>
              </div>

              <div className="field-group">
                <label>Minimum Cart Value ($)</label>
                <input type="number" min="0" step="0.01" value={settings.min_cart_value} onChange={(e) => setSettings({ ...settings, min_cart_value: parseFloat(e.target.value) || 0 })} className="field-input" />
                <span className="field-hint">Only show timer when cart exceeds this value (0 = always show)</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="settings-section">
            <h3>Messages</h3>
            <div className="settings-card">
              <div className="field-group">
                <label>Main Message</label>
                <input type="text" value={settings.message_template} onChange={(e) => setSettings({ ...settings, message_template: e.target.value })} className="field-input" placeholder="Your cart will expire in {time}!" />
                <span className="field-hint">Use {'{time}'} to show the countdown</span>
              </div>

              <div className="templates-grid">
                {MESSAGE_TEMPLATES.map((template, i) => (
                  <button key={i} className={`template-btn ${settings.message_template === template.msg ? 'active' : ''}`} onClick={() => setSettings({ ...settings, message_template: template.msg })}>
                    {template.label}
                  </button>
                ))}
              </div>

              <div className="field-group">
                <label>Urgency Message (Last 2 Minutes)</label>
                <input type="text" value={settings.urgency_message || ''} onChange={(e) => setSettings({ ...settings, urgency_message: e.target.value })} className="field-input" placeholder="Hurry! Only {time} left!" />
                <span className="field-hint">Shows when less than 2 minutes remaining</span>
              </div>

              <div className="field-group">
                <label>Expired Message</label>
                <input type="text" value={settings.expired_message} onChange={(e) => setSettings({ ...settings, expired_message: e.target.value })} className="field-input" />
              </div>
            </div>
          </div>

          {/* Display Style */}
          <div className="settings-section">
            <h3>Display Style</h3>
            <div className="settings-card">
              <div className="field-group">
                <label>Timer Style</label>
                <div className="style-options">
                  {[
                    { value: 'bar', label: 'Full Bar', desc: 'Spans full width' },
                    { value: 'floating', label: 'Floating Badge', desc: 'Compact floating badge' },
                    { value: 'inline', label: 'Inline Text', desc: 'Simple text' },
                    { value: 'countdown-only', label: 'Countdown Only', desc: 'Just the timer' },
                  ].map((style) => (
                    <label key={style.value} className={`style-option ${settings.style === style.value ? 'selected' : ''}`}>
                      <input type="radio" name="timerStyle" value={style.value} checked={settings.style === style.value} onChange={(e) => setSettings({ ...settings, style: e.target.value })} />
                      <span className="style-label">{style.label}</span>
                      <span className="style-desc">{style.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <label>Position</label>
                <div className="position-options">
                  {[
                    { value: 'top', label: 'Top of Cart' },
                    { value: 'bottom', label: 'Above Checkout' },
                    { value: 'floating', label: 'Floating Corner' },
                  ].map((pos) => (
                    <label key={pos.value} className={`position-option ${settings.position === pos.value ? 'selected' : ''}`}>
                      <input type="radio" name="position" value={pos.value} checked={settings.position === pos.value} onChange={(e) => setSettings({ ...settings, position: e.target.value })} />
                      <span>{pos.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={settings.show_progress_bar} onChange={(e) => setSettings({ ...settings, show_progress_bar: e.target.checked })} />
                  <span>Show progress bar</span>
                </label>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="settings-section">
            <h3>Colors</h3>
            <div className="settings-card">
              <div className="color-grid">
                <div className="field-group">
                  <label>Background</label>
                  <div className="color-input-wrapper">
                    <input type="color" value={settings.background_color} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="color-input" />
                    <input type="text" value={settings.background_color} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="field-input color-text" />
                  </div>
                </div>
                <div className="field-group">
                  <label>Text</label>
                  <div className="color-input-wrapper">
                    <input type="color" value={settings.text_color} onChange={(e) => setSettings({ ...settings, text_color: e.target.value })} className="color-input" />
                    <input type="text" value={settings.text_color} onChange={(e) => setSettings({ ...settings, text_color: e.target.value })} className="field-input color-text" />
                  </div>
                </div>
                <div className="field-group">
                  <label>Timer Numbers</label>
                  <div className="color-input-wrapper">
                    <input type="color" value={settings.timer_color} onChange={(e) => setSettings({ ...settings, timer_color: e.target.value })} className="color-input" />
                    <input type="text" value={settings.timer_color} onChange={(e) => setSettings({ ...settings, timer_color: e.target.value })} className="field-input color-text" />
                  </div>
                </div>
                <div className="field-group">
                  <label>Accent</label>
                  <div className="color-input-wrapper">
                    <input type="color" value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} className="color-input" />
                    <input type="text" value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} className="field-input color-text" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sizing & Animation */}
          <div className="settings-section">
            <h3>Sizing & Animation</h3>
            <div className="settings-card">
              <div className="slider-group">
                <div className="field-group">
                  <label>Font Size: {settings.font_size}px</label>
                  <input type="range" min="12" max="20" value={settings.font_size} onChange={(e) => setSettings({ ...settings, font_size: parseInt(e.target.value) })} className="range-input" />
                </div>
                <div className="field-group">
                  <label>Padding: {settings.padding}px</label>
                  <input type="range" min="8" max="24" value={settings.padding} onChange={(e) => setSettings({ ...settings, padding: parseInt(e.target.value) })} className="range-input" />
                </div>
                <div className="field-group">
                  <label>Border Radius: {settings.border_radius}px</label>
                  <input type="range" min="0" max="20" value={settings.border_radius} onChange={(e) => setSettings({ ...settings, border_radius: parseInt(e.target.value) })} className="range-input" />
                </div>
              </div>

              <div className="field-group">
                <label>Animation</label>
                <div className="animation-options">
                  {['none', 'pulse', 'shake', 'flash'].map((anim) => (
                    <label key={anim} className={`animation-option ${settings.animation === anim ? 'selected' : ''}`}>
                      <input type="radio" name="animation" value={anim} checked={settings.animation === anim} onChange={(e) => setSettings({ ...settings, animation: e.target.value })} />
                      <span>{anim.charAt(0).toUpperCase() + anim.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={settings.animate_last_minute} onChange={(e) => setSettings({ ...settings, animate_last_minute: e.target.checked })} />
                  <span>Animate in last minute (create urgency)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .timer-page { max-width: 1200px; margin: 0 auto; padding: 24px; background: #f6f6f7; min-height: 100vh; }

        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .back-button { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; color: #6d7175; }
        .header-content h1 { font-size: 24px; font-weight: 700; color: #202223; margin: 0 0 4px 0; }
        .header-content p { font-size: 14px; color: #6d7175; margin: 0; }
        .header-actions { display: flex; align-items: center; gap: 16px; }

        .master-toggle { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; }
        .master-toggle input { display: none; }
        .master-toggle .toggle-slider { position: relative; width: 48px; height: 28px; background: #d1d5db; border-radius: 14px; transition: 0.2s; }
        .master-toggle .toggle-slider::before { content: ''; position: absolute; width: 22px; height: 22px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
        .master-toggle input:checked + .toggle-slider { background: #000; }
        .master-toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

        .save-button { padding: 12px 24px; background: #000; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .save-button:disabled { opacity: 0.6; }
        .save-button.success { background: #000; }

        .content-grid { display: grid; grid-template-columns: 350px 1fr; gap: 24px; }

        .preview-column { position: sticky; top: 24px; height: fit-content; }
        .preview-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .preview-card h3 { font-size: 14px; font-weight: 600; color: #6d7175; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .preview-card.urgency .timer-preview { animation: pulse 1s infinite; }
        .preview-card.expired .timer-preview { opacity: 0.7; }

        .timer-preview { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; font-weight: 500; }
        .timer-preview.bar { flex-direction: row; justify-content: center; }
        .timer-icon { font-size: 18px; }
        .timer-preview :global(.timer-value) { font-weight: 700; font-variant-numeric: tabular-nums; }
        .progress-bar { width: 100%; height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; margin-top: 8px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }

        .preview-controls { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .preview-controls label { font-size: 12px; color: #6d7175; }
        .preview-controls input { width: 80px; padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: monospace; }

        .settings-column { display: flex; flex-direction: column; gap: 24px; }
        .settings-section h3 { font-size: 16px; font-weight: 600; color: #202223; margin: 0 0 16px 0; }
        .settings-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

        .field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .field-group:last-child { margin-bottom: 0; }
        .field-group label { font-size: 13px; font-weight: 500; color: #374151; }
        .field-input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .field-input:focus { outline: none; border-color: #000; }
        .field-hint { font-size: 12px; color: #9ca3af; }

        .duration-input { display: flex; align-items: center; gap: 8px; }
        .duration-input .field-input { width: 80px; }
        .duration-label { font-size: 14px; color: #6d7175; }

        .templates-grid { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 16px; }
        .template-btn { padding: 8px 16px; background: #f3f4f6; border: 1px solid transparent; border-radius: 20px; font-size: 13px; color: #374151; cursor: pointer; transition: all 0.2s; }
        .template-btn:hover { background: #e5e7eb; }
        .template-btn.active { background: #f3f4f6; border-color: #000; color: #000; }

        .style-options { display: flex; flex-direction: column; gap: 8px; }
        .style-option { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9fafb; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .style-option:hover { background: #f3f4f6; }
        .style-option.selected { border-color: #000; background: #f9fafb; }
        .style-option input { display: none; }
        .style-icon { font-size: 18px; width: 24px; text-align: center; }
        .style-label { font-weight: 500; color: #374151; }
        .style-desc { font-size: 12px; color: #9ca3af; margin-left: auto; }

        .position-options { display: flex; gap: 8px; }
        .position-option { flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px; background: #f9fafb; border: 2px solid transparent; border-radius: 8px; cursor: pointer; font-size: 13px; color: #374151; transition: all 0.2s; }
        .position-option:hover { background: #f3f4f6; }
        .position-option.selected { border-color: #000; background: #f9fafb; }
        .position-option input { display: none; }

        .color-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .color-input-wrapper { display: flex; gap: 8px; }
        .color-input { width: 44px; height: 40px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; padding: 2px; }
        .color-text { flex: 1; }

        .slider-group { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        .range-input { width: 100%; height: 6px; -webkit-appearance: none; background: #e5e7eb; border-radius: 3px; outline: none; }
        .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #000; border-radius: 50%; cursor: pointer; }

        .animation-options { display: flex; gap: 8px; flex-wrap: wrap; }
        .animation-option { padding: 10px 16px; background: #f9fafb; border: 2px solid transparent; border-radius: 8px; cursor: pointer; font-size: 13px; color: #374151; transition: all 0.2s; }
        .animation-option:hover { background: #f3f4f6; }
        .animation-option.selected { border-color: #000; background: #f9fafb; }
        .animation-option input { display: none; }

        .checkbox-group { flex-direction: row !important; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #374151; }
        .checkbox-label input { width: 18px; height: 18px; }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; }
          .preview-column { position: static; }
          .slider-group { grid-template-columns: 1fr; }
          .color-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
