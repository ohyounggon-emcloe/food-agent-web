export interface Site {
  id: number;
  site_name: string;
  target_url: string;
  category: string | null;
  board_name: string | null;
  status: string | null;
  collection_method: string | null;
  error_message: string | null;
  suggested_url: string | null;
  last_scraped_at: string | null;
  created_at: string;
}

export interface Keyword {
  id: number;
  keyword_no: number | null;
  keyword: string;
  risk_level: string | null;
  action_guide: string | null;
  created_at: string;
}

export interface KeywordSuggestion {
  id: number;
  keyword: string;
  risk_level: string;
  source_url: string | null;
  status: string;
  created_at: string;
}

export interface SystemLog {
  id: number;
  run_id: string | null;
  agent_name: string;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
  articles_count: number | null;
  started_at: string | null;
  created_at: string;
}

export interface AgentStats {
  agent_name: string;
  total_runs: number;
  success_count: number;
  fail_count: number;
  partial_count: number;
  success_rate: number | null;
  avg_duration_ms: number | null;
  last_run_at: string | null;
  last_failure_at: string | null;
}

export interface DashboardData {
  totalArticles: number;
  todayArticles: number;
  riskDistribution: { risk_level: string; count: number }[];
  agentStats: AgentStats[];
  siteCounts: { active: number; error: number; inactive: number };
  pendingSuggestions: { sites: number; keywords: number };
}
