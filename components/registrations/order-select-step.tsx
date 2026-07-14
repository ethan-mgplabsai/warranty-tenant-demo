"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import type { CustomerOrder } from "@/app/api/demo/orders/route";
import { formatDate } from "@/lib/registration-status";

function OrderCard({ order, onSelect }: { order: CustomerOrder; onSelect: (order: CustomerOrder) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
      onClick={() => onSelect(order)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-foreground">Order #{order.orderNumber}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">{formatDate(order.orderedAt)}</div>
        </div>
        <div className="shrink-0 text-right text-sm text-muted-foreground">
          {order.lineItems.length} item{order.lineItems.length === 1 ? "" : "s"}
        </div>
      </div>

      <button
        type="button"
        className="mt-3 flex items-center gap-1 text-xs font-medium text-primary"
        onClick={(event) => {
          event.stopPropagation();
          setExpanded((value) => !value);
        }}
      >
        {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        {expanded ? "Hide items" : "View items"}
      </button>

      {expanded && (
        <div
          className="mt-2 space-y-1.5 border-t border-border pt-2"
          onClick={(event) => event.stopPropagation()}
        >
          {order.lineItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-foreground">{item.productTitle}</span>
              <span className="shrink-0 font-mono text-muted-foreground">{item.sku ?? "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderSelectStep({
  orders,
  onSelectOrder,
}: {
  orders: CustomerOrder[];
  onSelectOrder: (order: CustomerOrder) => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground">Select an order</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose the order with the product you want to register.
      </p>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No orders found for this account.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onSelect={onSelectOrder} />
          ))}
        </div>
      )}
    </div>
  );
}
