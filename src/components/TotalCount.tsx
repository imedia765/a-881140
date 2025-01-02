import { Users } from 'lucide-react';

interface TotalCountItem {
  count: number;
  label: string;
  icon?: React.ReactNode;
}

interface TotalCountProps {
  items: TotalCountItem[];
}

const TotalCount = ({ items }: TotalCountProps) => {
  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center gap-8">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.icon}
            <div>
              <p className="text-sm text-dashboard-muted">{item.label}</p>
              <p className="text-2xl font-semibold">{item.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TotalCount;