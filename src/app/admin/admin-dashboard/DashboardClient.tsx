'use client';

import { useTranslation } from 'react-i18next';
import { FaUsers, FaUpload, FaDatabase, FaFileAlt, FaExclamationTriangle } from 'react-icons/fa';

interface Stats {
  totalUsers: number;
  activeAdmins: number;
  totalUploads: number;
  pendingUploads: number;
  totalProducts: number;
  recentLogs: number;
  lastUpload?: string | null;
}

export default function DashboardClient({ stats, error }: { stats: Stats | null; error: string | null }) {
  const { t } = useTranslation('common');

  if (error || !stats) {
    return <ErrorState message={error || t('dashboard.noData')} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--white)]">
          {t('dashboard.title')}
        </h1>
        <p className="text-sm text-[var(--white)]/70 mt-1">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<FaUsers />} label={t('dashboard.stats.users')} value={stats.totalUsers.toLocaleString()} color="bg-[var(--medium-green)]" />
        <StatCard
          icon={<FaUpload />}
          label={t('dashboard.stats.uploads')}
          value={stats.totalUploads.toString()}
          badge={stats.pendingUploads > 0 ? `${stats.pendingUploads} pending` : undefined}
          color="bg-[var(--wine)]"
        />
        <StatCard icon={<FaDatabase />} label={t('dashboard.stats.products')} value={stats.totalProducts.toString()} color="bg-[var(--dark-green)]" />
        <StatCard icon={<FaFileAlt />} label={t('dashboard.stats.logs')} value={stats.recentLogs.toString()} color="bg-[var(--yellow)] text-[var(--dark-green)]" />
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-[var(--yellow)]/20">
        <h2 className="text-lg font-semibold text-[var(--white)] mb-4">
          {t('dashboard.recentActivity')}
        </h2>
        <div className="space-y-3 text-sm">
          {stats.lastUpload ? (
            <p className="text-[var(--white)]/80">
              {t('dashboard.lastUpload')}: <span className="font-medium">{stats.lastUpload}</span>
            </p>
          ) : (
            <p className="text-[var(--white)]/60 italic">{t('dashboard.noUploads')}</p>
          )}
          <p className="text-[var(--white)]/80">
            {t('dashboard.activeAdmins')}: <span className="font-medium">{stats.activeAdmins}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, label, value, badge, color }: { icon: React.ReactNode; label: string; value: string; badge?: string; color: string }) => (
  <div className={`${color} p-5 rounded-xl shadow-lg text-[var(--white)]`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {badge && <p className="text-xs mt-2 opacity-90">{badge}</p>}
      </div>
      <div className="text-3xl opacity-80">{icon}</div>
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <FaExclamationTriangle className="text-5xl text-[var(--yellow)] mb-4" />
    <p className="text-lg text-[var(--white)]">{message}</p>
  </div>
);