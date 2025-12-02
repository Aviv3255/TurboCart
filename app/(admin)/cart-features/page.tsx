'use client';

import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

interface RewardTier {
  id?: string;
  threshold: number;
  reward_type: string;
  reward_value: string;
  label: string;
  icon: string;
  is_active: boolean;
  [key: string]: string | number | boolean | undefined;
}

interface SwitchAddon {
  id?: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  default_enabled: boolean;
  is_active: boolean;
  [key: string]: string | number | boolean | undefined;
}

interface Settings {
  features: {
    upsells: boolean;
    rewards: boolean;
    addons: boolean;
    timer: boolean;
    announcement: boolean;
  };
  timer: {
    duration: number;
    message: string;
    style: string;
    position: string;
  };
  announcement: {
    text: string;
    icon: string;
    style: string;
    position: string;
    link_url: string;
    link_text: string;
  };
  display_style: string;
  position: string;
}

type TabType = 'features' | 'rewards' | 'addons' | 'timer' | 'announcement';

const ICON_OPTIONS = [
  { value: 'truck', label: 'Truck', emoji: '🚚' },
  { value: 'gift', label: 'Gift', emoji: '🎁' },
  { value: 'tag', label: 'Tag', emoji: '🏷️' },
  { value: 'star', label: 'Star', emoji: '⭐' },
  { value: 'shield', label: 'Shield', emoji: '🛡️' },
  { value: 'clock', label: 'Clock', emoji: '⏰' },
  { value: 'fire', label: 'Fire', emoji: '🔥' },
  { value: 'heart', label: 'Heart', emoji: '❤️' },
  { value: 'check', label: 'Check', emoji: '✅' },
  { value: 'percent', label: 'Percent', emoji: '💯' },
];

const REWARD_TYPES = [
  { value: 'free_shipping', label: 'Free Shipping', description: 'Waive shipping costs' },
  { value: 'discount_percent', label: 'Percentage Discount', description: 'e.g., 10% off' },
  { value: 'discount_fixed', label: 'Fixed Discount', description: 'e.g., $5 off' },
  { value: 'gift', label: 'Free Gift', description: 'Free product with order' },
  { value: 'bonus_points', label: 'Bonus Points', description: 'Loyalty program points' },
];

export default function CartFeaturesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('features');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    features: { upsells: true, rewards: false, addons: false, timer: false, announcement: false },
    timer: { duration: 10, message: 'Your cart will expire in {time}!', style: 'bar', position: 'top' },
    announcement: { text: '', icon: 'info', style: 'gradient', position: 'top', link_url: '', link_text: '' },
    display_style: 'carousel',
    position: 'top',
  });
  const [rewards, setRewards] = useState<RewardTier[]>([]);
  const [addons, setAddons] = useState<SwitchAddon[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await authenticatedFetch('/api/admin/cart-features');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({
            ...settings,
            ...data.settings,
            features: { ...settings.features, ...data.settings.features },
            timer: { ...settings.timer, ...data.settings.timer },
            announcement: { ...settings.announcement, ...data.settings.announcement },
          });
        }
        setRewards(data.rewards || []);
        setAddons(data.addons || []);
      }
    } catch (error) {
      console.error('Failed to fetch cart features:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await authenticatedFetch('/api/admin/cart-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, rewards, addons }),
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

  function addReward() {
    setRewards([...rewards, {
      threshold: rewards.length > 0 ? (rewards[rewards.length - 1]?.threshold || 0) + 25 : 50,
      reward_type: 'free_shipping',
      reward_value: '',
      label: 'Free Shipping',
      icon: 'truck',
      is_active: true,
    }]);
  }

  function removeReward(index: number) {
    setRewards(rewards.filter((_, i) => i !== index));
  }

  function updateReward(index: number, field: keyof RewardTier, value: string | number | boolean) {
    const newRewards = [...rewards];
    if (newRewards[index]) {
      newRewards[index][field] = value;
    }
    setRewards(newRewards);
  }

  function addAddon() {
    setAddons([...addons, {
      name: 'Shipping Protection',
      description: 'Protect your order against loss or damage',
      price: 4.99,
      icon: 'shield',
      default_enabled: false,
      is_active: true,
    }]);
  }

  function removeAddon(index: number) {
    setAddons(addons.filter((_, i) => i !== index));
  }

  function updateAddon(index: number, field: keyof SwitchAddon, value: string | number | boolean) {
    const newAddons = [...addons];
    if (newAddons[index]) {
      newAddons[index][field] = value;
    }
    setAddons(newAddons);
  }

  // Get icon emoji
  const getIconEmoji = (iconValue: string) => {
    return ICON_OPTIONS.find(i => i.value === iconValue)?.emoji || '📦';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading cart features...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: #f6f6f7;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e4e5e7;
            border-top-color: #5c6ac4;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            margin-top: 16px;
            color: #6d7175;
          }
        `}</style>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'features', label: 'Features', icon: '⚡' },
    { id: 'rewards', label: 'Rewards Progress', icon: '🎯' },
    { id: 'addons', label: 'Quick Add-Ons', icon: '➕' },
    { id: 'timer', label: 'Urgency Timer', icon: '⏱️' },
    { id: 'announcement', label: 'Announcement', icon: '📢' },
  ];

  return (
    <div className="cart-features-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Cart Features</h1>
          <p>Boost conversions with powerful cart enhancements</p>
        </div>
        <button
          onClick={saveChanges}
          disabled={saving}
          className={`save-button ${saveSuccess ? 'success' : ''}`}
        >
          {saving ? (
            <>
              <span className="button-spinner"></span>
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <span>✓</span>
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.id !== 'features' && settings.features[tab.id as keyof typeof settings.features] && (
                <span className="tab-badge">ON</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="features-tab">
            <div className="section-header">
              <h2>Enable Features</h2>
              <p>Toggle cart features on or off. Each feature can be customized in its own tab.</p>
            </div>

            <div className="feature-cards">
              {[
                { key: 'upsells', label: 'Cart Upsells', desc: 'Recommend products in the cart to increase order value', icon: '🛒', link: '/products' },
                { key: 'rewards', label: 'Rewards Progress', desc: 'Show progress bar to free shipping, discounts, or gifts', icon: '🎯', link: null },
                { key: 'addons', label: 'Quick Add-Ons', desc: 'One-click extras like shipping protection or gift wrapping', icon: '➕', link: null },
                { key: 'timer', label: 'Urgency Timer', desc: 'Countdown timer to create purchase urgency', icon: '⏱️', link: null },
                { key: 'announcement', label: 'Announcement Bar', desc: 'Custom promotional message at the top of the cart', icon: '📢', link: null },
              ].map((feature) => (
                <div key={feature.key} className={`feature-card ${settings.features[feature.key as keyof typeof settings.features] ? 'enabled' : ''}`}>
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-info">
                    <h3>{feature.label}</h3>
                    <p>{feature.desc}</p>
                  </div>
                  <div className="feature-actions">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.features[feature.key as keyof typeof settings.features]}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            features: { ...settings.features, [feature.key]: e.target.checked },
                          })
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="rewards-tab">
            <div className="section-header">
              <h2>Rewards Progress Bar</h2>
              <p>Motivate customers to add more items by showing progress towards rewards.</p>
            </div>

            {!settings.features.rewards && (
              <div className="feature-disabled-banner">
                <span>⚠️</span>
                <p>Rewards Progress is currently disabled. Enable it in the Features tab to show on your store.</p>
                <button onClick={() => setSettings({ ...settings, features: { ...settings.features, rewards: true } })}>
                  Enable Now
                </button>
              </div>
            )}

            {/* Preview */}
            <div className="preview-section">
              <h3>Preview</h3>
              <div className="rewards-preview">
                <div className="progress-bar-preview">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '60%' }}></div>
                    {rewards.map((reward, i) => (
                      <div
                        key={i}
                        className="reward-milestone"
                        style={{ left: `${Math.min((reward.threshold / (rewards[rewards.length - 1]?.threshold || 100)) * 100, 100)}%` }}
                      >
                        <span className="milestone-icon">{getIconEmoji(reward.icon)}</span>
                        <span className="milestone-label">${reward.threshold}</span>
                      </div>
                    ))}
                  </div>
                  <p className="progress-message">
                    {rewards.length > 0
                      ? `Add $${Math.max(0, (rewards[0]?.threshold || 50) - 30).toFixed(2)} more to unlock ${rewards[0]?.label || 'Free Shipping'}!`
                      : 'Add reward tiers below to see preview'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reward Tiers */}
            <div className="reward-tiers">
              <h3>Reward Tiers</h3>
              {rewards.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎯</span>
                  <h4>No reward tiers yet</h4>
                  <p>Add your first reward tier to motivate customers to spend more.</p>
                  <button onClick={addReward} className="add-button primary">
                    + Add First Reward
                  </button>
                </div>
              ) : (
                <>
                  {rewards.map((reward, index) => (
                    <div key={index} className="reward-tier-card">
                      <div className="tier-header">
                        <div className="tier-number">
                          <span className="tier-icon">{getIconEmoji(reward.icon)}</span>
                          Tier {index + 1}
                        </div>
                        <div className="tier-actions">
                          <label className="active-toggle">
                            <input
                              type="checkbox"
                              checked={reward.is_active}
                              onChange={(e) => updateReward(index, 'is_active', e.target.checked)}
                            />
                            <span>{reward.is_active ? 'Active' : 'Inactive'}</span>
                          </label>
                          <button onClick={() => removeReward(index)} className="remove-btn">
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="tier-fields">
                        <div className="field-group">
                          <label>Threshold Amount ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={reward.threshold}
                            onChange={(e) => updateReward(index, 'threshold', parseFloat(e.target.value) || 0)}
                            className="field-input"
                          />
                          <span className="field-hint">Cart total to unlock this reward</span>
                        </div>

                        <div className="field-group">
                          <label>Reward Type</label>
                          <select
                            value={reward.reward_type}
                            onChange={(e) => updateReward(index, 'reward_type', e.target.value)}
                            className="field-select"
                          >
                            {REWARD_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {(reward.reward_type === 'discount_percent' || reward.reward_type === 'discount_fixed') && (
                          <div className="field-group">
                            <label>Discount Value</label>
                            <input
                              type="text"
                              value={reward.reward_value}
                              onChange={(e) => updateReward(index, 'reward_value', e.target.value)}
                              placeholder={reward.reward_type === 'discount_percent' ? 'e.g., 10' : 'e.g., 5.00'}
                              className="field-input"
                            />
                            <span className="field-hint">
                              {reward.reward_type === 'discount_percent' ? 'Percentage off (without %)' : 'Dollar amount'}
                            </span>
                          </div>
                        )}

                        <div className="field-group">
                          <label>Display Label</label>
                          <input
                            type="text"
                            value={reward.label}
                            onChange={(e) => updateReward(index, 'label', e.target.value)}
                            placeholder="e.g., Free Shipping"
                            className="field-input"
                          />
                          <span className="field-hint">Shown to customers in progress bar</span>
                        </div>

                        <div className="field-group">
                          <label>Icon</label>
                          <div className="icon-picker">
                            {ICON_OPTIONS.map((icon) => (
                              <button
                                key={icon.value}
                                type="button"
                                className={`icon-option ${reward.icon === icon.value ? 'selected' : ''}`}
                                onClick={() => updateReward(index, 'icon', icon.value)}
                                title={icon.label}
                              >
                                {icon.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={addReward} className="add-button">
                    + Add Another Reward Tier
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Add-Ons Tab */}
        {activeTab === 'addons' && (
          <div className="addons-tab">
            <div className="section-header">
              <h2>Quick Add-Ons</h2>
              <p>One-click toggle products that customers can add to their cart instantly.</p>
            </div>

            {!settings.features.addons && (
              <div className="feature-disabled-banner">
                <span>⚠️</span>
                <p>Quick Add-Ons are currently disabled. Enable them in the Features tab.</p>
                <button onClick={() => setSettings({ ...settings, features: { ...settings.features, addons: true } })}>
                  Enable Now
                </button>
              </div>
            )}

            {/* Preview */}
            <div className="preview-section">
              <h3>Preview</h3>
              <div className="addons-preview">
                {addons.length > 0 ? addons.slice(0, 3).map((addon, i) => (
                  <div key={i} className="addon-preview-item">
                    <div className="addon-preview-toggle">
                      <span className={`toggle-dot ${addon.default_enabled ? 'on' : ''}`}></span>
                    </div>
                    <span className="addon-preview-icon">{getIconEmoji(addon.icon)}</span>
                    <div className="addon-preview-info">
                      <strong>{addon.name}</strong>
                      <span>${addon.price.toFixed(2)}</span>
                    </div>
                  </div>
                )) : (
                  <p className="preview-empty">Add an add-on below to see preview</p>
                )}
              </div>
            </div>

            {/* Add-On Items */}
            <div className="addon-items">
              <h3>Add-On Products</h3>
              {addons.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">➕</span>
                  <h4>No add-ons yet</h4>
                  <p>Create your first add-on product like shipping protection or gift wrapping.</p>
                  <button onClick={addAddon} className="add-button primary">
                    + Add First Add-On
                  </button>
                </div>
              ) : (
                <>
                  {addons.map((addon, index) => (
                    <div key={index} className="addon-card">
                      <div className="addon-header">
                        <div className="addon-title">
                          <span className="addon-icon">{getIconEmoji(addon.icon)}</span>
                          {addon.name || 'New Add-On'}
                        </div>
                        <div className="addon-actions">
                          <label className="active-toggle">
                            <input
                              type="checkbox"
                              checked={addon.is_active}
                              onChange={(e) => updateAddon(index, 'is_active', e.target.checked)}
                            />
                            <span>{addon.is_active ? 'Active' : 'Inactive'}</span>
                          </label>
                          <button onClick={() => removeAddon(index)} className="remove-btn">
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="addon-fields">
                        <div className="field-row">
                          <div className="field-group">
                            <label>Name</label>
                            <input
                              type="text"
                              value={addon.name}
                              onChange={(e) => updateAddon(index, 'name', e.target.value)}
                              placeholder="e.g., Shipping Protection"
                              className="field-input"
                            />
                          </div>
                          <div className="field-group small">
                            <label>Price ($)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={addon.price}
                              onChange={(e) => updateAddon(index, 'price', parseFloat(e.target.value) || 0)}
                              className="field-input"
                            />
                          </div>
                        </div>

                        <div className="field-group">
                          <label>Description</label>
                          <input
                            type="text"
                            value={addon.description}
                            onChange={(e) => updateAddon(index, 'description', e.target.value)}
                            placeholder="e.g., Protect your order against loss or damage"
                            className="field-input"
                          />
                        </div>

                        <div className="field-row">
                          <div className="field-group">
                            <label>Icon</label>
                            <div className="icon-picker">
                              {ICON_OPTIONS.map((icon) => (
                                <button
                                  key={icon.value}
                                  type="button"
                                  className={`icon-option ${addon.icon === icon.value ? 'selected' : ''}`}
                                  onClick={() => updateAddon(index, 'icon', icon.value)}
                                  title={icon.label}
                                >
                                  {icon.emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="field-group checkbox-group">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={addon.default_enabled}
                                onChange={(e) => updateAddon(index, 'default_enabled', e.target.checked)}
                              />
                              <span>Pre-selected by default</span>
                            </label>
                            <span className="field-hint">Customer can still toggle off</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button onClick={addAddon} className="add-button">
                    + Add Another Add-On
                  </button>
                </>
              )}
            </div>

            {/* Suggestions */}
            <div className="suggestions-section">
              <h3>Popular Add-On Ideas</h3>
              <div className="suggestion-cards">
                {[
                  { name: 'Shipping Protection', desc: 'Protect against lost/damaged packages', price: 4.99, icon: 'shield' },
                  { name: 'Gift Wrapping', desc: 'Beautiful gift wrap with a ribbon', price: 5.99, icon: 'gift' },
                  { name: 'Priority Processing', desc: 'Ship your order within 24 hours', price: 3.99, icon: 'clock' },
                  { name: 'Handwritten Note', desc: 'Personal message included', price: 2.99, icon: 'heart' },
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    className="suggestion-card"
                    onClick={() => setAddons([...addons, {
                      name: suggestion.name,
                      description: suggestion.desc,
                      price: suggestion.price,
                      icon: suggestion.icon,
                      default_enabled: false,
                      is_active: true,
                    }])}
                  >
                    <span className="suggestion-icon">{getIconEmoji(suggestion.icon)}</span>
                    <span className="suggestion-name">{suggestion.name}</span>
                    <span className="suggestion-price">${suggestion.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timer Tab */}
        {activeTab === 'timer' && (
          <div className="timer-tab">
            <div className="section-header">
              <h2>Urgency Timer</h2>
              <p>Create purchase urgency with a countdown timer showing when the cart will expire.</p>
            </div>

            {!settings.features.timer && (
              <div className="feature-disabled-banner">
                <span>⚠️</span>
                <p>Urgency Timer is currently disabled. Enable it in the Features tab.</p>
                <button onClick={() => setSettings({ ...settings, features: { ...settings.features, timer: true } })}>
                  Enable Now
                </button>
              </div>
            )}

            {/* Preview */}
            <div className="preview-section">
              <h3>Preview</h3>
              <div className={`timer-preview ${settings.timer.style}`}>
                <div className="timer-content">
                  <span className="timer-icon">⏱️</span>
                  <span className="timer-message">
                    {settings.timer.message.replace('{time}', `${settings.timer.duration - 1}:59`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Timer Settings */}
            <div className="timer-settings">
              <div className="settings-card">
                <div className="field-group">
                  <label>Countdown Duration</label>
                  <div className="duration-input">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.timer.duration}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          timer: { ...settings.timer, duration: parseInt(e.target.value) || 10 },
                        })
                      }
                      className="field-input"
                    />
                    <span className="duration-label">minutes</span>
                  </div>
                  <span className="field-hint">Timer resets when customer adds/removes items</span>
                </div>

                <div className="field-group">
                  <label>Timer Message</label>
                  <input
                    type="text"
                    value={settings.timer.message}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        timer: { ...settings.timer, message: e.target.value },
                      })
                    }
                    placeholder="Your cart will expire in {time}!"
                    className="field-input"
                  />
                  <span className="field-hint">Use {'{time}'} to show the countdown</span>
                </div>

                <div className="field-group">
                  <label>Timer Style</label>
                  <div className="style-options">
                    {[
                      { value: 'bar', label: 'Full Bar', desc: 'Spans full width' },
                      { value: 'floating', label: 'Floating Badge', desc: 'Compact badge' },
                      { value: 'inline', label: 'Inline Text', desc: 'Simple text' },
                    ].map((style) => (
                      <label key={style.value} className={`style-option ${settings.timer.style === style.value ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="timerStyle"
                          value={style.value}
                          checked={settings.timer.style === style.value}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              timer: { ...settings.timer, style: e.target.value },
                            })
                          }
                        />
                        <span className="style-label">{style.label}</span>
                        <span className="style-desc">{style.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label>Position</label>
                  <div className="position-options">
                    <label className={`position-option ${settings.timer.position === 'top' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="timerPosition"
                        value="top"
                        checked={settings.timer.position === 'top'}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            timer: { ...settings.timer, position: e.target.value },
                          })
                        }
                      />
                      <span>Top of Cart</span>
                    </label>
                    <label className={`position-option ${settings.timer.position === 'bottom' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="timerPosition"
                        value="bottom"
                        checked={settings.timer.position === 'bottom'}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            timer: { ...settings.timer, position: e.target.value },
                          })
                        }
                      />
                      <span>Above Checkout Button</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Templates */}
            <div className="templates-section">
              <h3>Quick Message Templates</h3>
              <div className="template-buttons">
                {[
                  { msg: 'Your cart will expire in {time}!', label: 'Standard' },
                  { msg: '⚡ Items reserved for {time} only!', label: 'Urgency' },
                  { msg: '🔥 Complete order in {time} to lock in prices', label: 'Scarcity' },
                  { msg: 'Cart expires in {time} - checkout now!', label: 'Direct' },
                ].map((template, i) => (
                  <button
                    key={i}
                    className="template-button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        timer: { ...settings.timer, message: template.msg },
                      })
                    }
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Announcement Tab */}
        {activeTab === 'announcement' && (
          <div className="announcement-tab">
            <div className="section-header">
              <h2>Announcement Bar</h2>
              <p>Display a promotional message at the top of the cart drawer.</p>
            </div>

            {!settings.features.announcement && (
              <div className="feature-disabled-banner">
                <span>⚠️</span>
                <p>Announcement Bar is currently disabled. Enable it in the Features tab.</p>
                <button onClick={() => setSettings({ ...settings, features: { ...settings.features, announcement: true } })}>
                  Enable Now
                </button>
              </div>
            )}

            {/* Preview */}
            <div className="preview-section">
              <h3>Preview</h3>
              <div className={`announcement-preview ${settings.announcement.style}`}>
                {settings.announcement.text ? (
                  <>
                    <span className="announcement-icon">{getIconEmoji(settings.announcement.icon)}</span>
                    <span className="announcement-text">{settings.announcement.text}</span>
                    {settings.announcement.link_text && (
                      <span className="announcement-link">{settings.announcement.link_text} →</span>
                    )}
                  </>
                ) : (
                  <span className="preview-placeholder">Enter your announcement message below</span>
                )}
              </div>
            </div>

            {/* Announcement Settings */}
            <div className="announcement-settings">
              <div className="settings-card">
                <div className="field-group">
                  <label>Announcement Message</label>
                  <input
                    type="text"
                    value={settings.announcement.text}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        announcement: { ...settings.announcement, text: e.target.value },
                      })
                    }
                    placeholder="e.g., Free shipping on orders over $50!"
                    className="field-input"
                  />
                </div>

                <div className="field-group">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        className={`icon-option ${settings.announcement.icon === icon.value ? 'selected' : ''}`}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            announcement: { ...settings.announcement, icon: icon.value },
                          })
                        }
                        title={icon.label}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-group">
                  <label>Style</label>
                  <div className="style-options announcement-styles">
                    {[
                      { value: 'gradient', label: 'Gradient', color: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' },
                      { value: 'solid', label: 'Solid', color: '#000' },
                      { value: 'success', label: 'Success', color: '#10b981' },
                      { value: 'warning', label: 'Warning', color: '#f59e0b' },
                      { value: 'info', label: 'Info', color: '#3b82f6' },
                    ].map((style) => (
                      <label key={style.value} className={`style-chip ${settings.announcement.style === style.value ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="announcementStyle"
                          value={style.value}
                          checked={settings.announcement.style === style.value}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              announcement: { ...settings.announcement, style: e.target.value },
                            })
                          }
                        />
                        <span className="style-preview-dot" style={{ background: style.color }}></span>
                        <span>{style.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-group">
                    <label>Link URL (optional)</label>
                    <input
                      type="url"
                      value={settings.announcement.link_url}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          announcement: { ...settings.announcement, link_url: e.target.value },
                        })
                      }
                      placeholder="https://yourstore.com/sale"
                      className="field-input"
                    />
                  </div>
                  <div className="field-group">
                    <label>Link Text</label>
                    <input
                      type="text"
                      value={settings.announcement.link_text}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          announcement: { ...settings.announcement, link_text: e.target.value },
                        })
                      }
                      placeholder="Shop Now"
                      className="field-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="templates-section">
              <h3>Quick Templates</h3>
              <div className="announcement-templates">
                {[
                  { text: 'Free shipping on orders over $50!', icon: 'truck', style: 'success' },
                  { text: '🔥 Flash Sale - 20% off everything!', icon: 'fire', style: 'gradient' },
                  { text: 'Complete your order for a free gift!', icon: 'gift', style: 'info' },
                  { text: '⏰ Limited time offer - ends today!', icon: 'clock', style: 'warning' },
                ].map((template, i) => (
                  <button
                    key={i}
                    className="announcement-template"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        announcement: {
                          ...settings.announcement,
                          text: template.text,
                          icon: template.icon,
                          style: template.style,
                        },
                      })
                    }
                  >
                    <span className="template-icon">{getIconEmoji(template.icon)}</span>
                    <span className="template-text">{template.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .cart-features-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
          background: #f6f6f7;
          min-height: 100vh;
        }

        /* Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .header-content h1 {
          font-size: 24px;
          font-weight: 700;
          color: #202223;
          margin: 0 0 4px 0;
        }
        .header-content p {
          font-size: 14px;
          color: #6d7175;
          margin: 0;
        }
        .save-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .save-button:hover {
          background: #333;
        }
        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .save-button.success {
          background: #10b981;
        }
        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Tabs */
        .tabs-container {
          background: #fff;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .tabs {
          display: flex;
          gap: 4px;
          overflow-x: auto;
        }
        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #6d7175;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .tab:hover {
          background: #f6f6f7;
          color: #202223;
        }
        .tab.active {
          background: #000;
          color: #fff;
        }
        .tab-icon {
          font-size: 16px;
        }
        .tab-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: #10b981;
          color: #fff;
          border-radius: 10px;
          font-weight: 600;
        }
        .tab.active .tab-badge {
          background: #fff;
          color: #000;
        }

        /* Tab Content */
        .tab-content {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .section-header {
          margin-bottom: 24px;
        }
        .section-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #202223;
          margin: 0 0 4px 0;
        }
        .section-header p {
          font-size: 14px;
          color: #6d7175;
          margin: 0;
        }

        /* Feature Disabled Banner */
        .feature-disabled-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fef3c7;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .feature-disabled-banner span {
          font-size: 20px;
        }
        .feature-disabled-banner p {
          flex: 1;
          margin: 0;
          font-size: 14px;
          color: #92400e;
        }
        .feature-disabled-banner button {
          padding: 8px 16px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        /* Features Tab */
        .feature-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .feature-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .feature-card.enabled {
          background: #f0fdf4;
          border-color: #10b981;
        }
        .feature-icon {
          font-size: 28px;
        }
        .feature-info {
          flex: 1;
        }
        .feature-info h3 {
          font-size: 15px;
          font-weight: 600;
          color: #202223;
          margin: 0 0 2px 0;
        }
        .feature-info p {
          font-size: 13px;
          color: #6d7175;
          margin: 0;
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          width: 48px;
          height: 28px;
          cursor: pointer;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          inset: 0;
          background: #d1d5db;
          border-radius: 14px;
          transition: 0.2s;
        }
        .toggle-slider::before {
          content: '';
          position: absolute;
          width: 22px;
          height: 22px;
          left: 3px;
          top: 3px;
          background: #fff;
          border-radius: 50%;
          transition: 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .toggle-switch input:checked + .toggle-slider {
          background: #10b981;
        }
        .toggle-switch input:checked + .toggle-slider::before {
          transform: translateX(20px);
        }

        /* Preview Section */
        .preview-section {
          margin-bottom: 24px;
        }
        .preview-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #6d7175;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Rewards Preview */
        .rewards-preview {
          background: #f9fafb;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }
        .progress-bar-preview {
          max-width: 400px;
          margin: 0 auto;
        }
        .progress-track {
          position: relative;
          height: 12px;
          background: #e5e7eb;
          border-radius: 6px;
          overflow: visible;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
          border-radius: 6px;
          transition: width 0.3s;
        }
        .reward-milestone {
          position: absolute;
          top: -8px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .milestone-icon {
          font-size: 20px;
          background: #fff;
          border-radius: 50%;
          padding: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .milestone-label {
          font-size: 11px;
          font-weight: 600;
          color: #6d7175;
        }
        .progress-message {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }

        /* Reward Tiers */
        .reward-tiers h3 {
          font-size: 16px;
          font-weight: 600;
          color: #202223;
          margin: 0 0 16px 0;
        }
        .reward-tier-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .tier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .tier-number {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #374151;
        }
        .tier-icon {
          font-size: 20px;
        }
        .tier-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .active-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6d7175;
          cursor: pointer;
        }
        .active-toggle input {
          width: 16px;
          height: 16px;
        }
        .remove-btn {
          padding: 6px 12px;
          background: transparent;
          color: #dc2626;
          border: 1px solid #dc2626;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        .remove-btn:hover {
          background: #fef2f2;
        }

        .tier-fields {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        /* Field Groups */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-group.small {
          max-width: 120px;
        }
        .field-group label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        .field-input, .field-select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .field-input:focus, .field-select:focus {
          outline: none;
          border-color: #000;
        }
        .field-hint {
          font-size: 12px;
          color: #9ca3af;
        }
        .field-row {
          display: flex;
          gap: 16px;
        }
        .field-row .field-group {
          flex: 1;
        }

        /* Icon Picker */
        .icon-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .icon-option {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .icon-option:hover {
          background: #e5e7eb;
        }
        .icon-option.selected {
          border-color: #000;
          background: #fff;
        }

        /* Add Button */
        .add-button {
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #6d7175;
          cursor: pointer;
          transition: all 0.2s;
        }
        .add-button:hover {
          border-color: #9ca3af;
          color: #374151;
        }
        .add-button.primary {
          background: #000;
          border: none;
          color: #fff;
        }
        .add-button.primary:hover {
          background: #333;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          display: block;
        }
        .empty-state h4 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }
        .empty-state p {
          font-size: 14px;
          color: #6d7175;
          margin: 0 0 20px 0;
        }

        /* Add-Ons Preview */
        .addons-preview {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .addon-preview-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .addon-preview-toggle {
          width: 44px;
          height: 24px;
          background: #d1d5db;
          border-radius: 12px;
          position: relative;
        }
        .toggle-dot {
          position: absolute;
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: 0.2s;
        }
        .toggle-dot.on {
          left: 22px;
          background: #10b981;
        }
        .addon-preview-icon {
          font-size: 20px;
        }
        .addon-preview-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
        }
        .addon-preview-info strong {
          font-size: 14px;
          color: #374151;
        }
        .addon-preview-info span {
          font-size: 14px;
          color: #6d7175;
        }
        .preview-empty {
          text-align: center;
          color: #9ca3af;
          padding: 20px;
        }

        /* Add-On Card */
        .addon-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .addon-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .addon-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #374151;
        }
        .addon-icon {
          font-size: 20px;
        }
        .addon-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .addon-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .checkbox-group {
          justify-content: center;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }
        .checkbox-label input {
          width: 18px;
          height: 18px;
        }

        /* Suggestions Section */
        .suggestions-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .suggestions-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #6d7175;
          margin: 0 0 12px 0;
        }
        .suggestion-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .suggestion-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f3f4f6;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .suggestion-card:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }
        .suggestion-icon {
          font-size: 20px;
        }
        .suggestion-name {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
        .suggestion-price {
          font-size: 13px;
          color: #6d7175;
        }

        /* Timer Preview */
        .timer-preview {
          background: linear-gradient(90deg, #fef3c7, #fde68a);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #fcd34d;
        }
        .timer-preview.floating {
          display: inline-flex;
          border-radius: 20px;
        }
        .timer-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .timer-icon {
          font-size: 20px;
        }
        .timer-message {
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
        }

        /* Timer Settings */
        .timer-settings .settings-card {
          background: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        }
        .timer-settings .field-group {
          margin-bottom: 20px;
        }
        .timer-settings .field-group:last-child {
          margin-bottom: 0;
        }
        .duration-input {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .duration-input .field-input {
          width: 80px;
        }
        .duration-label {
          font-size: 14px;
          color: #6d7175;
        }

        /* Style Options */
        .style-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .style-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .style-option:hover {
          background: #e5e7eb;
        }
        .style-option.selected {
          border-color: #000;
          background: #fff;
        }
        .style-option input {
          display: none;
        }
        .style-label {
          font-weight: 500;
          color: #374151;
        }
        .style-desc {
          font-size: 12px;
          color: #9ca3af;
        }

        .position-options {
          display: flex;
          gap: 12px;
        }
        .position-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s;
        }
        .position-option:hover {
          background: #e5e7eb;
        }
        .position-option.selected {
          border-color: #000;
          background: #fff;
        }
        .position-option input {
          display: none;
        }

        /* Templates Section */
        .templates-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }
        .templates-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #6d7175;
          margin: 0 0 12px 0;
        }
        .template-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .template-button {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }
        .template-button:hover {
          background: #e5e7eb;
        }

        /* Announcement Preview */
        .announcement-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 8px;
          color: #fff;
        }
        .announcement-preview.gradient {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        .announcement-preview.solid {
          background: #000;
        }
        .announcement-preview.success {
          background: #10b981;
        }
        .announcement-preview.warning {
          background: #f59e0b;
        }
        .announcement-preview.info {
          background: #3b82f6;
        }
        .announcement-icon {
          font-size: 18px;
        }
        .announcement-text {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
        }
        .announcement-link {
          font-size: 13px;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
        }
        .preview-placeholder {
          color: rgba(255,255,255,0.7);
          font-style: italic;
        }

        /* Announcement Settings */
        .announcement-settings .settings-card {
          background: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e7eb;
        }
        .announcement-settings .field-group {
          margin-bottom: 20px;
        }
        .announcement-settings .field-group:last-child {
          margin-bottom: 0;
        }
        .announcement-styles {
          flex-direction: row !important;
          flex-wrap: wrap;
        }
        .style-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #f3f4f6;
          border: 2px solid transparent;
          border-radius: 20px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          transition: all 0.2s;
        }
        .style-chip:hover {
          background: #e5e7eb;
        }
        .style-chip.selected {
          border-color: #000;
          background: #fff;
        }
        .style-chip input {
          display: none;
        }
        .style-preview-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
        }

        /* Announcement Templates */
        .announcement-templates {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .announcement-template {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f3f4f6;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .announcement-template:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }
        .template-icon {
          font-size: 18px;
        }
        .template-text {
          font-size: 14px;
          color: #374151;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .cart-features-page {
            padding: 16px;
          }
          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          .tabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .tab {
            flex: none;
            padding: 10px 14px;
          }
          .tab-label {
            display: none;
          }
          .tier-fields, .suggestion-cards {
            grid-template-columns: 1fr;
          }
          .field-row {
            flex-direction: column;
          }
          .position-options {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
