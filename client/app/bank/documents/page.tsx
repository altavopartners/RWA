"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

type Document = {
  id: string;
  name: string;
  type: keyof typeof documentTypes;
  status: "Pending" | "Validated" | "Rejected";
  url: string;
};

const documentTypes = {
  IDENTITY: "Identity Document",
  RESIDENCY: "Proof of Residency",
  BANK: "Bank Statement",
  INCOME: "Proof of Income",
};

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "passport.pdf",
    type: "IDENTITY",
    status: "Pending",
    url: "#",
  },
  {
    id: "2",
    name: "bill.pdf",
    type: "RESIDENCY",
    status: "Validated",
    url: "#",
  },
  {
    id: "3",
    name: "statement.pdf",
    type: "BANK",
    status: "Rejected",
    url: "#",
  },
];

export default function DocumentsPage() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "validated" | "rejected"
  >("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | keyof typeof documentTypes
  >("all");

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesStatus =
      statusFilter === "all" ||
      doc.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    return matchesStatus && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Documents Validation</h1>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(
              value as "all" | "pending" | "validated" | "rejected"
            )
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(value) =>
            setTypeFilter(value as "all" | keyof typeof documentTypes)
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(documentTypes).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{doc.name}</CardTitle>
              <Badge
                variant={
                  doc.status === "Validated"
                    ? "default"
                    : doc.status === "Rejected"
                    ? "destructive"
                    : "secondary"
                }
              >
                {doc.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                Type: {documentTypes[doc.type]}
              </p>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                View Document
              </a>
              {doc.status === "Pending" && (
                <DocumentValidationDialog document={doc} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DocumentValidationDialog({ document }: { document: Document }) {
  const [action, setAction] = useState<"" | "validate" | "reject">("");
  const [comments, setComments] = useState("");

  const handleSubmit = () => {
    console.log("Document:", document.id);
    console.log("Action:", action);
    console.log("Comments:", comments);
    setAction("");
    setComments("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Validate</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Validate Document</DialogTitle>
          <DialogDescription>
            Choose an action for{" "}
            <span className="font-medium">{document.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <Select
          value={action}
          onValueChange={(value) =>
            setAction(value as "" | "validate" | "reject")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="validate">Validate</SelectItem>
            <SelectItem value="reject">Reject</SelectItem>
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Add comments (optional)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!action}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
