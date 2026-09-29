// src/components/ImportTransactionsModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { ALL_CATEGORIES } from '../types/index.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportTransactionsModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { apiFetch } = useAuth();
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; count?: number; error?: string } | null>(null);

  if (!isOpen) return null;

  const sampleCSV = `Title,Amount,Type,Category,Date,Notes,PaymentMethod
Cafeteria Lunch,120.00,expense,Food,2026-09-24,Lunch with friends,UPI
Stipend Received,15000.00,income,Other,2026-09-20,Monthly funds,Bank Transfer
Semester Textbooks,850.00,expense,Education,2026-09-22,Library bookstore,UPI
Metro Smart Card,500.00,expense,Transport,2026-09-21,Card recharge,UPI`;

  const handleParseAndUpload = async () => {
    if (!csvText.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        setResult({ error: 'Please include header row and at least one transaction row.' });
        setLoading(false);
        return;
      }

      const parsedItems = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim());

        // Basic mapping
        const title = cols[0] || 'Imported Entry';
        const amount = Math.abs(parseFloat(cols[1]) || 0);
        const type = cols[2]?.toLowerCase() === 'income' ? 'income' : 'expense';
        let category = cols[3] || 'Other';
        if (!ALL_CATEGORIES.includes(category as any)) {
          category = 'Other';
        }
        const date = cols[4] || new Date().toISOString().slice(0, 10);
        const notes = cols[5] || 'CSV Import';
        const paymentMethod = cols[6] || 'UPI / Online';

        if (amount > 0) {
          parsedItems.push({ title, amount, type, category, date, notes, paymentMethod });
        }
      }

      if (parsedItems.length === 0) {
        setResult({ error: 'No valid transactions found in input.' });
        setLoading(false);
        return;
      }

      const res = await apiFetch('/api/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ items: parsedItems }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult({ success: true, count: data.count });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        const err = await res.json();
        setResult({ error: err.error || 'Failed to import transactions' });
      }
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-lg w-full p-6 border border-slate-100 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <UploadCloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import CSV Transactions</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Paste CSV formatted records: Title, Amount, Type (income/expense), Category, Date (YYYY-MM-DD), Notes, PaymentMethod.
        </p>

        {result?.error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{result.error}</span>
          </div>
        )}

        {result?.success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Successfully imported {result.count} transactions! Refreshing...</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">CSV Data:</span>
            <button
              type="button"
              onClick={() => setCsvText(sampleCSV)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Load Sample Template
            </button>
          </div>

          <textarea
            rows={7}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV rows here..."
            className="w-full font-mono text-xs p-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleParseAndUpload}
              disabled={loading || !csvText.trim()}
              className="btn-primary px-5 py-2 text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Parse & Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
