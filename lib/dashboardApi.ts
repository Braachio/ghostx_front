// 대시보드 API 클라이언트

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface DashboardOverview {
  user_id: string;
  track?: string;
  period_days: number;
  total_laps: number;
  summary: {
    best_lap_time?: number;
    average_lap_time?: number;
    improvement_trend?: number;
    total_distance: number;
  };
  recent_laps: Array<{
    lap_id: string;
    track: string;
    car: string;
    lap_time: number;
    created_at: string;
    weather?: string;
    air_temp?: number;
    track_temp?: number;
    sector_count: number;
    sectors: Array<{
      sector_index: number;
      sector_time: number;
      sector_speed: number;
    }>;
  }>;
  performance_metrics: {
    consistency_score: number;
    improvement_rate: number;
    best_sector_times: Array<{
      sector_index: number;
      sector_time: number;
      improvement_potential: number;
    }>;
  };
  track_leaderboard: Array<{
    user_id: string;
    lap_time: number;
    car: string;
    created_at: string;
  }>;
}

export interface PerformanceTrends {
  user_id: string;
  track?: string;
  period_days: number;
  trends: Array<{
    date: string;
    lap_time: number;
    track: string;
    car: string;
  }>;
  insights: string[];
}

export interface BrakingAnalysis {
  lap_id: string;
  track: string;
  meta: {
    track: string;
    car: string;
    lap_time: number;
    created_at: string;
    weather?: string;
    air_temp?: number;
    track_temp?: number;
  };
  braking_analysis: {
    summary: {
      total_brake_zones: number;
      average_brake_peak: number;
      average_deceleration: number;
      trail_braking_usage: number;
      abs_usage: number;
    };
    visualization: {
      brake_zones: Array<{
        id: string;
        corner_index: number;
        segment_name: string;
        start_time: number;
        end_time: number;
        start_distance?: number;
        end_distance?: number;
        duration?: number;
        brake_peak: number;
        decel_avg: number;
        trail_braking_ratio: number;
        abs_on_ratio: number;
        slip_lock_ratio_front: number;
        slip_lock_ratio_rear: number;
      }>;
      performance_metrics: Array<{
        corner_index: number;
        brake_efficiency: number;
        smoothness_score: number;
        aggressiveness_score: number;
      }>;
      corner_analysis: Array<{
        corner_index: number;
        segment_name: string;
        strengths: string[];
        weaknesses: string[];
        improvement_areas: string[];
      }>;
    };
    feedbacks: string[];
    overall_score: number;
  };
  comparison: {
    benchmark_data: Array<{
      corner_index: number;
      segment_name: string;
      your_brake_peak: number;
      benchmark_brake_peak: number;
      your_decel: number;
      benchmark_decel: number;
      performance_vs_benchmark: 'above_average' | 'average' | 'below_average';
    }>;
    comparison_metrics: {
      overall_performance: 'above_average' | 'average' | 'below_average';
      improvement_potential: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
  insights: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface Leaderboard {
  track: string;
  corner_index?: number;
  leaderboard: Array<{
    driver_id: string;
    lap_id: string;
    corner_index: number;
    segment_name: string;
    brake_peak: number;
    decel_avg: number;
    trail_braking_ratio: number;
    abs_on_ratio: number;
    performance_score: number;
    created_at: string;
  }>;
  statistics: {
    total_samples: number;
    brake_peak: {
      average: number;
      min: number;
      max: number;
    };
    deceleration: {
      average: number;
      min: number;
      max: number;
    };
    trail_braking: {
      average_usage: number;
      max_usage: number;
    };
    abs_usage: {
      average_usage: number;
      max_usage: number;
    };
  };
  best_practices: Array<{
    practice: string;
    recommended_value: number;
    description: string;
  }>;
}

// API 호출 함수들
export async function fetchDashboardOverview(
  userId: string,
  track?: string,
  days: number = 30
): Promise<DashboardOverview> {
  const params = new URLSearchParams();
  if (track) params.append('track', track);
  params.append('days', days.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/dashboard/overview/${userId}?${params}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchPerformanceTrends(
  userId: string,
  track?: string,
  days: number = 30
): Promise<PerformanceTrends> {
  const params = new URLSearchParams();
  if (track) params.append('track', track);
  params.append('days', days.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/dashboard/performance-trends/${userId}?${params}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export interface LapDetail {
  lap_id: string;
  meta: {
    track: string;
    car: string;
    lap_time: number;
    created_at: string;
  };
  performance_metrics: {
    total_time: number;
    average_speed: number;
    max_speed: number;
    brake_efficiency: number;
    sector_count: number;
    avg_sector_time: number;
    brake_segments_count: number;
  };
  sector_analysis: Array<{
    sector_index: number;
    sector_time: number;
    sector_speed: number;
    improvement_potential: number;
  }>;
  braking_analysis: {
    segments: Array<{
      start_time: number;
      end_time: number;
      brake_peak: number;
      decel_avg: number;
    }>;
    summary: {
      total_brake_zones: number;
      average_brake_peak: number;
      trail_braking_usage: number;
    };
  };
  visualization_data: {
    graph_data: Array<{
      time: number;
      speed: number;
      brake_pressure: number;
      throttle: number;
    }>;
    brake_segments: Array<{
      start_time: number;
      end_time: number;
      brake_peak: number;
    }>;
    sector_markers: Array<{
      sector_index: number;
      time: number;
    }>;
  };
  insights: string[];
}

export async function fetchLapDetail(lapId: string): Promise<LapDetail> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard/lap-detail/${lapId}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchBrakingAnalysis(lapId: string): Promise<BrakingAnalysis> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/braking/analysis/${lapId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Braking analysis API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch braking analysis:', error);
    throw error;
  }
}

export async function fetchBrakingComparison(
  userId: string,
  track?: string,
  days: number = 30
): Promise<BrakingComparison> {
  const params = new URLSearchParams();
  if (track) params.append('track', track);
  params.append('days', days.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/braking/comparison/${userId}?${params}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchBrakingLeaderboard(
  track: string,
  cornerIndex?: number
): Promise<Leaderboard> {
  const params = new URLSearchParams();
  if (cornerIndex !== undefined) params.append('corner_index', cornerIndex.toString());
  
  const response = await fetch(`${API_BASE_URL}/api/braking/leaderboard/${track}?${params}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// 유틸리티 함수들
export function formatLapTime(seconds: number): string {
  if (!seconds) return '--';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

export function getInsightIcon(type: string): string {
  const icons = {
    'success': 'fas fa-check-circle text-green-500',
    'warning': 'fas fa-exclamation-triangle text-yellow-500',
    'error': 'fas fa-times-circle text-red-500',
    'info': 'fas fa-info-circle text-blue-500'
  };
  return icons[type as keyof typeof icons] || icons['info'];
}

export function getInsightClass(type: string): string {
  const classes = {
    'success': 'bg-green-50 border-l-4 border-green-400',
    'warning': 'bg-yellow-50 border-l-4 border-yellow-400',
    'error': 'bg-red-50 border-l-4 border-red-400',
    'info': 'bg-blue-50 border-l-4 border-blue-400'
  };
  return classes[type as keyof typeof classes] || classes['info'];
}

export interface BrakingComparison {
  user_id: string;
  track?: string;
  period_days: number;
  total_analyses: number;
  trends: {
    trend: string;
    change_rate: number;
    recent_performance: number;
    early_performance: number;
  };
  corner_comparison: Array<{
    corner_index: number;
    segment_name: string;
    your_avg_brake_peak: number;
    benchmark_brake_peak: number;
    improvement_potential: number;
  }>;
  recommendations: Array<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface BrakingLeaderboard {
  track: string;
  corner_index?: number;
  leaderboard: Array<{
    driver_id: string;
    lap_id: string;
    corner_index: number;
    segment_name: string;
    brake_peak: number;
    decel_avg: number;
    trail_braking_ratio: number;
    abs_on_ratio: number;
    performance_score: number;
    created_at: string;
  }>;
  statistics: {
    total_samples: number;
    brake_peak: {
      average: number;
      min: number;
      max: number;
    };
    deceleration: {
      average: number;
      min: number;
      max: number;
    };
    trail_braking: {
      average_usage: number;
      max_usage: number;
    };
    abs_usage: {
      average_usage: number;
      max_usage: number;
    };
  };
  best_practices: Array<{
    practice: string;
    recommended_value: number;
    description: string;
  }>;
}
