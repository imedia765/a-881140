import { Clock3, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { Member } from "@/types/member";

interface PaymentTimelineProps {
  memberProfile: Member;
}

const PaymentTimeline = ({ memberProfile }: PaymentTimelineProps) => {
  const getPaymentHistory = () => {
    const history = [];

    if (memberProfile?.payment_date) {
      history.push({
        date: new Date(memberProfile.payment_date),
        type: 'Regular Payment',
        amount: memberProfile.payment_amount,
        status: 'completed',
      });
    }

    if (memberProfile?.yearly_payment_due_date) {
      history.push({
        date: new Date(memberProfile.yearly_payment_due_date),
        type: 'Yearly Payment',
        amount: memberProfile.yearly_payment_amount,
        status: memberProfile.yearly_payment_status,
      });
    }

    if (memberProfile?.emergency_collection_due_date) {
      history.push({
        date: new Date(memberProfile.emergency_collection_due_date),
        type: 'Emergency Collection',
        amount: memberProfile.emergency_collection_amount,
        status: memberProfile.emergency_collection_status,
      });
    }

    return history.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  return (
    <div className="mt-12 space-y-6">
      <h4 className="text-dashboard-accent2 flex items-center gap-2 font-medium text-lg">
        <Clock3 className="w-5 h-5" />
        Payment History
      </h4>
      
      <div className="space-y-6">
        {getPaymentHistory().map((payment, index) => (
          <div key={index} className="relative pl-8 pb-6 border-l-2 border-white/10">
            <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-dashboard-dark border-2 border-white/10" />
            
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 hover:border-dashboard-accent1/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-dashboard-accent2 text-base font-medium">
                  {payment.type}
                </span>
                <span className="text-dashboard-text text-base">
                  {payment.date.toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-dashboard-text font-medium text-lg">
                  {formatCurrency(payment.amount)}
                </span>
                <span className={cn(
                  "flex items-center gap-2 text-sm font-medium",
                  payment.status === 'paid' || payment.status === 'completed'
                    ? "text-dashboard-accent3"
                    : payment.status === 'pending'
                      ? "text-dashboard-warning"
                      : "text-red-500"
                )}>
                  {payment.status === 'paid' || payment.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : payment.status === 'pending' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {payment.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentTimeline;