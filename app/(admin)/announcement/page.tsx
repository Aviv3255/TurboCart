'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// SVG Icon Components
const IconSvgs: Record<string, JSX.Element> = {
  truck: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  gift: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  fire: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  star: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  tag: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  megaphone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
  sparkles: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/></svg>,
  party: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5.8 11.3L2 22l10.7-3.8"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2l-2.2 9.8"/><path d="M9 3l-.4 2"/><path d="M19 13l2-.4"/></svg>,
  heart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  percent: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  info: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

interface AnnouncementSettings {
  enabled: boolean;
  position: string;
  message: string;
  secondary_message: string | null;
  icon: string;
  link_enabled: boolean;
  link_url: string | null;
  link_text: string | null;
  link_new_tab: boolean;
  style: string;
  background_color: string;
  gradient_end_color: string;
  text_color: string;
  font_size: number;
  font_weight: string;
  padding: number;
  border_radius: number;
  animation: string;
  dismissible: boolean;
  dismiss_duration: number;
  schedule_enabled: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
  show_on_empty_cart: boolean;
  min_cart_value: number;
  max_cart_value: number | null;
}

const ICONS = [
  { value: 'truck', label: 'Truck' },
  { value: 'gift', label: 'Gift' },
  { value: 'fire', label: 'Fire' },
  { value: 'star', label: 'Star' },
  { value: 'tag', label: 'Tag' },
  { value: 'clock', label: 'Clock' },
  { value: 'megaphone', label: 'Megaphone' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'party', label: 'Party' },
  { value: 'heart', label: 'Heart' },
  { value: 'percent', label: 'Percent' },
  { value: 'info', label: 'Info' },
];

const QUICK_TEMPLATES = [
  { message: 'Free shipping on orders over $50!', icon: 'truck', style: 'success' },
  { message: 'Flash Sale - 20% off everything!', icon: 'fire', style: 'gradient' },
  { message: 'Complete your order for a free gift!', icon: 'gift', style: 'info' },
  { message: 'Limited time offer - ends today!', icon: 'clock', style: 'warning' },
  { message: 'Buy 2, Get 1 Free!', icon: 'tag', style: 'gradient' },
  { message: 'New arrivals just dropped!', icon: 'sparkles', style: 'solid' },
];

const STYLE_PRESETS = [
  { value: 'gradient', label: 'Gradient', colors: ['#667eea', '#764ba2'] },
  { value: 'solid', label: 'Solid Dark', colors: ['#000000', '#000000'] },
  { value: 'success', label: 'Success Green', colors: ['#10b981', '#059669'] },
  { value: 'warning', label: 'Warning Orange', colors: ['#f59e0b', '#d97706'] },
  { value: 'info', label: 'Info Blue', colors: ['#3b82f6', '#2563eb'] },
  { value: 'danger', label: 'Urgent Red', colors: ['#ef4444', '#dc2626'] },
  { value: 'purple', label: 'Purple', colors: ['#8b5cf6', '#7c3aed'] },
  { value: 'custom', label: 'Custom', colors: ['#667eea', '#764ba2'] },
];

export default function AnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState<AnnouncementSettings>({
    enabled: false,
    position: 'top',
    message: 'Free shipping on orders over $50!',
    secondary_message: null,
    icon: 'truck',
    link_enabled: false,
    link_url: null,
    link_text: null,
    link_new_tab: true,
    style: 'gradient',
    background_color: '#667eea',
    gradient_end_color: '#764ba2',
    text_color: '#ffffff',
    font_size: 14,
    font_weight: '500',
    padding: 12,
    border_radius: 8,
    animation: 'none',
    dismissible: false,
    dismiss_duration: 24,
    schedule_enabled: false,
    schedule_start: null,
    schedule_end: null,
    show_on_empty_cart: true,
    min_cart_value: 0,
    max_cart_value: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await authenticatedFetch('/api/admin/announcement-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch announcement settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await authenticatedFetch('/api/admin/announcement-settings', {
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

  const getIcon = (iconValue: string) => IconSvgs[iconValue] || IconSvgs.megaphone;

  const getBackground = () => {
    if (settings.style === 'gradient' || settings.style === 'custom') {
      return `linear-gradient(90deg, ${settings.background_color}, ${settings.gradient_end_color})`;
    }
    const preset = STYLE_PRESETS.find(s => s.value === settings.style);
    if (preset) {
      return `linear-gradient(90deg, ${preset.colors[0]}, ${preset.colors[1]})`;
    }
    return settings.background_color;
  };

  const applyStylePreset = (preset: typeof STYLE_PRESETS[0]) => {
    setSettings({
      ...settings,
      style: preset.value,
      background_color: preset.colors[0] || '#667eea',
      gradient_end_color: preset.colors[1] || '#764ba2',
    });
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setSettings({
      ...settings,
      message: template.message,
      icon: template.icon,
      style: template.style,
    });
    const preset = STYLE_PRESETS.find(p => p.value === template.style);
    if (preset) {
      setSettings(prev => ({
        ...prev,
        background_color: preset.colors[0] || '#667eea',
        gradient_end_color: preset.colors[1] || '#764ba2',
      }));
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading announcement settings...</p>
        <style jsx>{`
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; background: #f6f6f7; }
          .loading-spinner { width: 40px; height: 40px; border: 3px solid #e4e5e7; border-top-color: #667eea; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          p { margin-top: 16px; color: #6d7175; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="announcement-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={() => router.push('/cart-features')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="header-content">
            <h1>Announcement Bar</h1>
            <p>Display promotional messages to boost conversions</p>
          </div>
        </div>
        <div className="header-actions">
          <label className="master-toggle">
            <span>Enable Announcement</span>
            <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />
            <span className="toggle-slider"></span>
          </label>
          <button onClick={saveChanges} disabled={saving} className={`save-button ${saveSuccess ? 'success' : ''}`}>
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="content-grid">
        {/* Preview */}
        <div className="preview-column">
          <div className="preview-card">
            <h3>Live Preview</h3>
            <div className={`announcement-preview ${settings.animation !== 'none' ? 'animate-' + settings.animation : ''}`} style={{
              background: getBackground(),
              color: settings.text_color,
              fontSize: `${settings.font_size}px`,
              fontWeight: settings.font_weight,
              padding: `${settings.padding}px`,
              borderRadius: `${settings.border_radius}px`,
            }}>
              <span className="announcement-icon">{getIcon(settings.icon)}</span>
              <span className="announcement-text">{settings.message}</span>
              {settings.link_enabled && settings.link_text && (
                <span className="announcement-link">{settings.link_text} →</span>
              )}
              {settings.dismissible && (
                <button className="dismiss-btn">×</button>
              )}
            </div>
            {settings.secondary_message && (
              <div className="secondary-preview" style={{ fontSize: `${settings.font_size - 2}px`, padding: '8px', color: '#6b7280' }}>
                {settings.secondary_message}
              </div>
            )}
          </div>

          <div className="templates-card">
            <h3>Quick Templates</h3>
            <div className="templates-list">
              {QUICK_TEMPLATES.map((template, i) => (
                <button key={i} className="template-item" onClick={() => applyTemplate(template)}>
                  <span className="template-icon">{getIcon(template.icon)}</span>
                  <span className="template-text">{template.message}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="settings-column">
          {/* Content */}
          <div className="settings-section">
            <h3>Content</h3>
            <div className="settings-card">
              <div className="field-group">
                <label>Main Message</label>
                <input type="text" value={settings.message} onChange={(e) => setSettings({ ...settings, message: e.target.value })} className="field-input" placeholder="Free shipping on orders over $50!" />
              </div>

              <div className="field-group">
                <label>Secondary Message (Optional)</label>
                <input type="text" value={settings.secondary_message || ''} onChange={(e) => setSettings({ ...settings, secondary_message: e.target.value || null })} className="field-input" placeholder="Limited time only" />
              </div>

              <div className="field-group">
                <label>Icon</label>
                <div className="icon-picker">
                  {ICONS.map((icon) => (
                    <button key={icon.value} type="button" className={`icon-option ${settings.icon === icon.value ? 'selected' : ''}`} onClick={() => setSettings({ ...settings, icon: icon.value })} title={icon.label}>
                      {IconSvgs[icon.value]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Link */}
          <div className="settings-section">
            <h3>Call to Action</h3>
            <div className="settings-card">
              <div className="field-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={settings.link_enabled} onChange={(e) => setSettings({ ...settings, link_enabled: e.target.checked })} />
                  <span>Add clickable link</span>
                </label>
              </div>

              {settings.link_enabled && (
                <>
                  <div className="field-group">
                    <label>Link URL</label>
                    <input type="url" value={settings.link_url || ''} onChange={(e) => setSettings({ ...settings, link_url: e.target.value })} className="field-input" placeholder="https://yourstore.com/sale" />
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Link Text</label>
                      <input type="text" value={settings.link_text || ''} onChange={(e) => setSettings({ ...settings, link_text: e.target.value })} className="field-input" placeholder="Shop Now" />
                    </div>
                    <div className="field-group checkbox-group">
                      <label className="checkbox-label">
                        <input type="checkbox" checked={settings.link_new_tab} onChange={(e) => setSettings({ ...settings, link_new_tab: e.target.checked })} />
                        <span>Open in new tab</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Style */}
          <div className="settings-section">
            <h3>Style</h3>
            <div className="settings-card">
              <div className="field-group">
                <label>Color Preset</label>
                <div className="style-presets">
                  {STYLE_PRESETS.map((preset) => (
                    <button key={preset.value} className={`style-preset ${settings.style === preset.value ? 'selected' : ''}`} onClick={() => applyStylePreset(preset)} style={{ background: `linear-gradient(90deg, ${preset.colors[0]}, ${preset.colors[1]})` }}>
                      <span className="preset-check">{settings.style === preset.value ? '✓' : ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              {settings.style === 'custom' && (
                <div className="field-row">
                  <div className="field-group">
                    <label>Start Color</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.background_color} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.background_color} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>End Color</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.gradient_end_color} onChange={(e) => setSettings({ ...settings, gradient_end_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.gradient_end_color} onChange={(e) => setSettings({ ...settings, gradient_end_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Text Color</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.text_color} onChange={(e) => setSettings({ ...settings, text_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.text_color} onChange={(e) => setSettings({ ...settings, text_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                </div>
              )}

              <div className="slider-group">
                <div className="field-group">
                  <label>Font Size: {settings.font_size}px</label>
                  <input type="range" min="12" max="18" value={settings.font_size} onChange={(e) => setSettings({ ...settings, font_size: parseInt(e.target.value) })} className="range-input" />
                </div>
                <div className="field-group">
                  <label>Padding: {settings.padding}px</label>
                  <input type="range" min="8" max="20" value={settings.padding} onChange={(e) => setSettings({ ...settings, padding: parseInt(e.target.value) })} className="range-input" />
                </div>
                <div className="field-group">
                  <label>Border Radius: {settings.border_radius}px</label>
                  <input type="range" min="0" max="16" value={settings.border_radius} onChange={(e) => setSettings({ ...settings, border_radius: parseInt(e.target.value) })} className="range-input" />
                </div>
              </div>

              <div className="field-group">
                <label>Font Weight</label>
                <div className="weight-options">
                  {['400', '500', '600', '700'].map((weight) => (
                    <label key={weight} className={`weight-option ${settings.font_weight === weight ? 'selected' : ''}`}>
                      <input type="radio" name="fontWeight" value={weight} checked={settings.font_weight === weight} onChange={(e) => setSettings({ ...settings, font_weight: e.target.value })} />
                      <span style={{ fontWeight: parseInt(weight) }}>{weight === '400' ? 'Normal' : weight === '500' ? 'Medium' : weight === '600' ? 'Semi' : 'Bold'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <label>Animation</label>
                <div className="animation-options">
                  {['none', 'pulse', 'shake', 'bounce', 'glow'].map((anim) => (
                    <label key={anim} className={`animation-option ${settings.animation === anim ? 'selected' : ''}`}>
                      <input type="radio" name="animation" value={anim} checked={settings.animation === anim} onChange={(e) => setSettings({ ...settings, animation: e.target.value })} />
                      <span>{anim.charAt(0).toUpperCase() + anim.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div className="settings-section">
            <h3>Behavior</h3>
            <div className="settings-card">
              <div className="field-group">
                <label>Position</label>
                <select value={settings.position} onChange={(e) => setSettings({ ...settings, position: e.target.value })} className="field-select">
                  <option value="top">Top of Cart</option>
                  <option value="bottom">Bottom of Cart</option>
                  <option value="floating">Floating</option>
                </select>
              </div>

              <div className="field-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={settings.dismissible} onChange={(e) => setSettings({ ...settings, dismissible: e.target.checked })} />
                  <span>Allow users to dismiss</span>
                </label>
              </div>

              {settings.dismissible && (
                <div className="field-group">
                  <label>Dismiss Duration</label>
                  <div className="duration-input">
                    <input type="number" min="1" max="168" value={settings.dismiss_duration} onChange={(e) => setSettings({ ...settings, dismiss_duration: parseInt(e.target.value) || 24 })} className="field-input" />
                    <span>hours until shown again</span>
                  </div>
                </div>
              )}

              <div className="field-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={settings.show_on_empty_cart} onChange={(e) => setSettings({ ...settings, show_on_empty_cart: e.target.checked })} />
                  <span>Show on empty cart</span>
                </label>
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label>Min Cart Value ($)</label>
                  <input type="number" min="0" step="0.01" value={settings.min_cart_value} onChange={(e) => setSettings({ ...settings, min_cart_value: parseFloat(e.target.value) || 0 })} className="field-input" />
                </div>
                <div className="field-group">
                  <label>Max Cart Value ($)</label>
                  <input type="number" min="0" step="0.01" value={settings.max_cart_value || ''} onChange={(e) => setSettings({ ...settings, max_cart_value: e.target.value ? parseFloat(e.target.value) : null })} className="field-input" placeholder="No limit" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .announcement-page { max-width: 1200px; margin: 0 auto; padding: 24px; background: #f6f6f7; min-height: 100vh; }

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
        .master-toggle input:checked + .toggle-slider { background: #667eea; }
        .master-toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

        .save-button { padding: 12px 24px; background: #000; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .save-button:disabled { opacity: 0.6; }
        .save-button.success { background: #10b981; }

        .content-grid { display: grid; grid-template-columns: 380px 1fr; gap: 24px; }

        .preview-column { position: sticky; top: 24px; height: fit-content; }
        .preview-card, .templates-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .preview-card h3, .templates-card h3 { font-size: 14px; font-weight: 600; color: #6d7175; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; }

        .announcement-preview { display: flex; align-items: center; gap: 10px; font-weight: 500; position: relative; }
        .announcement-icon { font-size: 18px; }
        .announcement-text { flex: 1; }
        .announcement-link { font-weight: 600; text-decoration: underline; cursor: pointer; white-space: nowrap; }
        .dismiss-btn { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: inherit; font-size: 18px; cursor: pointer; opacity: 0.7; }
        .secondary-preview { text-align: center; margin-top: 8px; }

        .templates-list { display: flex; flex-direction: column; gap: 8px; }
        .template-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9fafb; border: 1px solid transparent; border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.2s; }
        .template-item:hover { background: #f3f4f6; border-color: #e5e7eb; }
        .template-icon { font-size: 18px; }
        .template-text { font-size: 13px; color: #374151; }

        .settings-column { display: flex; flex-direction: column; gap: 24px; }
        .settings-section h3 { font-size: 16px; font-weight: 600; color: #202223; margin: 0 0 16px 0; }
        .settings-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

        .field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .field-group:last-child { margin-bottom: 0; }
        .field-group label { font-size: 13px; font-weight: 500; color: #374151; }
        .field-input, .field-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .field-input:focus, .field-select:focus { outline: none; border-color: #000; }
        .field-row { display: flex; gap: 16px; }
        .field-row .field-group { flex: 1; }

        .icon-picker { display: flex; flex-wrap: wrap; gap: 8px; }
        .icon-option { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border: 2px solid transparent; border-radius: 8px; font-size: 18px; cursor: pointer; }
        .icon-option:hover { background: #e5e7eb; }
        .icon-option.selected { border-color: #667eea; background: #eff6ff; }

        .style-presets { display: flex; flex-wrap: wrap; gap: 8px; }
        .style-preset { width: 50px; height: 32px; border-radius: 6px; border: 2px solid transparent; cursor: pointer; position: relative; }
        .style-preset.selected { border-color: #000; }
        .preset-check { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; }

        .color-input-wrapper { display: flex; gap: 8px; }
        .color-input { width: 44px; height: 40px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; padding: 2px; }
        .color-text { flex: 1; }

        .slider-group { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        .range-input { width: 100%; height: 6px; -webkit-appearance: none; background: #e5e7eb; border-radius: 3px; }
        .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #667eea; border-radius: 50%; cursor: pointer; }

        .weight-options, .animation-options { display: flex; gap: 8px; flex-wrap: wrap; }
        .weight-option, .animation-option { padding: 10px 16px; background: #f9fafb; border: 2px solid transparent; border-radius: 8px; cursor: pointer; font-size: 13px; color: #374151; }
        .weight-option:hover, .animation-option:hover { background: #f3f4f6; }
        .weight-option.selected, .animation-option.selected { border-color: #667eea; background: #eff6ff; }
        .weight-option input, .animation-option input { display: none; }

        .checkbox-group { flex-direction: row !important; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #374151; }
        .checkbox-label input { width: 18px; height: 18px; }

        .duration-input { display: flex; align-items: center; gap: 8px; }
        .duration-input .field-input { width: 80px; }
        .duration-input span { font-size: 14px; color: #6d7175; }

        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; }
          .preview-column { position: static; }
          .slider-group { grid-template-columns: 1fr; }
          .field-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
