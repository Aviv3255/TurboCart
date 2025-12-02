'use client';

import { useState, useEffect } from 'react';

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
  };
  announcement: {
    text: string;
    icon: string;
  };
  display_style: string;
  position: string;
}

type TabType = 'features' | 'rewards' | 'addons' | 'timer' | 'announcement';

export default function CartFeaturesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('features');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    features: { upsells: true, rewards: false, addons: false, timer: false, announcement: false },
    timer: { duration: 10, message: 'Your cart will expire in {time}!' },
    announcement: { text: '', icon: 'info' },
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
      const res = await fetch('/api/admin/cart-features');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
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
    try {
      const res = await fetch('/api/admin/cart-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, rewards, addons }),
      });
      if (res.ok) {
        alert('Settings saved successfully!');
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
      threshold: 50,
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'features', label: 'Features' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'addons', label: 'Add-Ons' },
    { id: 'timer', label: 'Timer' },
    { id: 'announcement', label: 'Announcement' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cart Features</h1>
        <button
          onClick={saveChanges}
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">Enable or disable cart features:</p>

          {[
            { key: 'upsells', label: 'Upsell Products', desc: 'Show recommended products in the cart' },
            { key: 'rewards', label: 'Rewards Progress', desc: 'Show progress bar to free shipping or discounts' },
            { key: 'addons', label: 'Switch Add-Ons', desc: 'Toggle products like shipping protection' },
            { key: 'timer', label: 'Urgency Timer', desc: 'Countdown timer showing cart expiration' },
            { key: 'announcement', label: 'Announcement Bar', desc: 'Custom promotional message in cart' },
          ].map((feature) => (
            <label
              key={feature.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <div className="font-medium text-gray-900">{feature.label}</div>
                <div className="text-sm text-gray-500">{feature.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.features[feature.key as keyof typeof settings.features]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    features: { ...settings.features, [feature.key]: e.target.checked },
                  })
                }
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
              />
            </label>
          ))}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Set up reward tiers based on cart value. Customers see progress towards each reward.
          </p>

          {rewards.map((reward, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-gray-700">Reward {index + 1}</span>
                <button
                  onClick={() => removeReward(index)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Threshold ($)</label>
                  <input
                    type="number"
                    value={reward.threshold}
                    onChange={(e) => updateReward(index, 'threshold', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Reward Type</label>
                  <select
                    value={reward.reward_type}
                    onChange={(e) => updateReward(index, 'reward_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="free_shipping">Free Shipping</option>
                    <option value="discount_percent">Discount %</option>
                    <option value="discount_fixed">Fixed Discount</option>
                    <option value="gift">Free Gift</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Display Label</label>
                  <input
                    type="text"
                    value={reward.label}
                    onChange={(e) => updateReward(index, 'label', e.target.value)}
                    placeholder="e.g., Free Shipping"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Icon</label>
                  <select
                    value={reward.icon}
                    onChange={(e) => updateReward(index, 'icon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="truck">Truck (Shipping)</option>
                    <option value="tag">Tag (Discount)</option>
                    <option value="gift">Gift</option>
                    <option value="star">Star</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addReward}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            + Add Reward Tier
          </button>
        </div>
      )}

      {/* Add-Ons Tab */}
      {activeTab === 'addons' && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Add toggle switches for extra products like shipping protection or gift wrapping.
          </p>

          {addons.map((addon, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-gray-700">Add-On {index + 1}</span>
                <button
                  onClick={() => removeAddon(index)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={addon.name}
                    onChange={(e) => updateAddon(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addon.price}
                    onChange={(e) => updateAddon(index, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={addon.description}
                    onChange={(e) => updateAddon(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Icon</label>
                  <select
                    value={addon.icon}
                    onChange={(e) => updateAddon(index, 'icon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="shield">Shield (Protection)</option>
                    <option value="gift">Gift</option>
                    <option value="truck">Truck</option>
                    <option value="clock">Clock</option>
                    <option value="star">Star</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addon.default_enabled}
                      onChange={(e) => updateAddon(index, 'default_enabled', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-600">Enabled by default</span>
                  </label>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addAddon}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
          >
            + Add Switch Add-On
          </button>
        </div>
      )}

      {/* Timer Tab */}
      {activeTab === 'timer' && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Show a countdown timer to create urgency. Use {'{time}'} in the message to show the timer.
          </p>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Duration (minutes)</label>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Message</label>
              <input
                type="text"
                value={settings.timer.message}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    timer: { ...settings.timer, message: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-400 mt-1">Use {'{time}'} to show the countdown</p>
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              Preview: {settings.timer.message.replace('{time}', '09:59')}
            </div>
          </div>
        </div>
      )}

      {/* Announcement Tab */}
      {activeTab === 'announcement' && (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Display a custom message at the top of the cart drawer.
          </p>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Message</label>
              <input
                type="text"
                value={settings.announcement.text}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, text: e.target.value },
                  })
                }
                placeholder="e.g., Checkout now before items sell out!"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Icon</label>
              <select
                value={settings.announcement.icon}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    announcement: { ...settings.announcement, icon: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="info">Info</option>
                <option value="alert">Alert</option>
                <option value="clock">Clock</option>
                <option value="star">Star</option>
                <option value="gift">Gift</option>
              </select>
            </div>

            {/* Preview */}
            {settings.announcement.text && (
              <div className="mt-4 p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white text-sm">
                Preview: {settings.announcement.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
