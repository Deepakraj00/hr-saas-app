"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Plus,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Video,
} from "lucide-react";

interface Interview {
  id: string;
  candidateId: string;
  scheduledAt: string;
  type: string;
  status: string;
  notes?: string;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
}

const typeIcons: Record<string, React.ReactNode> = {
  TECHNICAL: <Video className="w-4 h-4" />,
  HR: <User className="w-4 h-4" />,
  FINAL: <CheckCircle2 className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  TECHNICAL: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  HR: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  FINAL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

const statusColors: Record<string, string> = {
  SCHEDULED: "text-amber-400",
  COMPLETED: "text-emerald-400",
  CANCELLED: "text-red-400",
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [candidates, setCandidates] = useState<
    { id: string; name: string }[]
  >([]);
  const [form, setForm] = useState({
    candidateId: "",
    scheduledAt: "",
    type: "TECHNICAL",
    notes: "",
  });

  const fetchInterviews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "ALL") params.set("status", filter);
      const res = await fetch(`/api/interviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews);
      }
    } catch (err) {
      console.error("Failed to fetch interviews:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch("/api/candidates?limit=100");
      if (res.ok) {
        const data = await res.json();
        setCandidates(
          data.candidates.map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchInterviews();
  }, [fetchInterviews]);

  // Auto-refresh for collaboration
  useEffect(() => {
    const interval = setInterval(fetchInterviews, 15000);
    return () => clearInterval(interval);
  }, [fetchInterviews]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleCreate = async () => {
    if (!form.candidateId || !form.scheduledAt || !form.type) return;

    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setDialogOpen(false);
      setForm({ candidateId: "", scheduledAt: "", type: "TECHNICAL", notes: "" });
      fetchInterviews();
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUpcoming = (dateStr: string) => new Date(dateStr) > new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Interviews
          </h1>
          <p className="text-white/40 mt-1">
            {interviews.length} scheduled interviews
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Interview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-white/70">Candidate</Label>
                <select
                  value={form.candidateId}
                  onChange={(e) =>
                    setForm({ ...form, candidateId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="" className="bg-[#12121a]">
                    Select a candidate
                  </option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#12121a]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduledAt: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Type</Label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="TECHNICAL" className="bg-[#12121a]">
                    Technical
                  </option>
                  <option value="HR" className="bg-[#12121a]">
                    HR
                  </option>
                  <option value="FINAL" className="bg-[#12121a]">
                    Final
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Notes (optional)</Label>
                <Input
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Any notes for the interview"
                />
              </div>
              <Button
                onClick={handleCreate}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
              >
                Schedule Interview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filter === s
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Interview cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No interviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <Card
              key={interview.id}
              className={`border-white/5 bg-white/[0.02] overflow-hidden transition-all hover:bg-white/[0.04] ${
                isUpcoming(interview.scheduledAt)
                  ? "border-l-2 border-l-indigo-500"
                  : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Candidate info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {interview.candidate.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        {interview.candidate.name}
                      </p>
                      <p className="text-xs text-white/30">
                        {interview.candidate.email}
                      </p>
                    </div>
                  </div>

                  {/* Type badge */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium w-fit ${
                      typeColors[interview.type] || "bg-white/10 text-white/50"
                    }`}
                  >
                    {typeIcons[interview.type]}
                    {interview.type}
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-2 text-white/40">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {formatDate(interview.scheduledAt)}
                    </span>
                  </div>

                  {/* Status */}
                  <div
                    className={`flex items-center gap-1.5 text-sm font-medium ${
                      statusColors[interview.status] || "text-white/40"
                    }`}
                  >
                    {interview.status === "COMPLETED" && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {interview.status === "CANCELLED" && (
                      <XCircle className="w-4 h-4" />
                    )}
                    {interview.status === "SCHEDULED" && (
                      <Clock className="w-4 h-4" />
                    )}
                    {interview.status}
                  </div>
                </div>
                {interview.notes && (
                  <p className="text-xs text-white/20 mt-3 pl-13">
                    {interview.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
