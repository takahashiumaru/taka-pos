"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { Transaction } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function Receipt({ transaction }: { transaction: Transaction }) {
  const products = useStore((s) => s.products);
  const customers = useStore((s) => s.customers);
  const settings = useStore((s) => s.settings);

  const customer = transaction.customerId
    ? customers.find((c) => c.id === transaction.customerId)
    : undefined;

  return (
    <div
      className="receipt-print mx-auto w-full max-w-[320px] bg-white p-4 font-mono text-[12px] leading-tight text-black"
      data-receipt
    >
      <div className="text-center">
        <p className="text-base font-semibold">{settings.storeName}</p>
        <p className="text-[11px]">{settings.address}</p>
        <p className="text-[11px]">Tel: {settings.phone}</p>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>No.</span>
          <span>{transaction.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal</span>
          <span>{formatDateTime(transaction.createdAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir</span>
          <span>{transaction.cashierName || transaction.cashierId}</span>
        </div>
        {customer ? (
          <div className="flex justify-between">
            <span>Pelanggan</span>
            <span>{customer.name}</span>
          </div>
        ) : null}
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="space-y-1">
        {transaction.items.map((it) => {
          const p = products.find((x) => x.id === it.productId);
          const sub = (it.price - (it.discount || 0)) * it.qty;
          return (
            <div key={it.productId}>
              <p className="font-medium">{p?.name || it.productId}</p>
              <div className="flex justify-between">
                <span>
                  {it.qty} x {formatCurrency(it.price - (it.discount || 0))}
                </span>
                <span className="tabular-nums">{formatCurrency(sub)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {formatCurrency(transaction.subtotal)}
          </span>
        </div>
        {transaction.discount > 0 ? (
          <div className="flex justify-between">
            <span>Diskon</span>
            <span className="tabular-nums">
              -{formatCurrency(transaction.discount)}
            </span>
          </div>
        ) : null}
        {transaction.tax > 0 ? (
          <div className="flex justify-between">
            <span>Pajak ({settings.taxRate}%)</span>
            <span className="tabular-nums">
              {formatCurrency(transaction.tax)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL</span>
          <span className="tabular-nums">
            {formatCurrency(transaction.total)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Bayar ({transaction.method.toUpperCase()})</span>
          <span className="tabular-nums">
            {formatCurrency(transaction.paid)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kembali</span>
          <span className="tabular-nums">
            {formatCurrency(transaction.change)}
          </span>
        </div>
      </div>
      <div className="my-2 border-t border-dashed border-black" />
      <div className="text-center text-[11px]">
        <p>{settings.receiptFooter}</p>
        <p className="mt-1">— {transaction.id} —</p>
      </div>
    </div>
  );
}
