'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

interface TrustBadge {
  id?: string;
  badge_type: string;
  title: string;
  subtitle?: string;
  icon: string;
  custom_icon_url?: string;
  background_color: string;
  text_color: string;
  icon_color: string;
  position: number;
  is_active: boolean;
}

interface TrustBadgeSettings {
  enabled: boolean;
  display_style: string;
  position: string;
  show_border: boolean;
  show_background: boolean;
  background_color: string;
  border_color: string;
  border_radius: number;
  padding: number;
  spacing: number;
  icon_size: string;
  animation: string;
}

const BADGE_ICONS = [
  { value: 'shield', label: 'Shield', emoji: '🛡️' },
  { value: 'lock', label: 'Lock', emoji: '🔒' },
  { value: 'check', label: 'Check', emoji: '✅' },
  { value: 'truck', label: 'Truck', emoji: '🚚' },
  { value: 'clock', label: 'Clock', emoji: '⏰' },
  { value: 'heart', label: 'Heart', emoji: '❤️' },
  { value: 'star', label: 'Star', emoji: '⭐' },
  { value: 'credit-card', label: 'Card', emoji: '💳' },
  { value: 'refresh', label: 'Refresh', emoji: '🔄' },
  { value: 'headphones', label: 'Support', emoji: '🎧' },
  { value: 'gift', label: 'Gift', emoji: '🎁' },
  { value: 'percent', label: 'Percent', emoji: '💯' },
];

const BADGE_TEMPLATES = [
  { type: 'secure_checkout', title: '100% Secure Checkout', subtitle: 'SSL Encrypted', icon: 'lock', bgColor: '#f0fdf4', textColor: '#166534', iconColor: '#22c55e' },
  { type: 'money_back', title: '30-Day Money Back', subtitle: 'Guaranteed', icon: 'refresh', bgColor: '#eff6ff', textColor: '#1e40af', iconColor: '#3b82f6' },
  { type: 'free_shipping', title: 'Free Shipping', subtitle: 'On orders over $50', icon: 'truck', bgColor: '#fefce8', textColor: '#854d0e', iconColor: '#eab308' },
  { type: 'support', title: '24/7 Support', subtitle: 'We are here to help', icon: 'headphones', bgColor: '#fdf4ff', textColor: '#86198f', iconColor: '#d946ef' },
  { type: 'quality', title: 'Premium Quality', subtitle: 'Satisfaction guaranteed', icon: 'star', bgColor: '#fff7ed', textColor: '#9a3412', iconColor: '#f97316' },
  { type: 'safe_payment', title: 'Safe Payment', subtitle: 'All major cards accepted', icon: 'credit-card', bgColor: '#f0f9ff', textColor: '#075985', iconColor: '#0ea5e9' },
];

export default function TrustBadgesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'badges' | 'settings'>('badges');

  const [settings, setSettings] = useState<TrustBadgeSettings>({
    enabled: true,
    display_style: 'horizontal',
    position: 'below_checkout',
    show_border: true,
    show_background: true,
    background_color: '#ffffff',
    border_color: '#e5e7eb',
    border_radius: 12,
    padding: 16,
    spacing: 12,
    icon_size: 'medium',
    animation: 'none',
  });

  const [badges, setBadges] = useState<TrustBadge[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await authenticatedFetch('/api/admin/trust-badges');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.badges) setBadges(data.badges);
      }
    } catch (error) {
      console.error('Failed to fetch trust badges:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await authenticatedFetch('/api/admin/trust-badges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, badges }),
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

  function addBadge(template?: typeof BADGE_TEMPLATES[0]) {
    const newBadge: TrustBadge = template ? {
      badge_type: template.type,
      title: template.title,
      subtitle: template.subtitle,
      icon: template.icon,
      background_color: template.bgColor,
      text_color: template.textColor,
      icon_color: template.iconColor,
      position: badges.length,
      is_active: true,
    } : {
      badge_type: 'custom',
      title: 'New Badge',
      subtitle: '',
      icon: 'shield',
      background_color: '#f9fafb',
      text_color: '#374151',
      icon_color: '#6b7280',
      position: badges.length,
      is_active: true,
    };
    setBadges([...badges, newBadge]);
  }

  function removeBadge(index: number) {
    setBadges(badges.filter((_, i) => i !== index));
  }

  function updateBadge(index: number, field: keyof TrustBadge, value: string | number | boolean) {
    const newBadges = [...badges];
    const badge = newBadges[index];
    if (badge) {
      newBadges[index] = { ...badge, [field]: value };
    }
    setBadges(newBadges);
  }

  function moveBadge(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= badges.length) return;
    const newBadges = [...badges];
    [newBadges[index], newBadges[newIndex]] = [newBadges[newIndex]!, newBadges[index]!];
    setBadges(newBadges);
  }

  const getIconEmoji = (iconValue: string) => {
    return BADGE_ICONS.find(i => i.value === iconValue)?.emoji || '🛡️';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading trust badges...</p>
        <style jsx>{`
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; background: #f6f6f7; }
          .loading-spinner { width: 40px; height: 40px; border: 3px solid #e4e5e7; border-top-color: #5c6ac4; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          p { margin-top: 16px; color: #6d7175; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="trust-badges-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={() => router.push('/cart-features')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="header-content">
            <h1>Trust Badges</h1>
            <p>Build customer confidence with security and trust indicators</p>
          </div>
        </div>
        <div className="header-actions">
          <label className="master-toggle">
            <span>Enable Trust Badges</span>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
          <button onClick={saveChanges} disabled={saving} className={`save-button ${saveSuccess ? 'success' : ''}`}>
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>
          <span>🛡️</span> Badges
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span>⚙️</span> Display Settings
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'badges' && (
          <div className="badges-tab">
            {/* Preview */}
            <div className="preview-section">
              <h3>Preview</h3>
              <div className={`badges-preview ${settings.display_style}`} style={{
                background: settings.show_background ? settings.background_color : 'transparent',
                border: settings.show_border ? `1px solid ${settings.border_color}` : 'none',
                borderRadius: `${settings.border_radius}px`,
                padding: `${settings.padding}px`,
                gap: `${settings.spacing}px`,
              }}>
                {badges.filter(b => b.is_active).map((badge, i) => (
                  <div key={i} className={`badge-preview-item ${settings.icon_size}`} style={{
                    background: badge.background_color,
                    color: badge.text_color,
                  }}>
                    <div className="badge-icon" style={{ color: badge.icon_color }}>
                      {getIconEmoji(badge.icon)}
                    </div>
                    <div className="badge-text">
                      <strong>{badge.title}</strong>
                      {badge.subtitle && <span>{badge.subtitle}</span>}
                    </div>
                  </div>
                ))}
                {badges.filter(b => b.is_active).length === 0 && (
                  <p className="preview-empty">Add badges below to see preview</p>
                )}
              </div>
            </div>

            {/* Badge Templates */}
            <div className="templates-section">
              <h3>Quick Add Templates</h3>
              <div className="template-grid">
                {BADGE_TEMPLATES.map((template, i) => (
                  <button key={i} className="template-card" onClick={() => addBadge(template)} style={{ background: template.bgColor }}>
                    <span className="template-icon" style={{ color: template.iconColor }}>{getIconEmoji(template.icon)}</span>
                    <span className="template-title" style={{ color: template.textColor }}>{template.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Badge List */}
            <div className="badges-list">
              <h3>Your Badges</h3>
              {badges.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🛡️</span>
                  <h4>No badges yet</h4>
                  <p>Add your first trust badge to build customer confidence.</p>
                  <button onClick={() => addBadge()} className="add-button primary">+ Add Custom Badge</button>
                </div>
              ) : (
                <>
                  {badges.map((badge, index) => (
                    <div key={index} className={`badge-card ${!badge.is_active ? 'inactive' : ''}`}>
                      <div className="badge-card-header">
                        <div className="badge-drag">
                          <button onClick={() => moveBadge(index, 'up')} disabled={index === 0}>↑</button>
                          <button onClick={() => moveBadge(index, 'down')} disabled={index === badges.length - 1}>↓</button>
                        </div>
                        <div className="badge-preview-mini" style={{ background: badge.background_color }}>
                          <span style={{ color: badge.icon_color }}>{getIconEmoji(badge.icon)}</span>
                        </div>
                        <span className="badge-title-preview">{badge.title}</span>
                        <div className="badge-actions">
                          <label className="active-toggle">
                            <input type="checkbox" checked={badge.is_active} onChange={(e) => updateBadge(index, 'is_active', e.target.checked)} />
                            <span>{badge.is_active ? 'Active' : 'Inactive'}</span>
                          </label>
                          <button onClick={() => removeBadge(index)} className="remove-btn">Remove</button>
                        </div>
                      </div>

                      <div className="badge-fields">
                        <div className="field-row">
                          <div className="field-group">
                            <label>Title</label>
                            <input type="text" value={badge.title} onChange={(e) => updateBadge(index, 'title', e.target.value)} className="field-input" />
                          </div>
                          <div className="field-group">
                            <label>Subtitle</label>
                            <input type="text" value={badge.subtitle || ''} onChange={(e) => updateBadge(index, 'subtitle', e.target.value)} placeholder="Optional" className="field-input" />
                          </div>
                        </div>

                        <div className="field-group">
                          <label>Icon</label>
                          <div className="icon-picker">
                            {BADGE_ICONS.map((icon) => (
                              <button key={icon.value} type="button" className={`icon-option ${badge.icon === icon.value ? 'selected' : ''}`} onClick={() => updateBadge(index, 'icon', icon.value)} title={icon.label}>
                                {icon.emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="field-row">
                          <div className="field-group">
                            <label>Background Color</label>
                            <div className="color-input-wrapper">
                              <input type="color" value={badge.background_color} onChange={(e) => updateBadge(index, 'background_color', e.target.value)} className="color-input" />
                              <input type="text" value={badge.background_color} onChange={(e) => updateBadge(index, 'background_color', e.target.value)} className="field-input color-text" />
                            </div>
                          </div>
                          <div className="field-group">
                            <label>Text Color</label>
                            <div className="color-input-wrapper">
                              <input type="color" value={badge.text_color} onChange={(e) => updateBadge(index, 'text_color', e.target.value)} className="color-input" />
                              <input type="text" value={badge.text_color} onChange={(e) => updateBadge(index, 'text_color', e.target.value)} className="field-input color-text" />
                            </div>
                          </div>
                          <div className="field-group">
                            <label>Icon Color</label>
                            <div className="color-input-wrapper">
                              <input type="color" value={badge.icon_color} onChange={(e) => updateBadge(index, 'icon_color', e.target.value)} className="color-input" />
                              <input type="text" value={badge.icon_color} onChange={(e) => updateBadge(index, 'icon_color', e.target.value)} className="field-input color-text" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={() => addBadge()} className="add-button">+ Add Custom Badge</button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-section">
              <h3>Layout</h3>
              <div className="settings-card">
                <div className="field-group">
                  <label>Display Style</label>
                  <div className="style-options">
                    {[
                      { value: 'horizontal', label: 'Horizontal Row', desc: 'Badges in a row' },
                      { value: 'vertical', label: 'Vertical Stack', desc: 'Stacked vertically' },
                      { value: 'grid', label: 'Grid Layout', desc: '2-3 column grid' },
                      { value: 'compact', label: 'Compact Strip', desc: 'Icons only, minimal' },
                    ].map((style) => (
                      <label key={style.value} className={`style-option ${settings.display_style === style.value ? 'selected' : ''}`}>
                        <input type="radio" name="displayStyle" value={style.value} checked={settings.display_style === style.value} onChange={(e) => setSettings({ ...settings, display_style: e.target.value })} />
                        <span className="style-label">{style.label}</span>
                        <span className="style-desc">{style.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label>Position</label>
                  <select value={settings.position} onChange={(e) => setSettings({ ...settings, position: e.target.value })} className="field-select">
                    <option value="above_items">Above Cart Items</option>
                    <option value="below_items">Below Cart Items</option>
                    <option value="below_checkout">Below Checkout Button</option>
                    <option value="footer">Cart Footer</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Icon Size</label>
                  <div className="size-options">
                    {['small', 'medium', 'large'].map((size) => (
                      <label key={size} className={`size-option ${settings.icon_size === size ? 'selected' : ''}`}>
                        <input type="radio" name="iconSize" value={size} checked={settings.icon_size === size} onChange={(e) => setSettings({ ...settings, icon_size: e.target.value })} />
                        <span>{size.charAt(0).toUpperCase() + size.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Container Styling</h3>
              <div className="settings-card">
                <div className="field-row">
                  <div className="field-group checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={settings.show_background} onChange={(e) => setSettings({ ...settings, show_background: e.target.checked })} />
                      <span>Show Background</span>
                    </label>
                  </div>
                  <div className="field-group checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={settings.show_border} onChange={(e) => setSettings({ ...settings, show_border: e.target.checked })} />
                      <span>Show Border</span>
                    </label>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label>Background Color</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.background_color} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.background_color} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Border Color</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.border_color} onChange={(e) => setSettings({ ...settings, border_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.border_color} onChange={(e) => setSettings({ ...settings, border_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label>Border Radius: {settings.border_radius}px</label>
                    <input type="range" min="0" max="24" value={settings.border_radius} onChange={(e) => setSettings({ ...settings, border_radius: parseInt(e.target.value) })} className="range-input" />
                  </div>
                  <div className="field-group">
                    <label>Padding: {settings.padding}px</label>
                    <input type="range" min="8" max="32" value={settings.padding} onChange={(e) => setSettings({ ...settings, padding: parseInt(e.target.value) })} className="range-input" />
                  </div>
                  <div className="field-group">
                    <label>Spacing: {settings.spacing}px</label>
                    <input type="range" min="4" max="24" value={settings.spacing} onChange={(e) => setSettings({ ...settings, spacing: parseInt(e.target.value) })} className="range-input" />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Animation</h3>
              <div className="settings-card">
                <div className="field-group">
                  <label>Animation Effect</label>
                  <div className="animation-options">
                    {[
                      { value: 'none', label: 'None' },
                      { value: 'fade', label: 'Fade In' },
                      { value: 'slide', label: 'Slide In' },
                      { value: 'bounce', label: 'Bounce' },
                    ].map((anim) => (
                      <label key={anim.value} className={`animation-option ${settings.animation === anim.value ? 'selected' : ''}`}>
                        <input type="radio" name="animation" value={anim.value} checked={settings.animation === anim.value} onChange={(e) => setSettings({ ...settings, animation: e.target.value })} />
                        <span>{anim.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .trust-badges-page { max-width: 900px; margin: 0 auto; padding: 24px; background: #f6f6f7; min-height: 100vh; }

        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .back-button { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; color: #6d7175; }
        .back-button:hover { background: #f3f4f6; }
        .header-content h1 { font-size: 24px; font-weight: 700; color: #202223; margin: 0 0 4px 0; }
        .header-content p { font-size: 14px; color: #6d7175; margin: 0; }
        .header-actions { display: flex; align-items: center; gap: 16px; }

        .master-toggle { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; color: #374151; cursor: pointer; }
        .master-toggle input { display: none; }
        .master-toggle .toggle-slider { position: relative; width: 48px; height: 28px; background: #d1d5db; border-radius: 14px; transition: 0.2s; }
        .master-toggle .toggle-slider::before { content: ''; position: absolute; width: 22px; height: 22px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
        .master-toggle input:checked + .toggle-slider { background: #10b981; }
        .master-toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

        .save-button { padding: 12px 24px; background: #000; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .save-button:hover { background: #333; }
        .save-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .save-button.success { background: #10b981; }

        .tabs-container { display: flex; gap: 4px; background: #fff; border-radius: 12px; padding: 4px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; background: transparent; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; color: #6d7175; cursor: pointer; transition: all 0.2s; }
        .tab:hover { background: #f6f6f7; color: #202223; }
        .tab.active { background: #000; color: #fff; }

        .tab-content { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

        .preview-section, .templates-section, .badges-list, .settings-section { margin-bottom: 32px; }
        .preview-section h3, .templates-section h3, .badges-list h3, .settings-section h3 { font-size: 16px; font-weight: 600; color: #202223; margin: 0 0 16px 0; }

        .badges-preview { display: flex; flex-wrap: wrap; }
        .badges-preview.horizontal { flex-direction: row; align-items: center; justify-content: center; }
        .badges-preview.vertical { flex-direction: column; align-items: stretch; }
        .badges-preview.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
        .badges-preview.compact { flex-direction: row; justify-content: center; }

        .badge-preview-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 8px; }
        .badge-preview-item.small .badge-icon { font-size: 18px; }
        .badge-preview-item.medium .badge-icon { font-size: 24px; }
        .badge-preview-item.large .badge-icon { font-size: 32px; }
        .badge-text { display: flex; flex-direction: column; }
        .badge-text strong { font-size: 13px; font-weight: 600; }
        .badge-text span { font-size: 11px; opacity: 0.8; }
        .preview-empty { color: #9ca3af; text-align: center; padding: 24px; width: 100%; }

        .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        .template-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; border: 1px solid transparent; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .template-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .template-icon { font-size: 24px; }
        .template-title { font-size: 12px; font-weight: 500; text-align: center; }

        .badge-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .badge-card.inactive { opacity: 0.6; }
        .badge-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .badge-drag { display: flex; flex-direction: column; gap: 4px; }
        .badge-drag button { width: 24px; height: 20px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; }
        .badge-drag button:disabled { opacity: 0.3; cursor: not-allowed; }
        .badge-preview-mini { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .badge-title-preview { flex: 1; font-weight: 500; color: #374151; }
        .badge-actions { display: flex; align-items: center; gap: 12px; }
        .active-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6d7175; cursor: pointer; }
        .active-toggle input { width: 16px; height: 16px; }
        .remove-btn { padding: 6px 12px; background: transparent; color: #dc2626; border: 1px solid #dc2626; border-radius: 6px; font-size: 12px; cursor: pointer; }
        .remove-btn:hover { background: #fef2f2; }

        .badge-fields { display: flex; flex-direction: column; gap: 16px; }
        .field-row { display: flex; gap: 16px; flex-wrap: wrap; }
        .field-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 120px; }
        .field-group label { font-size: 13px; font-weight: 500; color: #374151; }
        .field-input, .field-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .field-input:focus, .field-select:focus { outline: none; border-color: #000; }

        .color-input-wrapper { display: flex; gap: 8px; }
        .color-input { width: 44px; height: 40px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; padding: 2px; }
        .color-text { flex: 1; }

        .icon-picker { display: flex; flex-wrap: wrap; gap: 8px; }
        .icon-option { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border: 2px solid transparent; border-radius: 8px; font-size: 18px; cursor: pointer; transition: all 0.2s; }
        .icon-option:hover { background: #e5e7eb; }
        .icon-option.selected { border-color: #000; background: #fff; }

        .add-button { width: 100%; padding: 14px; background: transparent; border: 2px dashed #d1d5db; border-radius: 8px; font-size: 14px; font-weight: 500; color: #6d7175; cursor: pointer; transition: all 0.2s; }
        .add-button:hover { border-color: #9ca3af; color: #374151; }
        .add-button.primary { background: #000; border: none; color: #fff; }
        .add-button.primary:hover { background: #333; }

        .empty-state { text-align: center; padding: 40px 20px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; display: block; }
        .empty-state h4 { font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 8px 0; }
        .empty-state p { font-size: 14px; color: #6d7175; margin: 0 0 20px 0; }

        .settings-card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; }
        .settings-card .field-group { margin-bottom: 20px; }
        .settings-card .field-group:last-child { margin-bottom: 0; }

        .style-options, .animation-options { display: flex; flex-direction: column; gap: 8px; }
        .style-option, .animation-option { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .style-option:hover, .animation-option:hover { background: #f3f4f6; }
        .style-option.selected, .animation-option.selected { border-color: #000; }
        .style-option input, .animation-option input { display: none; }
        .style-label { font-weight: 500; color: #374151; }
        .style-desc { font-size: 12px; color: #9ca3af; }

        .size-options { display: flex; gap: 8px; }
        .size-option { flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px; background: #fff; border: 2px solid transparent; border-radius: 8px; cursor: pointer; font-size: 14px; color: #374151; transition: all 0.2s; }
        .size-option:hover { background: #f3f4f6; }
        .size-option.selected { border-color: #000; }
        .size-option input { display: none; }

        .range-input { width: 100%; height: 6px; -webkit-appearance: none; background: #e5e7eb; border-radius: 3px; outline: none; }
        .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #000; border-radius: 50%; cursor: pointer; }

        .checkbox-group { flex-direction: row !important; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #374151; }
        .checkbox-label input { width: 18px; height: 18px; }

        @media (max-width: 640px) {
          .trust-badges-page { padding: 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-direction: column; align-items: stretch; }
          .field-row { flex-direction: column; }
          .template-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
