import { useState, useEffect } from 'react';
import { GitBranch, AlertCircle, History } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface GitOperationLog {
  id: string;
  operation_type: string;
  status: string;
  message: string;
  created_at: string;
}

const GitOperationsCard = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<GitOperationLog[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('git_operations_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handlePushToMaster = async () => {
    try {
      setIsProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get the GitHub token from Supabase secrets via the Edge Function
      const { data, error } = await supabase.functions.invoke('git-operations', {
        body: {
          branch: 'main',
          commitMessage: 'Force commit: Pushing all files to master'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully pushed changes to master",
      });

      // Refresh logs after operation
      await fetchLogs();
    } catch (error) {
      console.error('Push error:', error);
      toast({
        title: "Push Failed",
        description: error.message || "Failed to push changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-dashboard-card border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-dashboard-accent1" />
            <CardTitle className="text-xl text-white">Git Operations</CardTitle>
          </div>
        </div>
        <CardDescription className="text-dashboard-muted">
          Manage Git operations and repository synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-dashboard-card/50 border-dashboard-accent1/20">
          <AlertCircle className="h-4 w-4 text-dashboard-accent1" />
          <AlertTitle className="text-dashboard-accent1">Important</AlertTitle>
          <AlertDescription className="text-dashboard-muted">
            Using stored GitHub token from Supabase secrets. Make sure it's configured in the Edge Functions settings.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handlePushToMaster}
          disabled={isProcessing}
          className="w-full bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
        >
          {isProcessing ? "Processing..." : "Push to Master"}
        </Button>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-dashboard-accent1" />
            <h3 className="text-sm font-medium text-white">Recent Operations</h3>
          </div>
          <ScrollArea className="h-[200px] rounded-md border border-white/10">
            <div className="p-4 space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="text-sm p-2 rounded bg-dashboard-card/50 border border-white/10"
                >
                  <div className="flex justify-between text-white">
                    <span>{log.operation_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      log.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-dashboard-muted text-xs mt-1">{log.message}</p>
                  <p className="text-dashboard-muted text-xs mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-dashboard-muted text-sm text-center py-4">
                  No recent operations
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default GitOperationsCard;