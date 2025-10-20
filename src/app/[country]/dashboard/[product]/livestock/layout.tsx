import LivestockSidebar from '@/components/LivestockSidebar';

export default function LivestockLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <LivestockSidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}