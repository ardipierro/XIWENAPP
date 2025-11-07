import { BaseCard, BaseButton } from '../../components/base';
import { Save, Settings, Shield, Bell } from 'lucide-react';

function SettingsScreen() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-inverse mb-2">System Settings</h1>
        <p className="text-text-secondary dark:text-neutral-400">Configure platform settings</p>
      </div>

      <BaseCard title="General Settings" icon={<Settings size={20} className="text-accent-500" />}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
              Platform Name
            </label>
            <input
              type="text"
              defaultValue="XIWENAPP"
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary dark:text-text-inverse mb-2">
              Support Email
            </label>
            <input
              type="email"
              defaultValue="support@xiwenapp.com"
              className="w-full px-4 py-2 border border-border dark:border-border-dark rounded-lg bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Security" icon={<Shield size={20} className="text-accent-500" />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text-primary dark:text-text-inverse">Two-Factor Authentication</p>
              <p className="text-sm text-text-secondary dark:text-neutral-400">Require 2FA for admin users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:ring-2 peer-focus:ring-accent-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-500"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-text-primary dark:text-text-inverse">Session Timeout</p>
              <p className="text-sm text-text-secondary dark:text-neutral-400">Auto-logout after inactivity</p>
            </div>
            <select className="px-3 py-1 border border-border dark:border-border-dark rounded bg-bg-primary dark:bg-primary-900 text-text-primary dark:text-text-inverse">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>2 hours</option>
            </select>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Notifications" icon={<Bell size={20} className="text-accent-500" />}>
        <div className="space-y-3">
          {['New user registration', 'Course published', 'Payment received'].map((notif) => (
            <div key={notif} className="flex items-center justify-between">
              <span className="text-sm">{notif}</span>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
          ))}
        </div>
      </BaseCard>

      <div className="flex justify-end">
        <BaseButton variant="primary" iconLeft={<Save size={18} />}>Save Changes</BaseButton>
      </div>
    </div>
  );
}

export default SettingsScreen;
