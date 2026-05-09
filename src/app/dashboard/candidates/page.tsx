"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Filter,
  Download,
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  source: string;
  score?: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUSES = ["ALL", "NEW", "IN_REVIEW", "INTERVIEW", "HIRED", "REJECTED"];

const statusStyles: Record<string, string> = {
  NEW: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  IN_REVIEW: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  INTERVIEW: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  HIRED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", status: "NEW", score: 0 });

  const fetchCandidates = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: "10",
        search,
        status: statusFilter,
      });
      const res = await fetch(`/api/candidates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    const debounce = setTimeout(() => fetchCandidates(), 300);
    return () => clearTimeout(debounce);
  }, [fetchCandidates]);

  // Auto-refresh for collaboration
  useEffect(() => {
    const interval = setInterval(fetchCandidates, 15000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  const handleSave = async () => {
    const method = editingCandidate ? "PATCH" : "POST";
    const url = editingCandidate
      ? `/api/candidates/${editingCandidate.id}`
      : "/api/candidates";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setDialogOpen(false);
      setEditingCandidate(null);
      setForm({ name: "", email: "", phone: "", status: "NEW", score: 0 });
      fetchCandidates();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;
    const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    if (res.ok) fetchCandidates();
  };

  const openEdit = (c: Candidate) => {
    setEditingCandidate(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      status: c.status,
      score: c.score || 0,
    });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingCandidate(null);
    setForm({ name: "", email: "", phone: "", status: "NEW", score: 0 });
    setDialogOpen(true);
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter);
    const url = `/api/candidates/export?${params}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Candidates</h1>
          <p className="text-white/40 mt-1">
            {pagination.total} total candidates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openAdd}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Candidate
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCandidate ? "Edit Candidate" : "Add New Candidate"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-white/70">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Phone number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    {STATUSES.filter((s) => s !== "ALL").map((s) => (
                      <option key={s} value={s} className="bg-[#12121a]">
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Score</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.score}
                    onChange={(e) =>
                      setForm({ ...form, score: parseInt(e.target.value) || 0 })
                    }
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
              >
                {editingCandidate ? "Update" : "Create"} Candidate
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === s
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
              }`}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/30">No candidates found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/40 font-medium">Name</TableHead>
                <TableHead className="text-white/40 font-medium hidden md:table-cell">Email</TableHead>
                <TableHead className="text-white/40 font-medium hidden lg:table-cell">Phone</TableHead>
                <TableHead className="text-white/40 font-medium">Status</TableHead>
                <TableHead className="text-white/40 font-medium hidden sm:table-cell">Score</TableHead>
                <TableHead className="text-white/40 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">
                          {c.name}
                        </p>
                        <p className="text-xs text-white/30 md:hidden">
                          {c.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/50 text-sm hidden md:table-cell">
                    {c.email}
                  </TableCell>
                  <TableCell className="text-white/50 text-sm hidden lg:table-cell">
                    {c.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border ${
                        statusStyles[c.status] || "bg-white/10 text-white/50"
                      }`}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${c.score || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40">
                        {c.score || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-2 rounded-lg text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/30">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((p) => ({ ...p, page: p.page - 1 }))
              }
              className="border-white/10 text-white/50 hover:text-white hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() =>
                setPagination((p) => ({ ...p, page: p.page + 1 }))
              }
              className="border-white/10 text-white/50 hover:text-white hover:bg-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
