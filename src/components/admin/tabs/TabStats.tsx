"use client";

import React from "react";
import { StatsData } from "../types";

interface TabStatsProps {
  statsData: StatsData | null;
}

export function TabStats({ statsData }: TabStatsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#111b21] border border-[#222e35] rounded-2xl shadow-md">
          <span className="text-xs text-[#8696a0]">Total de Conversas</span>
          <p className="text-2xl font-bold text-white mt-1">
            {statsData?.stats.totalSessions ?? 0}
          </p>
        </div>

        <div className="p-5 bg-[#111b21] border border-[#222e35] rounded-2xl shadow-md">
          <span className="text-xs text-[#8696a0]">Mensagens Trocadas</span>
          <p className="text-2xl font-bold text-white mt-1">
            {statsData?.stats.totalMessages ?? 0}
          </p>
        </div>

        <div className="p-5 bg-[#111b21] border border-[#222e35] rounded-2xl shadow-md">
          <span className="text-xs text-[#8696a0]">Pedidos Pagos</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {statsData?.stats.paidOrdersCount ?? 0}
            <span className="text-xs text-[#8696a0] font-normal ml-1">
              / {statsData?.stats.totalOrders ?? 0} gerados
            </span>
          </p>
        </div>

        <div className="p-5 bg-[#111b21] border border-[#222e35] rounded-2xl shadow-md">
          <span className="text-xs text-[#8696a0]">Faturamento Confirmado</span>
          <p className="text-2xl font-bold text-white mt-1">
            R$ {(statsData?.stats.totalRevenue ?? 0).toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>

      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-white mb-4">
          Últimas Transações & Pedidos PIX
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#182229] text-[#8696a0] uppercase border-b border-[#222e35]">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">IP / Auditoria</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
                <th className="p-3">Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222e35]">
              {statsData?.recentOrders && statsData.recentOrders.length > 0 ? (
                statsData.recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#182229]/50">
                    <td className="p-3 whitespace-nowrap text-[#8696a0]">
                      {new Date(ord.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 font-medium text-white">
                      {ord.session.userName}
                    </td>
                    <td className="p-3 text-[#8696a0] font-mono">
                      {ord.session.lastIp || "127.0.0.1"}
                    </td>
                    <td className="p-3 font-semibold text-white">
                      R$ {ord.amount.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          ord.status === "paid"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {ord.status === "paid" ? "Pago" : "Pendente"}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate text-[#8696a0]">
                      {ord.status === "paid" ? (
                        <span className="text-emerald-400 font-mono text-[11px]">
                          {ord.deliveryLink}
                        </span>
                      ) : (
                        <span className="text-[#8696a0]/60 italic">
                          Retido até pagamento
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#8696a0]">
                    Nenhum pedido registrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

