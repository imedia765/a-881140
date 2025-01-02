import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Tables } from '@/integrations/supabase/types';
import MetricCard from '@/components/MetricCard';
import MonthlyChart from '@/components/MonthlyChart';
import CustomerRequests from '@/components/CustomerRequests';
import CollectorsList from '@/components/CollectorsList';
import SidePanel from '@/components/SidePanel';
import TotalCount from '@/components/TotalCount';
import MemberSearch from '@/components/MemberSearch';
import { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Bell, Globe, Users, UserCheck } from 'lucide-react';

const MEMBERS_PER_PAGE = 10;

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const { data: membersData, isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ['members', currentPage, searchTerm],
    queryFn: async () => {
      console.log('Fetching members...');
      let query = supabase
        .from('members')
        .select('*', { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,collector.ilike.%${searchTerm}%`);
      }
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(currentPage * MEMBERS_PER_PAGE, (currentPage + 1) * MEMBERS_PER_PAGE - 1)
        .throwOnError();
      
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      console.log('Fetched members count:', count);
      return { 
        members: data as Tables<'members'>[], 
        totalCount: count || 0 
      };
    },
  });

  const { data: collectors } = useQuery({
    queryKey: ['members_collectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members_collectors')
        .select('*')
        .throwOnError();
      
      if (error) throw error;
      return data;
    },
  });

  const filteredMembers = membersData?.members?.filter(member => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(searchLower) ||
      member.member_number?.toLowerCase().includes(searchLower) ||
      member.collector?.toLowerCase().includes(searchLower)
    );
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2">Dashboard</h1>
              <p className="text-dashboard-muted">Below is an example dashboard created using charts from this plugin</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <MetricCard
                title="Shop"
                value={68}
                color="#7EBF8E"
              />
              <MetricCard
                title="Mobile"
                value={52}
                color="#8989DE"
              />
              <MetricCard
                title="Other"
                value={85}
                color="#61AAF2"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyChart />
              <CustomerRequests />
            </div>
          </>
        );
      case 'users':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2">Members</h1>
              <p className="text-dashboard-muted">View and manage member information</p>
            </header>
            <TotalCount 
              count={filteredMembers?.length || 0}
              label="Total Members"
              icon={<Users className="w-6 h-6 text-blue-400" />}
            />
            <MemberSearch 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <div className="space-y-4">
              {membersLoading ? (
                <div className="text-center py-4">Loading members...</div>
              ) : membersError ? (
                <div className="text-center py-4 text-red-500">Error loading members: {membersError.message}</div>
              ) : filteredMembers && filteredMembers.length > 0 ? (
                <div className="grid gap-4">
                  {filteredMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="bg-dashboard-card p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-dashboard-accent1 flex items-center justify-center text-white">
                            {member.full_name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <p className="font-medium text-white">{member.full_name}</p>
                            <p className="text-sm text-dashboard-text">{member.email || 'No email provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-white">Member #{member.member_number}</span>
                            <span className="text-sm text-dashboard-text">{member.membership_type || 'Standard'}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            member.status === 'active' 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {member.status || 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">No members found</div>
              )}
            </div>
          </>
        );
      case 'collectors':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2">Collectors</h1>
              <p className="text-dashboard-muted">View all collectors and their assigned members</p>
            </header>
            <TotalCount 
              count={collectors?.length || 0}
              label="Total Collectors"
              icon={<UserCheck className="w-6 h-6 text-purple-400" />}
            />
            <CollectorsList />
          </>
        );
      case 'settings':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2">Settings</h1>
              <p className="text-dashboard-muted">Configure your application settings</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="dashboard-card">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-xl font-medium">Notifications</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-400">Receive email updates</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-400">Receive push notifications</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              <div className="dashboard-card">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-green-400" />
                  <h2 className="text-xl font-medium">Preferences</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Language</p>
                      <p className="text-sm text-gray-400">Select your language</p>
                    </div>
                    <select className="bg-transparent border rounded-md px-2 py-1">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-gray-400">Toggle dark mode</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <SidePanel onTabChange={setActiveTab} />
      <div className="pl-64">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;
