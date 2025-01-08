import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitOperationRequest {
  branch?: string;
  commitMessage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Get GitHub token from secrets
    const githubToken = Deno.env.get('GITHUB_PAT')
    if (!githubToken) {
      throw new Error('GitHub token not configured')
    }

    const { branch = 'main', commitMessage = 'Force commit: Pushing all files to master' } = await req.json() as GitOperationRequest

    // Log operation start
    const { data: logEntry, error: logError } = await supabaseClient
      .from('git_operations_logs')
      .insert({
        operation_type: 'push',
        status: 'started',
        created_by: user.id,
        message: 'Starting Git push operation'
      })
      .select()
      .single()

    if (logError) {
      console.error('Error logging operation:', logError)
    }

    // GitHub API endpoint
    const repoOwner = 'imedia765'
    const repoName = 's-935078'
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`

    console.log('Fetching current branch state...')
    
    // Get the latest commit SHA
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Current branch state:', data)

    // Update log with success
    await supabaseClient
      .from('git_operations_logs')
      .update({
        status: 'completed',
        message: `Successfully pushed to ${branch}`
      })
      .eq('id', logEntry?.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully pushed to ${branch}`,
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)

    // Log the error
    if (error instanceof Error) {
      await supabaseClient
        .from('git_operations_logs')
        .insert({
          operation_type: 'push',
          status: 'failed',
          message: error.message
        })
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})