import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Wallet,
  LogOut
} from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface SidePanelProps {
  onTabChange: (tab: string) => void;
}

const SidePanel = ({ onTabChange }: SidePanelProps) => {
  const { handleSignOut } = useAuthSession();
  const { userRole, canAccessTab, hasRole } = useRoleAccess();
  
  console.log('SidePanel rendered with role:', userRole);
  
  const handleLogoutClick = () => {
    handleSignOut(false);
  };

  const handleTabChange = (tab: string) => {
    console.log('Tab change requested:', tab, 'Current role:', userRole);
    if (canAccessTab(tab)) {
      onTabChange(tab);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-white/10">
      <div className="p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-white mb-1">
          Dashboard
        </h2>
        <p className="text-sm text-dashboard-muted">
          Manage your account
        </p>
      </div>
      
      <ScrollArea className="flex-1 px-4 lg:px-6">
        <div className="space-y-1.5">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm"
            onClick={() => handleTabChange('dashboard')}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Button>

          {(hasRole('admin') || hasRole('collector')) && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={() => handleTabChange('users')}
            >
              <Users className="h-4 w-4" />
              Members
            </Button>
          )}

          {hasRole('admin') && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm"
                onClick={() => handleTabChange('financials')}
              >
                <Wallet className="h-4 w-4" />
                Collectors & Financials
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm"
                onClick={() => handleTabChange('system')}
              >
                <Settings className="h-4 w-4" />
                System
              </Button>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 lg:p-6 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-dashboard-muted hover:text-white"
          onClick={handleLogoutClick}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default SidePanel;