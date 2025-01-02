import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Database } from '@/integrations/supabase/types';
import { ScrollArea } from "@/components/ui/scroll-area";

type Member = Database['public']['Tables']['members']['Row'];

const MembersList = ({ searchTerm }: { searchTerm: string }) => {
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members', searchTerm],
    queryFn: async () => {
      console.log('Fetching members...');
      let query = supabase
        .from('members')
        .select('*');
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,collector.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      return data as Member[];
    },
  });

  if (isLoading) return <div className="text-center py-4">Loading members...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error loading members: {error.message}</div>;
  if (!members?.length) return <div className="text-center py-4">No members found</div>;

  return (
    <ScrollArea className="h-[400px] w-full rounded-md">
      <div className="space-y-4">
        {members.map((member) => (
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
    </ScrollArea>
  );
};

export default MembersList;