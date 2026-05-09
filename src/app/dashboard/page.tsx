"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserPlus,
  UserCheck,
  Calendar,
  TrendingUp,
  XCircle,
  Clock,
} from "lucide-react";

interface Stats {
  totalCandidates: number;
  newCount: number;
  inReviewCount: number;
  interviewCount: number;
  hiredCount: number;
  rejectedCount: number;
  upcomingInterviews: number;
}

interface PipelineItem {
  name: string;
  value: number;
  color: string;
}

interface RecentCandidate {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NEW: "bg-indigo-500/20 text-indigo-400",
  IN_REVIEW: "bg-amber-500/20 text-amber-400",
  INTERVIEW: "bg-blue-500/20 text-blue-400",
  HIRED: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<RecentCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setPipeline(data.pipeline);
        setRecentCandidates(data.recentCandidates);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30s for collaboration
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-white/5" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Candidates",
      value: stats?.totalCandidates || 0,
      icon: Users,
      gradient: "from-indigo-600 to-indigo-800",
      shadow: "shadow-indigo-500/20",
    },
    {
      label: "New Applications",
      value: stats?.newCount || 0,
      icon: UserPlus,
      gradient: "from-violet-600 to-purple-800",
      shadow: "shadow-violet-500/20",
    },
    {
      label: "Hired",
      value: stats?.hiredCount || 0,
      icon: UserCheck,
      gradient: "from-emerald-600 to-teal-800",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: "Upcoming Interviews",
      value: stats?.upcomingInterviews || 0,
      icon: Calendar,
      gradient: "from-blue-600 to-cyan-800",
      shadow: "shadow-blue-500/20",
    },
  ];

  const maxPipelineValue = Math.max(...pipeline.map((p) => p.value), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 mt-1">
          Overview of your recruitment pipeline
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className={`border-0 bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-lg overflow-hidden relative group`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/60 font-medium">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {card.value}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <card.icon className="w-5 h-5 text-white/80" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pipeline Chart */}
        <Card className="lg:col-span-3 border-white/5 bg-white/[0.02] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Recruitment Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipeline.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{item.name}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${(item.value / maxPipelineValue) * 100}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 12px ${item.color}40`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Candidates */}
        <Card className="lg:col-span-2 border-white/5 bg-white/[0.02] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Recent Candidates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCandidates.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-4">
                No candidates yet
              </p>
            ) : (
              recentCandidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-white/30 truncate">{c.email}</p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
                      statusColors[c.status] || "bg-white/10 text-white/50"
                    }`}
                  >
                    {c.status.replace("_", " ")}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "In Review", value: stats?.inReviewCount || 0, icon: Clock, color: "text-amber-400" },
          { label: "Interview", value: stats?.interviewCount || 0, icon: Calendar, color: "text-blue-400" },
          { label: "Hired", value: stats?.hiredCount || 0, icon: UserCheck, color: "text-emerald-400" },
          { label: "Rejected", value: stats?.rejectedCount || 0, icon: XCircle, color: "text-red-400" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
          >
            <item.icon className={`w-5 h-5 ${item.color}`} />
            <div>
              <p className="text-lg font-bold text-white">{item.value}</p>
              <p className="text-xs text-white/40">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
