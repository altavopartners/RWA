// hooks/useBankData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { bankApi } from "../lib/api";
import type {
  Client,
  Dispute,
  Document,
  Escrow,
  BankOrder,
} from "../types/bank";

type Resource = "clients" | "disputes" | "documents" | "escrows" | "orders";

type ResourceMap = {
  clients: Client[];
  disputes: Dispute[];
  documents: import("../types/bank").BankDocument[];
  escrows: Escrow[];
  orders: BankOrder[];
};

export function useBankData<T extends Resource>(resource: T) {
  const [data, setData] = useState<ResourceMap[T]>([] as ResourceMap[T]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result: ResourceMap[T] = [] as ResourceMap[T];

      switch (resource) {
        case "clients":
          result = (await bankApi.getClients()) as ResourceMap[T];
          break;
        case "disputes":
          result = (await bankApi.getDisputes()) as ResourceMap[T];
          break;
        case "documents":
          result = (await bankApi.getDocuments()) as ResourceMap[T];
          break;
        case "escrows":
          result = (await bankApi.getEscrows()) as ResourceMap[T];
          break;
        case "orders":
          // Use workflow-enhanced orders to include buyerBankId/sellerBankId
          result = (await bankApi.getOrdersWithWorkflow()) as ResourceMap[T];
          break;
        default:
          throw new Error(`Unknown resource: ${resource}`);
      }

      setData(result);
    } catch (err: unknown) {
      console.error(`Error fetching ${resource}:`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  } as const;
}
