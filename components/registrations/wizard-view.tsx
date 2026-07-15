"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiConsole } from "@/components/registrations/api-console";
import { ConfirmStep } from "@/components/registrations/confirm-step";
import { ItemSelectStep } from "@/components/registrations/item-select-step";
import { OrderSelectStep } from "@/components/registrations/order-select-step";
import { OtpGate } from "@/components/registrations/otp-gate";
import { SuccessStep } from "@/components/registrations/success-step";
import { WizardSteps } from "@/components/registrations/wizard-steps";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerOrder, CustomerOrderLineItem } from "@/app/api/demo/orders/route";
import type { CustomerRegistration } from "@/app/api/demo/registrations/route";
import type { NarrationEntry } from "@/lib/warrantini-client";

type Phase = "checking" | "otp-gate" | "orders" | "items" | "confirm" | "success";

export function WizardView() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [selectedItem, setSelectedItem] = useState<CustomerOrderLineItem | null>(null);
  const [registration, setRegistration] = useState<CustomerRegistration | null>(null);
  const [narrationLog, setNarrationLog] = useState<NarrationEntry[]>([]);

  const addNarration = useCallback((entry: NarrationEntry) => {
    setNarrationLog((log) => [...log, entry]);
  }, []);

  const [reloadToken, setReloadToken] = useState(0);
  const reloadOrders = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function loadOrders() {
      const response = await fetch("/api/demo/orders");
      const data = await response.json();
      if (cancelled) return;
      if (data.narration) addNarration(data.narration);
      if (response.status === 401) {
        setPhase("otp-gate");
        return;
      }
      setOrders(data.data ?? []);
      setPhase("orders");
    }
    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [addNarration, reloadToken]);

  const stepNumber = phase === "orders" ? 1 : phase === "items" ? 2 : phase === "confirm" ? 3 : 4;

  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">Register a Product</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activate warranty coverage for a recent purchase.
          </p>
        </div>

        {(phase === "orders" || phase === "items" || phase === "confirm") && (
          <WizardSteps steps={["Select Order", "Select Item", "Confirm"]} currentStep={stepNumber} />
        )}

        {phase === "checking" && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {phase === "otp-gate" && <OtpGate onNarration={addNarration} onVerified={reloadOrders} />}

        {phase === "orders" && (
          <OrderSelectStep
            orders={orders}
            onSelectOrder={(order) => {
              setSelectedOrder(order);
              setPhase("items");
            }}
          />
        )}

        {phase === "items" && selectedOrder && (
          <ItemSelectStep
            order={selectedOrder}
            onSelectItem={(item) => {
              setSelectedItem(item);
              setPhase("confirm");
            }}
            onBack={() => setPhase("orders")}
          />
        )}

        {phase === "confirm" && selectedOrder && selectedItem && (
          <ConfirmStep
            order={selectedOrder}
            lineItem={selectedItem}
            onBack={() => setPhase("items")}
            onNarration={addNarration}
            onSubmitted={(result) => {
              setRegistration(result);
              setPhase("success");
            }}
          />
        )}

        {phase === "success" && registration && (
          <SuccessStep
            registration={registration}
            onRegisterAnother={() => {
              setSelectedOrder(null);
              setSelectedItem(null);
              setRegistration(null);
              setPhase("checking");
              reloadOrders();
            }}
          />
        )}
      </div>

      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <ApiConsole entries={narrationLog} />
      </div>
    </div>
  );
}
