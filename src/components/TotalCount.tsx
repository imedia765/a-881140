import { Users } from 'lucide-react';

interface TotalCountProps {
  count: number;
  label: string;
  icon?: React.ReactNode;
}

const TotalCount = ({ count, label, icon }: TotalCountProps) => {
  return (
    <div className="glass-card p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm text-dashboard-muted">{label}</p>
          <p className="text-2xl font-semibold">{count}</p>
        </div>
      </div>
    </div>
  );
};

export default TotalCount;