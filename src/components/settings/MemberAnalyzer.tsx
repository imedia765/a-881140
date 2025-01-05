import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MemberDetails from './analyzer/MemberDetails';
import UserRoles from './analyzer/UserRoles';
import CollectorInfo from './analyzer/CollectorInfo';
import DatabaseConfig from './analyzer/DatabaseConfig';
import { Clipboard, Plus, X } from 'lucide-react';

interface AnalysisResult {
  memberDetails?: any;
  userRoles?: any[];
  collectorStatus?: any;
  dbConfig?: {
    tables: any[];
    policies: any[];
  };
  errors: string[];
}

const MemberAnalyzer = () => {
  const [memberNumbers, setMemberNumbers] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<(AnalysisResult | null)[]>([]);
  const { toast } = useToast();

  const addMemberNumber = () => {
    setMemberNumbers([...memberNumbers, '']);
    setResults([...results, null]);
  };

  const removeMemberNumber = (index: number) => {
    const newMemberNumbers = memberNumbers.filter((_, i) => i !== index);
    const newResults = results.filter((_, i) => i !== index);
    setMemberNumbers(newMemberNumbers);
    setResults(newResults);
  };

  const updateMemberNumber = (index: number, value: string) => {
    const newMemberNumbers = [...memberNumbers];
    newMemberNumbers[index] = value;
    setMemberNumbers(newMemberNumbers);
  };

  const copyToClipboard = async (data: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast({
        title: "Copied to clipboard",
        description: "Analysis data has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy data to clipboard",
        variant: "destructive",
      });
    }
  };

  const analyzeMember = async () => {
    setLoading(true);
    const newResults: (AnalysisResult | null)[] = [];

    for (let i = 0; i < memberNumbers.length; i++) {
      const memberNumber = memberNumbers[i];
      const errors: string[] = [];

      try {
        // 1. Check member details
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('member_number', memberNumber.trim())
          .maybeSingle();

        if (memberError) {
          errors.push(`Member query error: ${memberError.message}`);
        }

        let rolesData = null;
        let collectorData = null;

        if (memberData?.auth_user_id) {
          // 2. Check user roles
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', memberData.auth_user_id);

          if (rolesError) {
            errors.push(`Roles query error: ${rolesError.message}`);
          } else {
            rolesData = roles;
          }
        }

        // 3. Check collector status if applicable
        if (memberData?.collector_id) {
          const { data: collector, error: collectorError } = await supabase
            .from('members_collectors')
            .select('*')
            .eq('id', memberData.collector_id)
            .maybeSingle();

          if (collectorError) {
            errors.push(`Collector query error: ${collectorError.message}`);
          } else {
            collectorData = collector;
          }
        }

        // 4. Fetch database configuration (only for single member analysis)
        let dbConfigData = null;
        if (memberNumbers.length === 1) {
          const { data: tables, error: tablesError } = await supabase
            .rpc('get_tables_info');

          const { data: policies, error: policiesError } = await supabase
            .rpc('get_rls_policies');

          if (tablesError) {
            errors.push(`Tables query error: ${tablesError.message}`);
          }
          if (policiesError) {
            errors.push(`Policies query error: ${policiesError.message}`);
          }

          dbConfigData = {
            tables: tables || [],
            policies: policies || []
          };
        }

        newResults[i] = {
          memberDetails: memberData || null,
          userRoles: rolesData,
          collectorStatus: collectorData,
          dbConfig: dbConfigData,
          errors
        };

      } catch (error: any) {
        newResults[i] = {
          errors: [error.message]
        };
      }
    }

    setResults(newResults);
    setLoading(false);

    toast({
      title: "Analysis Complete",
      description: newResults.some(r => r?.errors.length > 0) 
        ? "Analysis completed with some errors" 
        : "Analysis completed successfully",
      variant: newResults.some(r => r?.errors.length > 0) ? "destructive" : "default",
    });
  };

  const findDifferences = () => {
    if (results.length < 2) return null;

    const differences: Record<string, any> = {};
    const firstMember = results[0]?.memberDetails;

    if (!firstMember) return null;

    results.slice(1).forEach((result, index) => {
      const currentMember = result?.memberDetails;
      if (!currentMember) return;

      differences[memberNumbers[index + 1]] = Object.entries(firstMember)
        .reduce((acc: Record<string, any>, [key, value]) => {
          if (currentMember[key] !== value) {
            acc[key] = {
              first: value,
              current: currentMember[key]
            };
          }
          return acc;
        }, {});
    });

    return differences;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Analyzer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {memberNumbers.map((number, index) => (
            <div key={index} className="flex gap-4">
              <Input
                placeholder="Enter member number"
                value={number}
                onChange={(e) => updateMemberNumber(index, e.target.value)}
                className="max-w-sm"
              />
              {index > 0 && (
                <Button 
                  variant="destructive"
                  size="icon"
                  onClick={() => removeMemberNumber(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={addMemberNumber}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member Number
            </Button>
            <Button 
              onClick={analyzeMember} 
              disabled={loading || memberNumbers.some(n => !n.trim())}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
        
        {results.length > 0 && (
          <ScrollArea className="h-[500px] w-full rounded-md border mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {results.map((result, index) => result && (
                <div key={index} className="space-y-4 border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Analysis for {memberNumbers[index]}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result)}
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-md">
                      <h3 className="text-red-500 font-semibold mb-2">Issues Found:</h3>
                      <ul className="list-disc pl-4">
                        {result.errors.map((error, i) => (
                          <li key={i} className="text-red-400">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <MemberDetails memberDetails={result.memberDetails} />
                  <UserRoles roles={result.userRoles || []} />
                  <CollectorInfo collectorStatus={result.collectorStatus} />
                  {memberNumbers.length === 1 && (
                    <DatabaseConfig 
                      tables={result.dbConfig?.tables || []} 
                      policies={result.dbConfig?.policies || []} 
                    />
                  )}
                </div>
              ))}
            </div>

            {results.length > 1 && (
              <div className="p-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Differences Analysis</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(findDifferences(), null, 2)}
                </pre>
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberAnalyzer;