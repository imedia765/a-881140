import { CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Member } from "@/types/member";

interface RegularPaymentProps {
  memberProfile: Member;
}

const RegularPayment = ({ memberProfile }: RegularPaymentProps) => {
  return (
    <div className="space-y-2 bg-white/5 p-6 rounded-lg border border-white/10 hover:border-dashboard-accent1/30 transition-all duration-300">
      <h4 className="font-medium text-dashboard-accent2 flex items-center gap-2 mb-4 text-lg">
        <CreditCard className="w-5 h-5" />
        Emergency Collection
      </h4>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-dashboard-muted">Amount:</span>
          <span className="text-dashboard-text font-medium text-lg">
            {formatCurrency(memberProfile?.payment_amount || null)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-dashboard-muted">Type:</span>
          <span className="text-dashboard-text text-lg">
            {memberProfile?.payment_type || 'Not specified'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-dashboard-muted">Last Payment:</span>
          <span className="text-dashboard-text text-lg">
            {formatDate(memberProfile?.payment_date || null)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RegularPayment;