import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Member } from "@/types/member";
import { formatCurrency } from "@/lib/formatters";
import { isOverdue } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import RegularPayment from "./financial/RegularPayment";
import YearlyPayment from "./financial/YearlyPayment";
import PaymentTimeline from "./financial/PaymentTimeline";

interface FinancialDetailsProps {
  memberProfile: Member;
}

const FinancialDetails = ({ memberProfile }: FinancialDetailsProps) => {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <p className="text-dashboard-muted text-sm font-medium">Financial Information</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emergency Collection Alert - Moved to top */}
          {memberProfile?.emergency_collection_amount && (
            <div className="md:col-span-2 space-y-4">
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription className="text-base">
                  Emergency Collection Required
                </AlertDescription>
              </Alert>
              
              <div className="bg-white/5 p-6 rounded-lg border border-red-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-dashboard-muted">Amount Due:</span>
                  <span className="text-dashboard-text font-medium text-lg">
                    {formatCurrency(memberProfile?.emergency_collection_amount)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-dashboard-muted">Due Date:</span>
                  <span className="text-dashboard-text text-lg">
                    {memberProfile?.emergency_collection_due_date || 'Not set'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-dashboard-muted">Status:</span>
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium",
                    memberProfile?.emergency_collection_status === 'paid'
                      ? "bg-dashboard-accent3/20 text-dashboard-accent3"
                      : isOverdue(memberProfile?.emergency_collection_due_date || null)
                        ? "bg-red-500/20 text-red-500"
                        : "bg-dashboard-warning/20 text-dashboard-warning"
                  )}>
                    {memberProfile?.emergency_collection_status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <YearlyPayment memberProfile={memberProfile} />
          <RegularPayment memberProfile={memberProfile} />
        </div>

        <PaymentTimeline memberProfile={memberProfile} />

        {memberProfile?.payment_notes && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-dashboard-muted text-sm mb-2">Notes:</p>
            <p className="text-dashboard-text">{memberProfile.payment_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDetails;