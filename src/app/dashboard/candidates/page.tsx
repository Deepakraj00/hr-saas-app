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
  Phone,
  MessageCircle,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status: string;
  source: string;
  interviewDate?: string;
  interviewTime?: string;
  joiningDate?: string;
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [whatsappCandidate, setWhatsappCandidate] = useState<Candidate | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "", status: "NEW", interviewDate: "", interviewTime: "", joiningDate: "" });
  const [error, setError] = useState("");

  const fetchCandidates = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
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
    // Only show full-page loading for the initial load
    if (candidates.length === 0) {
      setLoading(true);
    }
    const debounce = setTimeout(() => fetchCandidates(), 300);
    return () => clearTimeout(debounce);
  }, [fetchCandidates]);

  // Auto-refresh for collaboration
  useEffect(() => {
    const interval = setInterval(fetchCandidates, 15000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  const handleSave = async () => {
    setError("");
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
      setForm({ name: "", email: "", phone: "", role: "", status: "NEW", interviewDate: "", interviewTime: "", joiningDate: "" });
      fetchCandidates();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save candidate. Check if email already exists.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const res = await fetch(`/api/candidates/${deleteConfirmId}`, { method: "DELETE" });
    if (res.ok) {
      fetchCandidates();
      setSelectedIds(prev => prev.filter(id => id !== deleteConfirmId));
    }
    setDeleteConfirmId(null);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (candidates.length === 0) return;
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const res = await fetch("/api/candidates/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    if (res.ok) {
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      fetchCandidates();
    }
  };

  const openWhatsAppModal = (c: Candidate) => {
    let defaultMsg = `Hi ${c.name}, `;
    if (c.interviewDate) {
      const formattedDate = new Date(c.interviewDate).toLocaleDateString();
      const formattedTime = c.interviewTime || "";
      defaultMsg += `your interview is scheduled on ${formattedDate} ${formattedTime}. `;
    } else {
      defaultMsg += `your interview is scheduled. `;
    }
    defaultMsg += `\n\nLocation: Almidm\nMap: https://www.google.com/search?kgmid=%2Fg%2F11t1ld_43p&hl=en-IN&q=Almidm&shem=rimspwouoe&shndl=30&source=sh%2Fx%2Floc%2Fosrp%2Fm1%2F2&kgs=4251e17c886eb10a\n\n`;
    defaultMsg += `Please let us know if you have any questions!`;
    
    setWhatsappCandidate(c);
    setWhatsappMessage(defaultMsg);
  };

  const openEdit = (c: Candidate) => {
    setError("");
    setEditingCandidate(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      role: c.role || "",
      status: c.status,
      interviewDate: c.interviewDate ? new Date(c.interviewDate).toISOString().split('T')[0] : "",
      interviewTime: c.interviewTime || "",
      joiningDate: c.joiningDate ? new Date(c.joiningDate).toISOString().split('T')[0] : "",
    });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setError("");
    setEditingCandidate(null);
    setForm({ name: "", email: "", phone: "", role: "", status: "NEW", interviewDate: "", interviewTime: "", joiningDate: "" });
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
          {selectedIds.length > 0 && (
            <Button
              onClick={() => setBulkDeleteOpen(true)}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
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
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Role</Label>
                  <Input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="e.g. Web Developer"
                  />
                </div>
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
                  <Label className="text-white/70">Interview Date</Label>
                  <Input
                    type="date"
                    value={form.interviewDate}
                    onChange={(e) => setForm({ ...form, interviewDate: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Interview Time</Label>
                  <Input
                    type="time"
                    value={form.interviewTime}
                    onChange={(e) => setForm({ ...form, interviewTime: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Joining Date</Label>
                  <Input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
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
            placeholder="Search by name, email, phone, or role..."
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
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] max-h-[70vh] overflow-y-auto relative">
        {loading && candidates.length === 0 ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-10 w-10 rounded-lg bg-white/5 animate-pulse" />
                <div className="h-4 flex-1 bg-white/5 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/30">No candidates found</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-[#12121a]/95 backdrop-blur z-10 shadow-sm border-b border-white/5">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[40px] px-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/20 bg-white/5 accent-indigo-500 cursor-pointer"
                    checked={candidates.length > 0 && selectedIds.length === candidates.length}
                    onChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="text-white/40 font-medium">Name</TableHead>
                <TableHead className="text-white/40 font-medium hidden md:table-cell">Email</TableHead>
                <TableHead className="text-white/40 font-medium hidden lg:table-cell">Phone</TableHead>
                <TableHead className="text-white/40 font-medium">Role</TableHead>
                <TableHead className="text-white/40 font-medium">Status</TableHead>
                <TableHead className="text-white/40 font-medium hidden sm:table-cell">Interview</TableHead>
                <TableHead className="text-white/40 font-medium hidden sm:table-cell">Joining Date</TableHead>
                <TableHead className="text-white/40 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow
                  key={c.id}
                  className={`border-white/5 transition-colors ${
                    selectedIds.includes(c.id) ? "bg-indigo-500/10 hover:bg-indigo-500/20" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <TableCell className="px-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/20 bg-white/5 accent-indigo-500 cursor-pointer"
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleSelection(c.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white/80">
                            {c.name}
                          </p>
                          {c.interviewDate && (
                            <div 
                              className="flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-0.5 px-1.5 rounded-md gap-1" 
                              title={`Interview Scheduled: ${new Date(c.interviewDate).toLocaleDateString()} ${c.interviewTime || ''}`}
                            >
                              <CalendarCheck className="w-3 h-3" />
                              <span className="text-[10px] font-semibold">Scheduled</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-white/30 md:hidden">
                          {c.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/50 text-sm hidden md:table-cell">
                    {c.email}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-emerald-400 transition-colors group"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
                        {c.phone}
                      </a>
                    ) : (
                      <span className="text-white/50 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-white/70 text-sm">
                    {c.role || "—"}
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
                  <TableCell className="text-white/50 text-sm hidden sm:table-cell">
                    {c.interviewDate ? `${new Date(c.interviewDate).toLocaleDateString()} ${c.interviewTime || ''}` : "—"}
                  </TableCell>
                  <TableCell className="text-white/50 text-sm hidden sm:table-cell">
                    {c.joiningDate ? new Date(c.joiningDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {c.phone && (
                        <>
                          <a
                            href={`tel:${c.phone}`}
                            className="p-2 rounded-lg text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title={`Call ${c.name}`}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openWhatsAppModal(c)}
                            className="p-2 rounded-lg text-green-500/60 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                            title={`WhatsApp ${c.name}`}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEdit(c)}
                        className="p-2 rounded-lg text-white/30 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(c.id)}
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
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Delete Candidate
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-white/70 text-sm">
              Are you sure you want to delete this candidate? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="border-white/10 text-white hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Delete {selectedIds.length} Candidates
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-white/70 text-sm">
              Are you sure you want to delete {selectedIds.length} selected candidates? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setBulkDeleteOpen(false)}
                className="border-white/10 text-white hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDelete}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
              >
                Delete All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Message Dialog */}
      <Dialog open={!!whatsappCandidate} onOpenChange={(open) => !open && setWhatsappCandidate(null)}>
        <DialogContent className="bg-[#12121a] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Send WhatsApp Message
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70">Message to {whatsappCandidate?.name}</Label>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                placeholder="Type your message here..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setWhatsappCandidate(null)}
                className="border-white/10 text-white hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!whatsappCandidate?.phone) return;
                  const phone = whatsappCandidate.phone.replace(/[^0-9]/g, '');
                  const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
                  window.open(url, '_blank');
                  setWhatsappCandidate(null);
                }}
                className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
