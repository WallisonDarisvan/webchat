"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Check, Copy, QrCode, ShieldCheck, Zap, Sparkles, Clock } from "lucide-react";

interface PaymentCardProps {
  orderId: string;
  amount: number;
  pixCode: string;
  pixQrCodeUrl?: string;
  status: string;
  onSimulatePayment?: (orderId: string) => void;
}

export function PaymentCard({
  orderId,
  amount,
  pixCode,
  pixQrCodeUrl,
  status,
  onSimulatePayment,
}: PaymentCardProps) {
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy PIX code:", err);
    }
  };

  const handleSimulate = async () => {
    if (!onSimulatePayment || isSimulating) return;
    setIsSimulating(true);
    try {
      await onSimulatePayment(orderId);
    } finally {
      setIsSimulating(false);
    }
  };

  const isPaid = status === "paid";

  return (
    <div className="w-full max-w-sm sm:max-w-md my-3 bg-[#182229] border border-[#26353d] rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#111b21] to-[#182229] p-4 border-b border-[#26353d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase">
              Pagamento Imediato via PIX
            </span>
            <h3 className="text-sm font-semibold text-white">Liberação Instantânea</h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-[#8696a0] block">Valor Total</span>
          <span className="text-lg font-bold text-white tracking-tight">
            R$ {amount.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex flex-col items-center text-center">
        {/* QR Code Container */}
        <div className="relative p-3 bg-white rounded-xl shadow-inner mb-4">
          {pixQrCodeUrl ? (
            <img
              src={pixQrCodeUrl}
              alt="QR Code PIX para pagamento"
              className="w-44 h-44 object-contain"
            />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center bg-gray-100 text-gray-400">
              <QrCode className="w-16 h-16 animate-pulse" />
            </div>
          )}

          {isPaid && (
            <div className="absolute inset-0 bg-emerald-900/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-white p-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-2 shadow-lg">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <span className="text-sm font-bold">PAGAMENTO APROVADO!</span>
              <span className="text-xs text-emerald-200 mt-1">Acesso liberado no chat</span>
            </div>
          )}
        </div>

        {/* Copy Button */}
        <div className="w-full mb-3">
          <button
            onClick={handleCopy}
            disabled={isPaid}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-emerald-700/80 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-950/50"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Código PIX Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Código PIX Copia e Cola</span>
              </>
            )}
          </button>
        </div>

        {/* Status notice */}
        <div className="w-full p-2.5 rounded-xl bg-[#111b21] border border-[#222e35] flex items-center justify-center gap-2 text-xs">
          {isPaid ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Transação aprovada com sucesso!</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[#8696a0]">
                Aguardando PIX... <span className="text-amber-300">Liberação automática</span>
              </span>
            </>
          )}
        </div>

        {/* Quick sandbox simulation button for testing & demo */}
        {!isPaid && onSimulatePayment && (
          <div className="mt-3 w-full pt-3 border-t border-[#26353d]/60">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="text-[11px] text-[#8696a0] hover:text-emerald-400 flex items-center justify-center gap-1.5 w-full py-1.5 hover:bg-[#111b21] rounded-lg transition-colors border border-dashed border-[#26353d]"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSimulating ? "Confirmando..." : "Simular Pagamento Aprovado (Sandbox)"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-[#111b21] border-t border-[#222e35] flex items-center justify-center gap-2 text-[11px] text-[#8696a0]">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Ambiente seguro • Confirmação instantânea via webhook</span>
      </div>
    </div>
  );
}

