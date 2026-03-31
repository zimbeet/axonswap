"use client";

import { useState, useEffect, useCallback } from "react";

export type TxStatus = "pending" | "confirmed" | "failed";

export interface TxRecord {
  hash: string;
  type: string;
  description: string;
  status: TxStatus;
  timestamp: number;
}

const STORAGE_KEY = "axonswap_tx_history";
const MAX_RECORDS = 20;

function loadFromStorage(): TxRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TxRecord[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(records: TxRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage errors
  }
}

export function useTransactionHistory() {
  const [records, setRecords] = useState<TxRecord[]>([]);

  useEffect(() => {
    setRecords(loadFromStorage());
  }, []);

  const addRecord = useCallback((record: Omit<TxRecord, "timestamp">) => {
    setRecords((prev) => {
      const updated = [
        { ...record, timestamp: Date.now() },
        ...prev,
      ].slice(0, MAX_RECORDS);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateStatus = useCallback((hash: string, status: TxStatus) => {
    setRecords((prev) => {
      const updated = prev.map((r) =>
        r.hash === hash ? { ...r, status } : r
      );
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    setRecords([]);
    saveToStorage([]);
  }, []);

  return { records, addRecord, updateStatus, clear };
}
