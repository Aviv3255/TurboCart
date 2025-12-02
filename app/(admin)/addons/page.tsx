'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

interface AddonSettings {
  enabled: boolean;
  position: string;
  section_title: string;
  section_subtitle: string | null;
  show_section_header: boolean;
  display_style: string;
  columns: number;
  item_background: string;
  item_border_color: string;
  item_border_radius: number;
  item_padding: number;
  toggle_active_color: string;
  toggle_inactive_color: string;
  toggle_style: string;
  auto_add_defaults: boolean;
  show_savings: boolean;
}

interface AddonItem {
  id?: string;
  shopify_product_id: number | null;
  shopify_variant_id: number | null;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  icon: string;
  icon_url?: string;
  tooltip?: string;
  default_enabled: boolean;
  is_active: boolean;
}

const ICONS = [
  { value: 'shield', emoji: '🛡️', label: 'Shield' },
  { value: 'gift', emoji: '🎁', label: 'Gift' },
  { value: 'truck', emoji: '🚚', label: 'Truck' },
  { value: 'clock', emoji: '⏰', label: 'Clock' },
  { value: 'heart', emoji: '❤️', label: 'Heart' },
  { value: 'star', emoji: '⭐', label: 'Star' },
  { value: 'check', emoji: '✅', label: 'Check' },
  { value: 'fire', emoji: '🔥', label: 'Fire' },
  { value: 'sparkles', emoji: '✨', label: 'Sparkles' },
  { value: 'package', emoji: '📦', label: 'Package' },
  { value: 'leaf', emoji: '🌿', label: 'Leaf' },
  { value: 'recycle', emoji: '♻️', label: 'Recycle' },
];

const ADDON_TEMPLATES = [
  { name: 'Shipping Protection', desc: 'Protect your order against loss or damage', price: 4.99, icon: 'shield' },
  { name: 'Gift Wrapping', desc: 'Beautiful gift wrap with ribbon and card', price: 5.99, icon: 'gift' },
  { name: 'Priority Processing', desc: 'Ship your order within 24 hours', price: 3.99, icon: 'clock' },
  { name: 'Handwritten Note', desc: 'Personal message included with your order', price: 2.99, icon: 'heart' },
  { name: 'Extended Warranty', desc: '2-year extended warranty coverage', price: 9.99, icon: 'check' },
  { name: 'Carbon Neutral Shipping', desc: 'Offset carbon footprint of delivery', price: 1.99, icon: 'leaf' },
];

export default function AddonsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'settings'>('items');

  const [settings, setSettings] = useState<AddonSettings>({
    enabled: false,
    position: 'below_items',
    section_title: 'Protect Your Order',
    section_subtitle: 'Add valuable extras to your purchase',
    show_section_header: true,
    display_style: 'card',
    columns: 1,
    item_background: '#f9fafb',
    item_border_color: '#e5e7eb',
    item_border_radius: 10,
    item_padding: 12,
    toggle_active_color: '#10b981',
    toggle_inactive_color: '#d1d5db',
    toggle_style: 'switch',
    auto_add_defaults: true,
    show_savings: false,
  });

  const [items, setItems] = useState<AddonItem[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await authenticatedFetch('/api/admin/addon-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.items) setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch addon settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await authenticatedFetch('/api/admin/addon-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, items }),
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

  function addItem(template?: typeof ADDON_TEMPLATES[0]) {
    const newItem: AddonItem = template ? {
      shopify_product_id: null,
      shopify_variant_id: null,
      name: template.name,
      description: template.desc,
      price: template.price,
      icon: template.icon,
      default_enabled: false,
      is_active: true,
    } : {
      shopify_product_id: null,
      shopify_variant_id: null,
      name: 'New Add-On',
      description: '',
      price: 4.99,
      icon: 'shield',
      default_enabled: false,
      is_active: true,
    };
    setItems([...items, newItem]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof AddonItem, value: string | number | boolean | null) {
    const newItems = [...items];
    const item = newItems[index];
    if (item) {
      newItems[index] = { ...item, [field]: value };
    }
    setItems(newItems);
  }

  function moveItem(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex]!, newItems[index]!];
    setItems(newItems);
  }

  const getIconEmoji = (iconValue: string) => ICONS.find(i => i.value === iconValue)?.emoji || '🛡️';

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading add-on settings...</p>
        <style jsx>{`
          .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; background: #f6f6f7; }
          .loading-spinner { width: 40px; height: 40px; border: 3px solid #e4e5e7; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          p { margin-top: 16px; color: #6d7175; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="addons-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={() => router.push('/cart-features')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="header-content">
            <h1>Switch Add-Ons</h1>
            <p>One-click toggle products customers can add instantly</p>
          </div>
        </div>
        <div className="header-actions">
          <label className="master-toggle">
            <span>Enable Add-Ons</span>
            <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />
            <span className="toggle-slider"></span>
          </label>
          <button onClick={saveChanges} disabled={saving} className={`save-button ${saveSuccess ? 'success' : ''}`}>
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="preview-section">
        <div className="preview-card">
          <h3>Live Preview</h3>
          <div className="addons-preview" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            {settings.show_section_header && (
              <div className="preview-header">
                <strong>{settings.section_title}</strong>
                {settings.section_subtitle && <span>{settings.section_subtitle}</span>}
              </div>
            )}
            <div className={`preview-items ${settings.display_style}`} style={{ gridTemplateColumns: `repeat(${settings.columns}, 1fr)` }}>
              {items.filter(i => i.is_active).slice(0, 3).map((item, i) => (
                <div key={i} className="preview-item" style={{
                  background: settings.item_background,
                  border: `1px solid ${settings.item_border_color}`,
                  borderRadius: `${settings.item_border_radius}px`,
                  padding: `${settings.item_padding}px`,
                }}>
                  <div className="item-icon">{getIconEmoji(item.icon)}</div>
                  <div className="item-content">
                    <strong>{item.name}</strong>
                    <span className="item-price">${item.price.toFixed(2)}</span>
                  </div>
                  <div className={`item-toggle ${settings.toggle_style}`}>
                    <span className={`toggle-track ${item.default_enabled ? 'on' : ''}`} style={{
                      background: item.default_enabled ? settings.toggle_active_color : settings.toggle_inactive_color,
                    }}>
                      <span className="toggle-thumb"></span>
                    </span>
                  </div>
                </div>
              ))}
              {items.filter(i => i.is_active).length === 0 && (
                <p className="preview-empty">Add items below to see preview</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>
          <span>➕</span> Add-On Items
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span>⚙️</span> Display Settings
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'items' && (
          <div className="items-tab">
            {/* Quick Templates */}
            <div className="templates-section">
              <h3>Quick Add Templates</h3>
              <div className="templates-grid">
                {ADDON_TEMPLATES.map((template, i) => (
                  <button key={i} className="template-card" onClick={() => addItem(template)}>
                    <span className="template-icon">{getIconEmoji(template.icon)}</span>
                    <span className="template-name">{template.name}</span>
                    <span className="template-price">${template.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Item List */}
            <div className="items-list">
              <h3>Your Add-Ons</h3>
              {items.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">➕</span>
                  <h4>No add-ons yet</h4>
                  <p>Create your first add-on or use a template above.</p>
                  <button onClick={() => addItem()} className="add-button primary">+ Add Custom Add-On</button>
                </div>
              ) : (
                <>
                  {items.map((item, index) => (
                    <div key={index} className={`item-card ${!item.is_active ? 'inactive' : ''}`}>
                      <div className="item-header">
                        <div className="item-drag">
                          <button onClick={() => moveItem(index, 'up')} disabled={index === 0}>↑</button>
                          <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1}>↓</button>
                        </div>
                        <div className="item-preview-icon" style={{ background: item.is_active ? settings.toggle_active_color : '#e5e7eb' }}>
                          <span>{getIconEmoji(item.icon)}</span>
                        </div>
                        <div className="item-info">
                          <strong>{item.name}</strong>
                          <span>${item.price.toFixed(2)}</span>
                        </div>
                        <div className="item-actions">
                          <label className="active-toggle">
                            <input type="checkbox" checked={item.is_active} onChange={(e) => updateItem(index, 'is_active', e.target.checked)} />
                            <span>{item.is_active ? 'Active' : 'Inactive'}</span>
                          </label>
                          <button onClick={() => removeItem(index)} className="remove-btn">Remove</button>
                        </div>
                      </div>

                      <div className="item-fields">
                        <div className="field-row">
                          <div className="field-group">
                            <label>Name</label>
                            <input type="text" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} className="field-input" />
                          </div>
                          <div className="field-group small">
                            <label>Price ($)</label>
                            <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)} className="field-input" />
                          </div>
                          <div className="field-group small">
                            <label>Compare Price ($)</label>
                            <input type="number" min="0" step="0.01" value={item.compare_price || ''} onChange={(e) => updateItem(index, 'compare_price', e.target.value ? parseFloat(e.target.value) : null)} className="field-input" placeholder="Optional" />
                          </div>
                        </div>

                        <div className="field-group">
                          <label>Description</label>
                          <input type="text" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Brief description of the add-on" className="field-input" />
                        </div>

                        <div className="field-group">
                          <label>Icon</label>
                          <div className="icon-picker">
                            {ICONS.map((icon) => (
                              <button key={icon.value} type="button" className={`icon-option ${item.icon === icon.value ? 'selected' : ''}`} onClick={() => updateItem(index, 'icon', icon.value)} title={icon.label}>
                                {icon.emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="field-row">
                          <div className="field-group">
                            <label>Tooltip (Optional)</label>
                            <input type="text" value={item.tooltip || ''} onChange={(e) => updateItem(index, 'tooltip', e.target.value)} placeholder="Extra info on hover" className="field-input" />
                          </div>
                          <div className="field-group checkbox-group">
                            <label className="checkbox-label">
                              <input type="checkbox" checked={item.default_enabled} onChange={(e) => updateItem(index, 'default_enabled', e.target.checked)} />
                              <span>Pre-selected by default</span>
                            </label>
                            <span className="field-hint">Customer can still toggle off</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={() => addItem()} className="add-button">+ Add Custom Add-On</button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            {/* Header */}
            <div className="settings-section">
              <h3>Section Header</h3>
              <div className="settings-card">
                <div className="field-group checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={settings.show_section_header} onChange={(e) => setSettings({ ...settings, show_section_header: e.target.checked })} />
                    <span>Show section header</span>
                  </label>
                </div>

                {settings.show_section_header && (
                  <>
                    <div className="field-group">
                      <label>Title</label>
                      <input type="text" value={settings.section_title} onChange={(e) => setSettings({ ...settings, section_title: e.target.value })} className="field-input" />
                    </div>
                    <div className="field-group">
                      <label>Subtitle (Optional)</label>
                      <input type="text" value={settings.section_subtitle || ''} onChange={(e) => setSettings({ ...settings, section_subtitle: e.target.value || null })} className="field-input" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Layout */}
            <div className="settings-section">
              <h3>Layout</h3>
              <div className="settings-card">
                <div className="field-group">
                  <label>Display Style</label>
                  <div className="style-options">
                    {[
                      { value: 'card', label: 'Cards', desc: 'Full card layout' },
                      { value: 'compact', label: 'Compact', desc: 'Minimal layout' },
                      { value: 'list', label: 'List', desc: 'Vertical list' },
                      { value: 'inline', label: 'Inline', desc: 'Side by side' },
                    ].map((style) => (
                      <label key={style.value} className={`style-option ${settings.display_style === style.value ? 'selected' : ''}`}>
                        <input type="radio" name="displayStyle" value={style.value} checked={settings.display_style === style.value} onChange={(e) => setSettings({ ...settings, display_style: e.target.value })} />
                        <span className="style-label">{style.label}</span>
                        <span className="style-desc">{style.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label>Columns</label>
                    <select value={settings.columns} onChange={(e) => setSettings({ ...settings, columns: parseInt(e.target.value) })} className="field-select">
                      <option value={1}>1 Column</option>
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Position</label>
                    <select value={settings.position} onChange={(e) => setSettings({ ...settings, position: e.target.value })} className="field-select">
                      <option value="above_items">Above Cart Items</option>
                      <option value="below_items">Below Cart Items</option>
                      <option value="below_upsells">Below Upsells</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Item Styling */}
            <div className="settings-section">
              <h3>Item Styling</h3>
              <div className="settings-card">
                <div className="color-row">
                  <div className="field-group">
                    <label>Background</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.item_background} onChange={(e) => setSettings({ ...settings, item_background: e.target.value })} className="color-input" />
                      <input type="text" value={settings.item_background} onChange={(e) => setSettings({ ...settings, item_background: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Border</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.item_border_color} onChange={(e) => setSettings({ ...settings, item_border_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.item_border_color} onChange={(e) => setSettings({ ...settings, item_border_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="field-group">
                    <label>Border Radius: {settings.item_border_radius}px</label>
                    <input type="range" min="0" max="20" value={settings.item_border_radius} onChange={(e) => setSettings({ ...settings, item_border_radius: parseInt(e.target.value) })} className="range-input" />
                  </div>
                  <div className="field-group">
                    <label>Padding: {settings.item_padding}px</label>
                    <input type="range" min="8" max="24" value={settings.item_padding} onChange={(e) => setSettings({ ...settings, item_padding: parseInt(e.target.value) })} className="range-input" />
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle Styling */}
            <div className="settings-section">
              <h3>Toggle Styling</h3>
              <div className="settings-card">
                <div className="field-group">
                  <label>Toggle Style</label>
                  <div className="toggle-style-options">
                    {['switch', 'checkbox', 'button'].map((style) => (
                      <label key={style} className={`toggle-style-option ${settings.toggle_style === style ? 'selected' : ''}`}>
                        <input type="radio" name="toggleStyle" value={style} checked={settings.toggle_style === style} onChange={(e) => setSettings({ ...settings, toggle_style: e.target.value })} />
                        <span>{style.charAt(0).toUpperCase() + style.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="color-row">
                  <div className="field-group">
                    <label>Active Color</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.toggle_active_color} onChange={(e) => setSettings({ ...settings, toggle_active_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.toggle_active_color} onChange={(e) => setSettings({ ...settings, toggle_active_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Inactive Color</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.toggle_inactive_color} onChange={(e) => setSettings({ ...settings, toggle_inactive_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.toggle_inactive_color} onChange={(e) => setSettings({ ...settings, toggle_inactive_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Behavior */}
            <div className="settings-section">
              <h3>Behavior</h3>
              <div className="settings-card">
                <div className="checkbox-row">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={settings.auto_add_defaults} onChange={(e) => setSettings({ ...settings, auto_add_defaults: e.target.checked })} />
                    <span>Auto-add default items to cart</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={settings.show_savings} onChange={(e) => setSettings({ ...settings, show_savings: e.target.checked })} />
                    <span>Show savings (compare price)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .addons-page { max-width: 1000px; margin: 0 auto; padding: 24px; background: #f6f6f7; min-height: 100vh; }

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
        .master-toggle input:checked + .toggle-slider { background: #10b981; }
        .master-toggle input:checked + .toggle-slider::before { transform: translateX(20px); }

        .save-button { padding: 12px 24px; background: #000; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .save-button:disabled { opacity: 0.6; }
        .save-button.success { background: #10b981; }

        .preview-section { margin-bottom: 24px; }
        .preview-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .preview-card h3 { font-size: 14px; font-weight: 600; color: #6d7175; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .preview-header { margin-bottom: 16px; text-align: center; }
        .preview-header strong { display: block; font-size: 16px; color: #111827; }
        .preview-header span { font-size: 13px; color: #6b7280; }
        .preview-items { display: grid; gap: 12px; }
        .preview-item { display: flex; align-items: center; gap: 12px; }
        .item-icon { font-size: 24px; }
        .item-content { flex: 1; }
        .item-content strong { display: block; font-size: 14px; color: #111827; }
        .item-price { font-size: 13px; color: #6b7280; }
        .item-toggle { }
        .toggle-track { position: relative; display: inline-block; width: 44px; height: 24px; border-radius: 12px; transition: 0.2s; }
        .toggle-thumb { position: absolute; width: 20px; height: 20px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: 0.2s; }
        .toggle-track.on .toggle-thumb { left: 22px; }
        .preview-empty { text-align: center; color: #9ca3af; padding: 24px; }

        .tabs-container { display: flex; gap: 4px; background: #fff; border-radius: 12px; padding: 4px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; background: transparent; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; color: #6d7175; cursor: pointer; }
        .tab:hover { background: #f6f6f7; color: #202223; }
        .tab.active { background: #10b981; color: #fff; }

        .tab-content { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

        .templates-section { margin-bottom: 32px; }
        .templates-section h3, .items-list h3 { font-size: 16px; font-weight: 600; color: #202223; margin: 0 0 16px 0; }
        .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
        .template-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px; background: #f9fafb; border: 1px solid transparent; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .template-card:hover { background: #f3f4f6; border-color: #10b981; transform: translateY(-2px); }
        .template-icon { font-size: 24px; }
        .template-name { font-size: 13px; font-weight: 500; color: #374151; text-align: center; }
        .template-price { font-size: 12px; color: #6b7280; }

        .item-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .item-card.inactive { opacity: 0.6; }
        .item-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .item-drag { display: flex; flex-direction: column; gap: 4px; }
        .item-drag button { width: 24px; height: 20px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; }
        .item-drag button:disabled { opacity: 0.3; cursor: not-allowed; }
        .item-preview-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; }
        .item-info { flex: 1; }
        .item-info strong { display: block; font-size: 14px; color: #374151; }
        .item-info span { font-size: 12px; color: #6d7175; }
        .item-actions { display: flex; align-items: center; gap: 12px; }
        .active-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6d7175; cursor: pointer; }
        .active-toggle input { width: 16px; height: 16px; }
        .remove-btn { padding: 6px 12px; background: transparent; color: #dc2626; border: 1px solid #dc2626; border-radius: 6px; font-size: 12px; cursor: pointer; }

        .item-fields { display: flex; flex-direction: column; gap: 16px; }
        .field-row { display: flex; gap: 16px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .field-group.small { max-width: 120px; flex: none; }
        .field-group label { font-size: 13px; font-weight: 500; color: #374151; }
        .field-input, .field-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; width: 100%; }
        .field-input:focus, .field-select:focus { outline: none; border-color: #10b981; }
        .field-hint { font-size: 12px; color: #9ca3af; }

        .icon-picker { display: flex; flex-wrap: wrap; gap: 8px; }
        .icon-option { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border: 2px solid transparent; border-radius: 8px; font-size: 18px; cursor: pointer; }
        .icon-option:hover { background: #e5e7eb; }
        .icon-option.selected { border-color: #10b981; background: #d1fae5; }

        .add-button { width: 100%; padding: 14px; background: transparent; border: 2px dashed #d1d5db; border-radius: 8px; font-size: 14px; font-weight: 500; color: #6d7175; cursor: pointer; }
        .add-button:hover { border-color: #10b981; color: #059669; }
        .add-button.primary { background: #10b981; border: none; color: #fff; }

        .empty-state { text-align: center; padding: 40px 20px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; display: block; }
        .empty-state h4 { font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 8px 0; }
        .empty-state p { font-size: 14px; color: #6d7175; margin: 0 0 20px 0; }

        .settings-section { margin-bottom: 24px; }
        .settings-section h3 { font-size: 16px; font-weight: 600; color: #202223; margin: 0 0 16px 0; }
        .settings-card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; }

        .style-options { display: flex; flex-direction: column; gap: 8px; }
        .style-option { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border: 2px solid transparent; border-radius: 8px; cursor: pointer; }
        .style-option:hover { background: #f3f4f6; }
        .style-option.selected { border-color: #10b981; }
        .style-option input { display: none; }
        .style-label { font-weight: 500; color: #374151; }
        .style-desc { font-size: 12px; color: #9ca3af; margin-left: auto; }

        .color-row, .slider-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px; }
        .color-input-wrapper { display: flex; gap: 8px; }
        .color-input { width: 44px; height: 40px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; padding: 2px; }
        .color-text { flex: 1; min-width: 0; }
        .range-input { width: 100%; height: 6px; -webkit-appearance: none; background: #e5e7eb; border-radius: 3px; }
        .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #10b981; border-radius: 50%; cursor: pointer; }

        .toggle-style-options { display: flex; gap: 8px; }
        .toggle-style-option { padding: 10px 20px; background: #fff; border: 2px solid transparent; border-radius: 8px; cursor: pointer; font-size: 14px; color: #374151; }
        .toggle-style-option:hover { background: #f3f4f6; }
        .toggle-style-option.selected { border-color: #10b981; }
        .toggle-style-option input { display: none; }

        .checkbox-row { display: flex; gap: 24px; flex-wrap: wrap; }
        .checkbox-group { flex-direction: row !important; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #374151; }
        .checkbox-label input { width: 18px; height: 18px; }

        @media (max-width: 640px) {
          .addons-page { padding: 16px; }
          .field-row, .color-row, .slider-row { grid-template-columns: 1fr; flex-direction: column; }
          .templates-grid { grid-template-columns: repeat(2, 1fr); }
          .checkbox-row { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </div>
  );
}
