import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { Member } from "@/types/member";
import { isOverdue } from "@/lib/dateUtils";

interface YearlyPaymentProps {
  memberProfile: Member;
}

const YearlyPayment = ({ memberProfile }: YearlyPaymentProps) => {
  // Set default yearly payment amount to £40
  const yearlyAmount = memberProfile?.yearly_payment_amount || 40;
  const defaultDueDate = '2025-01-01'; // Set to January 1st, 2025

  const formatDueDate = (date: string | null) => {
    if (!date) return 'January 1st (Annually)';
    const day = new Date(date).getDate();
    const suffix = ['st', 'nd', 'rd'][((day + 90) % 100 - 11) % 10 - 1] || 'th';
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      month: 'long',
      day: 'numeric'
    });
    return `${formattedDate.replace(/\d+/, day + suffix)} (Annually)`;
  };

  return (
    <div className="space-y-2 bg-white/5 p-6 rounded-lg border border-white/10 hover:border-dashboard-accent1/30 transition-all duration-300">
      <h4 className="font-medium text-dashboard-accent2 flex items-center gap-2 mb-4 text-lg">
        <Calendar className="w-5 h-5" />
        Yearly Payment
      </h4>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-dashboard-muted">Amount:</span>
          <span className="text-dashboard-text font-medium text-lg">
            {formatCurrency(yearlyAmount)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-dashboard-muted">Due Date:</span>
          <span className="text-dashboard-text text-lg">
            {formatDueDate(memberProfile?.yearly_payment_due_date || defaultDueDate)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-dashboard-muted">Status:</span>
          <span className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium",
            memberProfile?.yearly_payment_status === 'paid'
              ? "bg-dashboard-accent3/20 text-dashboard-accent3"
              : isOverdue(memberProfile?.yearly_payment_due_date || defaultDueDate)
                ? "bg-red-500/20 text-red-500"
                : "bg-dashboard-warning/20 text-dashboard-warning"
          )}>
            {memberProfile?.yearly_payment_status || 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default YearlyPayment;