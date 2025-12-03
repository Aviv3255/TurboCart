'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// SVG Icon Components
const IconSvgs: Record<string, JSX.Element> = {
  truck: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  gift: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  tag: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  fire: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  percent: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  crown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>,
  diamond: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M2 9h20"/><path d="M12 22V9"/></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

interface RewardsSettings {
  enabled: boolean;
  position: string;
  progress_bar_height: number;
  progress_bar_color: string;
  progress_bar_gradient_end: string;
  progress_bar_background: string;
  progress_bar_border_radius: number;
  show_percentage: boolean;
  animate_progress: boolean;
  milestone_icon_size: number;
  milestone_icon_background: string;
  milestone_icon_active_background: string;
  milestone_icon_color: string;
  milestone_icon_active_color: string;
  show_milestone_labels: boolean;
  show_milestone_amounts: boolean;
  message_template: string;
  completed_message: string;
  empty_cart_message: string;
  background_color: string;
  border_color: string;
  border_radius: number;
  padding: number;
  celebration_animation: boolean;
}

interface RewardTier {
  id?: string;
  threshold: number;
  reward_type: string;
  reward_value: string;
  label: string;
  description?: string;
  icon: string;
  discount_code?: string;
  auto_apply: boolean;
  celebration_message?: string;
  is_active: boolean;
}

const REWARD_TYPES = [
  { value: 'free_shipping', label: 'Free Shipping', desc: 'Waive shipping costs' },
  { value: 'discount_percent', label: 'Percentage Discount', desc: 'e.g., 10% off' },
  { value: 'discount_fixed', label: 'Fixed Discount', desc: 'e.g., $5 off' },
  { value: 'gift', label: 'Free Gift', desc: 'Free product with order' },
  { value: 'bonus_points', label: 'Bonus Points', desc: 'Loyalty program points' },
];

const ICONS = [
  { value: 'truck', label: 'Truck' },
  { value: 'gift', label: 'Gift' },
  { value: 'tag', label: 'Tag' },
  { value: 'star', label: 'Star' },
  { value: 'shield', label: 'Shield' },
  { value: 'clock', label: 'Clock' },
  { value: 'fire', label: 'Fire' },
  { value: 'heart', label: 'Heart' },
  { value: 'check', label: 'Check' },
  { value: 'percent', label: 'Percent' },
  { value: 'crown', label: 'Crown' },
  { value: 'diamond', label: 'Diamond' },
];

const DEFAULT_TIERS: RewardTier[] = [
  {
    threshold: 50,
    reward_type: 'free_shipping',
    reward_value: '',
    label: 'Free Shipping',
    description: 'Free standard shipping on your order',
    icon: 'truck',
    discount_code: 'FREESHIP50',
    auto_apply: true,
    celebration_message: 'You unlocked free shipping!',
    is_active: true,
  },
];

const TIER_TEMPLATES = [
  { threshold: 50, reward_type: 'free_shipping', label: 'Free Shipping', icon: 'truck', desc: 'Waive shipping costs' },
  { threshold: 75, reward_type: 'discount_percent', reward_value: '10', label: '10% Off', icon: 'percent', desc: 'Percentage discount' },
  { threshold: 100, reward_type: 'gift', label: 'Free Gift', icon: 'gift', desc: 'Free product with order' },
  { threshold: 150, reward_type: 'discount_fixed', reward_value: '20', label: '$20 Off', icon: 'tag', desc: 'Fixed amount discount' },
];

export default function RewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'tiers' | 'settings'>('tiers');
  const [previewProgress, setPreviewProgress] = useState(60);

  const [settings, setSettings] = useState<RewardsSettings>({
    enabled: false,
    position: 'top',
    progress_bar_height: 8,
    progress_bar_color: '#10b981',
    progress_bar_gradient_end: '#059669',
    progress_bar_background: '#e5e7eb',
    progress_bar_border_radius: 4,
    show_percentage: false,
    animate_progress: true,
    milestone_icon_size: 32,
    milestone_icon_background: '#e5e7eb',
    milestone_icon_active_background: '#10b981',
    milestone_icon_color: '#6b7280',
    milestone_icon_active_color: '#ffffff',
    show_milestone_labels: true,
    show_milestone_amounts: true,
    message_template: 'Add {amount} more to unlock {reward}!',
    completed_message: 'Congratulations! You have unlocked all rewards!',
    empty_cart_message: 'Add items to start earning rewards!',
    background_color: '#f9fafb',
    border_color: '#e5e7eb',
    border_radius: 12,
    padding: 16,
    celebration_animation: true,
  });

  const [tiers, setTiers] = useState<RewardTier[]>(DEFAULT_TIERS);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await authenticatedFetch('/api/admin/rewards-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.tiers && data.tiers.length > 0) setTiers(data.tiers);
      }
    } catch (error) {
      console.error('Failed to fetch rewards settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await authenticatedFetch('/api/admin/rewards-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, tiers }),
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

  function addTier() {
    const lastThreshold = tiers.length > 0 ? (tiers[tiers.length - 1]?.threshold || 0) + 25 : 50;
    setTiers([...tiers, {
      threshold: lastThreshold,
      reward_type: 'free_shipping',
      reward_value: '',
      label: 'Free Shipping',
      description: '',
      icon: 'truck',
      discount_code: '',
      auto_apply: false,
      celebration_message: '',
      is_active: true,
    }]);
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function updateTier(index: number, field: keyof RewardTier, value: string | number | boolean) {
    const newTiers = [...tiers];
    const tier = newTiers[index];
    if (tier) {
      newTiers[index] = { ...tier, [field]: value };
    }
    setTiers(newTiers);
  }

  function moveTier(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tiers.length) return;
    const newTiers = [...tiers];
    [newTiers[index], newTiers[newIndex]] = [newTiers[newIndex]!, newTiers[index]!];
    setTiers(newTiers);
  }

  const getIcon = (iconValue: string) => IconSvgs[iconValue] || IconSvgs.star;

  const getPreviewMessage = () => {
    if (tiers.length === 0) return settings.empty_cart_message;
    const cartTotal = (previewProgress / 100) * (tiers[tiers.length - 1]?.threshold || 100);
    const nextTier = tiers.find(t => t.threshold > cartTotal);
    if (!nextTier) return settings.completed_message;
    const amountNeeded = (nextTier.threshold - cartTotal).toFixed(2);
    return settings.message_template.replace('{amount}', `$${amountNeeded}`).replace('{reward}', nextTier.label);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading rewards settings...</p>
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
    <div className="rewards-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={() => router.push('/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="header-content">
            <h1>Rewards Progress</h1>
            <p>Incentivize higher cart values with milestone rewards</p>
          </div>
        </div>
        <div className="header-actions">
          <label className="master-toggle">
            <span>Enable Rewards</span>
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
        <div className="preview-card" style={{
          background: settings.background_color,
          border: `1px solid ${settings.border_color}`,
          borderRadius: `${settings.border_radius}px`,
          padding: `${settings.padding}px`,
        }}>
          <div className="preview-message">{getPreviewMessage()}</div>
          <div className="progress-container">
            <div className="progress-track" style={{
              height: `${settings.progress_bar_height}px`,
              background: settings.progress_bar_background,
              borderRadius: `${settings.progress_bar_border_radius}px`,
            }}>
              <div className={`progress-fill ${settings.animate_progress ? 'animated' : ''}`} style={{
                width: `${previewProgress}%`,
                background: `linear-gradient(90deg, ${settings.progress_bar_color}, ${settings.progress_bar_gradient_end})`,
                borderRadius: `${settings.progress_bar_border_radius}px`,
              }}></div>
            </div>
            <div className="milestones">
              {tiers.filter(t => t.is_active).map((tier, i) => {
                const position = tiers.length > 0 ? (tier.threshold / (tiers[tiers.length - 1]?.threshold || 100)) * 100 : 0;
                const achieved = previewProgress >= position;
                return (
                  <div key={i} className={`milestone ${achieved ? 'achieved' : ''}`} style={{ left: `${Math.min(position, 100)}%` }}>
                    <div className="milestone-icon" style={{
                      width: `${settings.milestone_icon_size}px`,
                      height: `${settings.milestone_icon_size}px`,
                      background: achieved ? settings.milestone_icon_active_background : settings.milestone_icon_background,
                      color: achieved ? settings.milestone_icon_active_color : settings.milestone_icon_color,
                    }}>
                      {getIcon(tier.icon)}
                    </div>
                    {settings.show_milestone_labels && <span className="milestone-label">{tier.label}</span>}
                    {settings.show_milestone_amounts && <span className="milestone-amount">${tier.threshold}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="preview-controls">
            <label>Preview Progress:</label>
            <input type="range" min="0" max="100" value={previewProgress} onChange={(e) => setPreviewProgress(parseInt(e.target.value))} />
            <span>{previewProgress}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button className={`tab ${activeTab === 'tiers' ? 'active' : ''}`} onClick={() => setActiveTab('tiers')}>
          {IconSvgs.target} Reward Tiers
        </button>
        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          {IconSvgs.settings} Display Settings
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'tiers' && (
          <div className="tiers-tab">
            {/* Quick Templates */}
            <div className="templates-section">
              <h3>Quick Add Templates</h3>
              <div className="template-grid">
                {TIER_TEMPLATES.map((template, i) => (
                  <button
                    key={i}
                    className="template-card"
                    onClick={() => {
                      const lastThreshold = tiers.length > 0 ? Math.max(...tiers.map(t => t.threshold)) : 0;
                      setTiers([...tiers, {
                        threshold: Math.max(template.threshold, lastThreshold + 25),
                        reward_type: template.reward_type,
                        reward_value: template.reward_value || '',
                        label: template.label,
                        description: template.desc,
                        icon: template.icon,
                        discount_code: '',
                        auto_apply: false,
                        celebration_message: `You unlocked ${template.label}!`,
                        is_active: true,
                      }]);
                    }}
                  >
                    <span className="template-icon">{IconSvgs[template.icon]}</span>
                    <span className="template-label">{template.label}</span>
                    <span className="template-desc">{template.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {tiers.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">{IconSvgs.target}</span>
                <h4>No reward tiers yet</h4>
                <p>Create your first reward tier to motivate customers to spend more.</p>
                <button onClick={addTier} className="add-button primary">+ Add First Tier</button>
              </div>
            ) : (
              <>
                {tiers.map((tier, index) => (
                  <div key={index} className={`tier-card ${!tier.is_active ? 'inactive' : ''}`}>
                    <div className="tier-header">
                      <div className="tier-drag">
                        <button onClick={() => moveTier(index, 'up')} disabled={index === 0}>↑</button>
                        <button onClick={() => moveTier(index, 'down')} disabled={index === tiers.length - 1}>↓</button>
                      </div>
                      <div className="tier-preview" style={{ background: tier.is_active ? settings.milestone_icon_active_background : settings.milestone_icon_background }}>
                        <span>{getIcon(tier.icon)}</span>
                      </div>
                      <div className="tier-info">
                        <strong>Tier {index + 1}: {tier.label}</strong>
                        <span>${tier.threshold} threshold</span>
                      </div>
                      <div className="tier-actions">
                        <label className="active-toggle">
                          <input type="checkbox" checked={tier.is_active} onChange={(e) => updateTier(index, 'is_active', e.target.checked)} />
                          <span>{tier.is_active ? 'Active' : 'Inactive'}</span>
                        </label>
                        <button onClick={() => removeTier(index)} className="remove-btn">Remove</button>
                      </div>
                    </div>

                    <div className="tier-fields">
                      <div className="field-row">
                        <div className="field-group">
                          <label>Threshold Amount ($)</label>
                          <input type="number" min="0" step="1" value={tier.threshold} onChange={(e) => updateTier(index, 'threshold', parseFloat(e.target.value) || 0)} className="field-input" />
                          <span className="field-hint">Cart total to unlock this reward</span>
                        </div>
                        <div className="field-group">
                          <label>Display Label</label>
                          <input type="text" value={tier.label} onChange={(e) => updateTier(index, 'label', e.target.value)} placeholder="e.g., Free Shipping" className="field-input" />
                        </div>
                      </div>

                      <div className="field-row">
                        <div className="field-group">
                          <label>Reward Type</label>
                          <select value={tier.reward_type} onChange={(e) => updateTier(index, 'reward_type', e.target.value)} className="field-select">
                            {REWARD_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        {(tier.reward_type === 'discount_percent' || tier.reward_type === 'discount_fixed') && (
                          <div className="field-group">
                            <label>Discount Value</label>
                            <input type="text" value={tier.reward_value} onChange={(e) => updateTier(index, 'reward_value', e.target.value)} placeholder={tier.reward_type === 'discount_percent' ? 'e.g., 10' : 'e.g., 5.00'} className="field-input" />
                          </div>
                        )}
                      </div>

                      <div className="field-group">
                        <label>Icon</label>
                        <div className="icon-picker">
                          {ICONS.map((icon) => (
                            <button key={icon.value} type="button" className={`icon-option ${tier.icon === icon.value ? 'selected' : ''}`} onClick={() => updateTier(index, 'icon', icon.value)} title={icon.label}>
                              {IconSvgs[icon.value]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="field-group">
                        <label>Description (Optional)</label>
                        <input type="text" value={tier.description || ''} onChange={(e) => updateTier(index, 'description', e.target.value)} placeholder="Brief description shown to customers" className="field-input" />
                      </div>

                      <div className="field-row">
                        <div className="field-group">
                          <label>Discount Code (Optional)</label>
                          <input type="text" value={tier.discount_code || ''} onChange={(e) => updateTier(index, 'discount_code', e.target.value)} placeholder="FREESHIP" className="field-input" />
                        </div>
                        <div className="field-group checkbox-group">
                          <label className="checkbox-label">
                            <input type="checkbox" checked={tier.auto_apply} onChange={(e) => updateTier(index, 'auto_apply', e.target.checked)} />
                            <span>Auto-apply discount</span>
                          </label>
                        </div>
                      </div>

                      <div className="field-group">
                        <label>Celebration Message (Optional)</label>
                        <input type="text" value={tier.celebration_message || ''} onChange={(e) => updateTier(index, 'celebration_message', e.target.value)} placeholder="You unlocked free shipping!" className="field-input" />
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={addTier} className="add-button">+ Add Another Tier</button>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            {/* Messages */}
            <div className="settings-section">
              <h3>Messages</h3>
              <div className="settings-card">
                <div className="field-group">
                  <label>Progress Message</label>
                  <input type="text" value={settings.message_template} onChange={(e) => setSettings({ ...settings, message_template: e.target.value })} className="field-input" />
                  <span className="field-hint">Use {'{amount}'} and {'{reward}'} as placeholders</span>
                </div>
                <div className="field-group">
                  <label>Completed Message</label>
                  <input type="text" value={settings.completed_message} onChange={(e) => setSettings({ ...settings, completed_message: e.target.value })} className="field-input" />
                </div>
                <div className="field-group">
                  <label>Empty Cart Message</label>
                  <input type="text" value={settings.empty_cart_message} onChange={(e) => setSettings({ ...settings, empty_cart_message: e.target.value })} className="field-input" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="settings-section">
              <h3>Progress Bar</h3>
              <div className="settings-card">
                <div className="color-row">
                  <div className="field-group">
                    <label>Bar Color</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.progress_bar_color} onChange={(e) => setSettings({ ...settings, progress_bar_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.progress_bar_color} onChange={(e) => setSettings({ ...settings, progress_bar_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Gradient End</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.progress_bar_gradient_end} onChange={(e) => setSettings({ ...settings, progress_bar_gradient_end: e.target.value })} className="color-input" />
                      <input type="text" value={settings.progress_bar_gradient_end} onChange={(e) => setSettings({ ...settings, progress_bar_gradient_end: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Background</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.progress_bar_background} onChange={(e) => setSettings({ ...settings, progress_bar_background: e.target.value })} className="color-input" />
                      <input type="text" value={settings.progress_bar_background} onChange={(e) => setSettings({ ...settings, progress_bar_background: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="field-group">
                    <label>Height: {settings.progress_bar_height}px</label>
                    <input type="range" min="4" max="16" value={settings.progress_bar_height} onChange={(e) => setSettings({ ...settings, progress_bar_height: parseInt(e.target.value) })} className="range-input" />
                  </div>
                  <div className="field-group">
                    <label>Border Radius: {settings.progress_bar_border_radius}px</label>
                    <input type="range" min="0" max="8" value={settings.progress_bar_border_radius} onChange={(e) => setSettings({ ...settings, progress_bar_border_radius: parseInt(e.target.value) })} className="range-input" />
                  </div>
                </div>

                <div className="checkbox-row">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={settings.animate_progress} onChange={(e) => setSettings({ ...settings, animate_progress: e.target.checked })} />
                    <span>Animate progress bar</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={settings.show_percentage} onChange={(e) => setSettings({ ...settings, show_percentage: e.target.checked })} />
                    <span>Show percentage</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="settings-section">
              <h3>Milestone Icons</h3>
              <div className="settings-card">
                <div className="field-group">
                  <label>Icon Size: {settings.milestone_icon_size}px</label>
                  <input type="range" min="24" max="48" value={settings.milestone_icon_size} onChange={(e) => setSettings({ ...settings, milestone_icon_size: parseInt(e.target.value) })} className="range-input" />
                </div>

                <div className="color-row">
                  <div className="field-group">
                    <label>Inactive Background</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.milestone_icon_background} onChange={(e) => setSettings({ ...settings, milestone_icon_background: e.target.value })} className="color-input" />
                      <input type="text" value={settings.milestone_icon_background} onChange={(e) => setSettings({ ...settings, milestone_icon_background: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Active Background</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.milestone_icon_active_background} onChange={(e) => setSettings({ ...settings, milestone_icon_active_background: e.target.value })} className="color-input" />
                      <input type="text" value={settings.milestone_icon_active_background} onChange={(e) => setSettings({ ...settings, milestone_icon_active_background: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                </div>

                <div className="checkbox-row">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={settings.show_milestone_labels} onChange={(e) => setSettings({ ...settings, show_milestone_labels: e.target.checked })} />
                    <span>Show labels</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={settings.show_milestone_amounts} onChange={(e) => setSettings({ ...settings, show_milestone_amounts: e.target.checked })} />
                    <span>Show amounts</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={settings.celebration_animation} onChange={(e) => setSettings({ ...settings, celebration_animation: e.target.checked })} />
                    <span>Celebration animation</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Container */}
            <div className="settings-section">
              <h3>Container</h3>
              <div className="settings-card">
                <div className="color-row">
                  <div className="field-group">
                    <label>Background</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.background_color} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.background_color} onChange={(e) => setSettings({ ...settings, background_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label>Border</label>
                    <div className="color-input-wrapper">
                      <input type="color" value={settings.border_color} onChange={(e) => setSettings({ ...settings, border_color: e.target.value })} className="color-input" />
                      <input type="text" value={settings.border_color} onChange={(e) => setSettings({ ...settings, border_color: e.target.value })} className="field-input color-text" />
                    </div>
                  </div>
                </div>

                <div className="slider-row">
                  <div className="field-group">
                    <label>Border Radius: {settings.border_radius}px</label>
                    <input type="range" min="0" max="24" value={settings.border_radius} onChange={(e) => setSettings({ ...settings, border_radius: parseInt(e.target.value) })} className="range-input" />
                  </div>
                  <div className="field-group">
                    <label>Padding: {settings.padding}px</label>
                    <input type="range" min="8" max="32" value={settings.padding} onChange={(e) => setSettings({ ...settings, padding: parseInt(e.target.value) })} className="range-input" />
                  </div>
                </div>

                <div className="field-group">
                  <label>Position</label>
                  <select value={settings.position} onChange={(e) => setSettings({ ...settings, position: e.target.value })} className="field-select">
                    <option value="top">Top of Cart</option>
                    <option value="bottom">Bottom of Cart</option>
                    <option value="floating">Floating</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .rewards-page { max-width: 1000px; margin: 0 auto; padding: 24px; background: #f6f6f7; min-height: 100vh; }

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

        .preview-section { margin-bottom: 24px; }
        .preview-card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .preview-message { font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 12px; text-align: center; }
        .progress-container { position: relative; margin-bottom: 40px; }
        .progress-track { overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.5s ease; }
        .progress-fill.animated { animation: shimmer 2s infinite; }
        .milestones { position: absolute; top: -8px; left: 0; right: 0; }
        .milestone { position: absolute; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .milestone-icon { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s; }
        .milestone.achieved .milestone-icon { transform: scale(1.1); }
        .milestone-label { font-size: 11px; font-weight: 500; color: #6b7280; white-space: nowrap; }
        .milestone-amount { font-size: 10px; color: #9ca3af; }
        .milestone.achieved .milestone-label { color: #374151; font-weight: 600; }
        .preview-controls { display: flex; align-items: center; justify-content: center; gap: 12px; padding-top: 16px; border-top: 1px solid #e5e7eb; margin-top: 16px; }
        .preview-controls label { font-size: 12px; color: #6d7175; }
        .preview-controls input[type="range"] { width: 200px; }
        .preview-controls span { font-size: 12px; color: #374151; font-weight: 500; width: 40px; }

        .tabs-container { display: flex; gap: 4px; background: #fff; border-radius: 12px; padding: 4px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 16px; background: transparent; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; color: #6d7175; cursor: pointer; }
        .tab:hover { background: #f6f6f7; color: #202223; }
        .tab.active { background: #000; color: #fff; }

        .tab-content { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

        .tier-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .tier-card.inactive { opacity: 0.6; }
        .tier-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .tier-drag { display: flex; flex-direction: column; gap: 4px; }
        .tier-drag button { width: 24px; height: 20px; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer; font-size: 10px; }
        .tier-drag button:disabled { opacity: 0.3; cursor: not-allowed; }
        .tier-preview { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; }
        .tier-info { flex: 1; }
        .tier-info strong { display: block; font-size: 14px; color: #374151; }
        .tier-info span { font-size: 12px; color: #6d7175; }
        .tier-actions { display: flex; align-items: center; gap: 12px; }
        .active-toggle { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6d7175; cursor: pointer; }
        .active-toggle input { width: 16px; height: 16px; }
        .remove-btn { padding: 6px 12px; background: transparent; color: #dc2626; border: 1px solid #dc2626; border-radius: 6px; font-size: 12px; cursor: pointer; }

        .tier-fields { display: flex; flex-direction: column; gap: 16px; }
        .field-row { display: flex; gap: 16px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .field-group label { font-size: 13px; font-weight: 500; color: #374151; }
        .field-input, .field-select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .field-input:focus, .field-select:focus { outline: none; border-color: #000; }
        .field-hint { font-size: 12px; color: #9ca3af; }

        .icon-picker { display: flex; flex-wrap: wrap; gap: 8px; }
        .icon-option { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border: 2px solid transparent; border-radius: 8px; font-size: 18px; cursor: pointer; }
        .icon-option:hover { background: #e5e7eb; }
        .icon-option.selected { border-color: #000; background: #f3f4f6; }

        .add-button { width: 100%; padding: 14px; background: transparent; border: 2px dashed #d1d5db; border-radius: 8px; font-size: 14px; font-weight: 500; color: #6d7175; cursor: pointer; }
        .add-button:hover { border-color: #000; color: #000; }
        .add-button.primary { background: #000; border: none; color: #fff; }

        .templates-section { margin-bottom: 24px; }
        .templates-section h3 { font-size: 14px; font-weight: 600; color: #6d7175; margin: 0 0 12px 0; }
        .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
        .template-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .template-card:hover { background: #f3f4f6; border-color: #000; transform: translateY(-2px); }
        .template-icon { color: #374151; }
        .template-label { font-size: 13px; font-weight: 600; color: #374151; }
        .template-desc { font-size: 11px; color: #9ca3af; text-align: center; }

        .empty-state { text-align: center; padding: 40px 20px; }
        .empty-icon { display: flex; justify-content: center; margin-bottom: 16px; color: #9ca3af; }
        .empty-icon svg { width: 48px; height: 48px; }
        .empty-state h4 { font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 8px 0; }
        .empty-state p { font-size: 14px; color: #6d7175; margin: 0 0 20px 0; }

        .settings-section { margin-bottom: 24px; }
        .settings-section h3 { font-size: 16px; font-weight: 600; color: #202223; margin: 0 0 16px 0; }
        .settings-card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; }

        .color-row, .slider-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 16px; }
        .color-input-wrapper { display: flex; gap: 8px; }
        .color-input { width: 44px; height: 40px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; padding: 2px; }
        .color-text { flex: 1; min-width: 0; }
        .range-input { width: 100%; height: 6px; -webkit-appearance: none; background: #e5e7eb; border-radius: 3px; }
        .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #000; border-radius: 50%; cursor: pointer; }

        .checkbox-row { display: flex; gap: 24px; flex-wrap: wrap; }
        .checkbox-group { flex-direction: row !important; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #374151; }
        .checkbox-label input { width: 18px; height: 18px; }

        @keyframes shimmer { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }

        @media (max-width: 640px) {
          .rewards-page { padding: 16px; }
          .field-row, .color-row, .slider-row { grid-template-columns: 1fr; flex-direction: column; }
          .checkbox-row { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </div>
  );
}
