"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { debug } from "@/lib/debug";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, Eye } from "lucide-react";
import { useBankData } from "@/hooks/useBankData";
import { bankApi } from "@/lib/api";
import { BankHeader } from "@/components/bank-header";

type BankDocument = {
  id: string;
  filename: string;
  cid: string;
  url: string;
  category?: string;
  documentType?: string;
  status: "PENDING" | "VALIDATED" | "REJECTED";
  user: {
    id: string;
    fullName: string;
    email: string;
    userType: string;
  };
  order?: {
    id: string;
    code: string;
  };
  createdAt: string;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
};

const documentTypeLabels: Record<string, string> = {
  commercial_invoice: "Commercial Invoice",
  packing_list: "Packing List",
  bill_of_lading: "Bill of Lading",
  air_waybill: "Air Waybill",
  cmr: "CMR (Road Transport)",
  fcr: "FCR (Forwarder's Cargo Receipt)",
  insurance_policy: "Insurance Policy",
  certificate_of_origin: "Certificate of Origin",
  inspection_certificate: "Inspection Certificate",
  sanitary_certificate: "Sanitary Certificate",
  IDENTITY: "Identity Document",
  RESIDENCY: "Proof of Residency",
  BANK: "Bank Statement",
  INCOME: "Proof of Income",
};

const categoryLabels: Record<string, string> = {
  commercial: "Commercial",
  transport: "Transport",
  insurance: "Insurance",
  origin_control: "Origin & Control",
  other: "Other",
};

export default function DocumentsPage() {
  const {
    data: documents = [],
    loading,
    error,
    refetch,
  } = useBankData("documents");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "PENDING" | "VALIDATED" | "REJECTED"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [bulkBusyOrder, setBulkBusyOrder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [roleTab, setRoleTab] = useState<Record<string, "seller" | "buyer">>(
    {}
  );
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});

  const filteredDocuments = documents.filter((doc) => {
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType = typeFilter === "all" || doc.documentType === typeFilter;
    const matchesCategory =
      categoryFilter === "all" || doc.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      [
        doc.filename,
        doc.cid,
        doc.user?.fullName,
        doc.order?.code,
        doc.order?.id,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    const matchesPending = !pendingOnly || doc.status === "PENDING";
    return (
      matchesStatus &&
      matchesType &&
      matchesCategory &&
      matchesSearch &&
      matchesPending
    );
  });

  const uniqueTypes = Array.from(
    new Set(
      documents
        .map((d) => d.documentType)
        .filter((t): t is string => Boolean(t))
    )
  );
  const uniqueCategories = Array.from(
    new Set(
      documents.map((d) => d.category).filter((c): c is string => Boolean(c))
    )
  );

  if (loading) return <div className="p-6">Loading documents...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  // Group by order and split by role (Buyer vs Seller/Producer)
  const groups = (() => {
    const map = new Map<
      string,
      {
        orderId: string;
        orderCode: string;
        buyerDocs: BankDocument[];
        sellerDocs: BankDocument[];
      }
    >();
    for (const d of filteredDocuments) {
      const key = d.order?.id || "__no_order__";
      const bucket = map.get(key) || {
        orderId: key,
        orderCode: d.order?.code || key,
        buyerDocs: [],
        sellerDocs: [],
      };
      const role = (d.user?.userType || "").toUpperCase();
      if (role === "BUYER") bucket.buyerDocs.push(d);
      else bucket.sellerDocs.push(d); // treat PRODUCER/ADMIN/USER as seller-side for this view
      map.set(key, bucket);
    }
    return Array.from(map.values());
  })();

  const toggleExpand = (orderId: string, value?: boolean) =>
    setExpanded((prev) => ({ ...prev, [orderId]: value ?? !prev[orderId] }));

  const setAllExpanded = (value: boolean) => {
    const next: Record<string, boolean> = {};
    for (const g of groups) next[g.orderId] = value;
    setExpanded(next);
  };

  async function bulkUpdate(
    orderId: string,
    docs: BankDocument[],
    action: "approve" | "reject"
  ) {
    const pending = docs.filter((d) => d.status === "PENDING");
    if (!pending.length) return;

    const reviewer =
      window.prompt("Reviewed by:", "Bank Officer") || "Bank Officer";
    let reason: string | undefined = undefined;
    if (action === "reject") {
      reason =
        window.prompt(
          "Rejection reason (required):",
          "Missing/incorrect data"
        ) || "";
      if (!reason) return;
    }

    try {
      setBulkBusyOrder(orderId);
      for (const doc of pending) {
        await bankApi.updateDocument(doc.id, {
          status: action,
          validatedBy: reviewer,
          rejectionReason: action === "reject" ? reason : undefined,
        });
      }
      await refetch();
    } finally {
      setBulkBusyOrder(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <BankHeader
        title="Documents Validation"
        description="Review and validate trade documents stored on IPFS"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as typeof statusFilter)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VALIDATED">Validated</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {categoryLabels[cat] || cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {documentTypeLabels[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search filename, CID, user, order..."
          className="flex-1 min-w-[220px] px-3 py-2 border rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Pending only toggle */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
          />
          Pending only
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{documents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {documents.filter((d) => d.status === "PENDING").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {documents.filter((d) => d.status === "VALIDATED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {documents.filter((d) => d.status === "REJECTED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grouped by order */}
      <div className="flex items-center justify-between py-2">
        <div className="text-sm text-muted-foreground">
          Showing {filteredDocuments.length} document(s) across {groups.length}{" "}
          order(s)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAllExpanded(true)}
          >
            Expand all
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAllExpanded(false)}
          >
            Collapse all
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((g) => {
          const total = g.buyerDocs.length + g.sellerDocs.length;
          const pending = g.buyerDocs
            .concat(g.sellerDocs)
            .filter((d) => d.status === "PENDING").length;
          const validated = g.buyerDocs
            .concat(g.sellerDocs)
            .filter((d) => d.status === "VALIDATED").length;
          const rejected = total - pending - validated;
          const isOpen = expanded[g.orderId] ?? false;
          const currentRole = roleTab[g.orderId] ?? "seller";
          return (
            <Card key={g.orderId} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      Order {g.orderCode}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">Total: {total}</Badge>
                      <Badge
                        variant="secondary"
                        className="bg-yellow-500/20 text-yellow-700"
                      >
                        Pending: {pending}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-green-700"
                      >
                        Validated: {validated}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-red-500/20 text-red-700"
                      >
                        Rejected: {rejected}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex rounded-md border overflow-hidden">
                      <button
                        className={`px-3 py-1 text-sm ${
                          currentRole === "seller"
                            ? "bg-muted"
                            : "bg-transparent"
                        }`}
                        onClick={() =>
                          setRoleTab((p) => ({ ...p, [g.orderId]: "seller" }))
                        }
                      >
                        Seller
                      </button>
                      <button
                        className={`px-3 py-1 text-sm ${
                          currentRole === "buyer"
                            ? "bg-muted"
                            : "bg-transparent"
                        }`}
                        onClick={() =>
                          setRoleTab((p) => ({ ...p, [g.orderId]: "buyer" }))
                        }
                      >
                        Buyer
                      </button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkBusyOrder === g.orderId || pending === 0}
                      onClick={() =>
                        bulkUpdate(
                          g.orderId,
                          g.buyerDocs.concat(g.sellerDocs),
                          "approve"
                        )
                      }
                    >
                      Approve all pending
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkBusyOrder === g.orderId || pending === 0}
                      onClick={() =>
                        bulkUpdate(
                          g.orderId,
                          g.buyerDocs.concat(g.sellerDocs),
                          "reject"
                        )
                      }
                    >
                      Reject all pending
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleExpand(g.orderId)}
                    >
                      {isOpen ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent>
                  {(() => {
                    const docs =
                      (currentRole === "seller" ? g.sellerDocs : g.buyerDocs) ||
                      [];
                    const key = `${g.orderId}:${currentRole}`;
                    const isShowAll = showAll[key] ?? false;
                    const visible = isShowAll ? docs : docs.slice(0, 3);
                    return (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          {currentRole === "seller"
                            ? "Seller Documents"
                            : "Buyer Documents"}
                        </h4>
                        <div className="space-y-3">
                          {docs.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No documents from {currentRole}.
                            </p>
                          )}
                          {visible.map((doc) => (
                            <Card key={doc.id} className="hover:shadow-sm">
                              <CardContent className="pt-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div
                                      className="text-sm font-medium truncate"
                                      title={doc.filename}
                                    >
                                      {doc.filename}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {documentTypeLabels[
                                        doc.documentType || ""
                                      ] ||
                                        doc.documentType ||
                                        "Unknown"}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      doc.status === "VALIDATED"
                                        ? "default"
                                        : doc.status === "REJECTED"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="shrink-0"
                                  >
                                    {doc.status}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() =>
                                      window.open(doc.url, "_blank")
                                    }
                                  >
                                    <Eye className="w-4 h-4 mr-1" /> View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href = doc.url;
                                      link.download = doc.filename;
                                      link.click();
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                                {doc.status === "PENDING" && (
                                  <DocumentValidationDialog
                                    document={doc}
                                    onSuccess={refetch}
                                  />
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          {docs.length > 3 && (
                            <div className="pt-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setShowAll((p) => ({
                                    ...p,
                                    [key]: !isShowAll,
                                  }))
                                }
                              >
                                {isShowAll
                                  ? `Show less`
                                  : `Show all (${docs.length})`}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DocumentValidationDialog({
  document,
  onSuccess,
}: {
  document: BankDocument;
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<"" | "approve" | "reject">("");
  const [comments, setComments] = useState("");
  const [validatedBy, setValidatedBy] = useState("Bank Officer");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!action) return;

    setSubmitting(true);
    try {
      await bankApi.updateDocument(document.id, {
        status: action,
        validatedBy,
        rejectionReason: action === "reject" ? comments : undefined,
      });

      setIsOpen(false);
      setAction("");
      setComments("");
      onSuccess();
    } catch (err) {
      debug.error("Failed to update document:", err);
      alert("Failed to update document. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full">
          Review Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Document</DialogTitle>
          <DialogDescription>
            Choose an action for{" "}
            <span className="font-medium">{document.filename}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Action</label>
            <Select
              value={action}
              onValueChange={(value) => setAction(value as typeof action)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve / Validate</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Reviewed By
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={validatedBy}
              onChange={(e) => setValidatedBy(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {action === "reject"
                ? "Rejection Reason (required)"
                : "Comments (optional)"}
            </label>
            <Textarea
              placeholder={
                action === "reject"
                  ? "Explain why this document is rejected"
                  : "Add any notes"
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !action ||
              !validatedBy ||
              (action === "reject" && !comments) ||
              submitting
            }
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
