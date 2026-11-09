"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ShieldCheck, Zap, ArrowRight, UserCheck, Settings } from "lucide-react";

interface PublicAttendant {
  id: string;
  slug: string;
  name: string;
  avatar: string;
  bio: string;
  productName: string;
  productPrice: number;
}

export default function AttendantsLobbyPage() {
  const [attendants, setAttendants] = useState<PublicAttendant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendants")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.attendants)) {
          setAttendants(data.attendants);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar atendentes:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <header className="border-b border-[#222e35]/60 bg-[#111b21]/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950/40">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Central de Atendimento</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ao Vivo
              </span>
            </h1>
            <p className="text-xs text-[#8696a0]">
              Atendimento exclusivo e direto em tempo real
            </p>
          </div>
        </div>

        <Link
          href="/admin"
          className="p-2 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-xl transition-colors"
          title="Acessar Painel Administrativo"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#182229] border border-[#222e35] text-xs text-emerald-400 shadow-sm mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Selecione um atendente para conversar agora</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Com quem você gostaria de falar?
          </h2>
          <p className="text-sm sm:text-base text-[#8696a0] max-w-lg mx-auto">
            Nossos consultores oficiais estão online para tirar suas dúvidas e liberar o seu acesso com condições especiais.
          </p>
        </div>

        {/* Attendants Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 flex flex-col items-center animate-pulse space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-[#202c33]" />
                <div className="w-32 h-4 bg-[#202c33] rounded" />
                <div className="w-48 h-3 bg-[#202c33] rounded" />
                <div className="w-full h-10 bg-[#202c33] rounded-xl" />
              </div>
            ))}
          </div>
        ) : attendants.length === 0 ? (
          <div className="text-center py-12 bg-[#111b21] border border-[#222e35] rounded-2xl max-w-md mx-auto p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum atendente ativo no momento</h3>
            <p className="text-xs text-[#8696a0]">
              Acesse o painel administrativo para cadastrar ou ativar atendentes no sistema.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-emerald-950"
            >
              <span>Configurar no Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
            {attendants.map((attendant) => {
              const firstName = attendant.name.trim().split(/\s+/)[0] || attendant.name;
              return (
                <Link
                  key={attendant.id}
                  href={`/${attendant.slug}`}
                  className="group relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-[#222e35] hover:border-emerald-500/60 shadow-xl hover:shadow-2xl hover:shadow-emerald-950/40 transition-all duration-300 flex flex-col justify-between p-4 sm:p-5"
                >
                  {/* Foto de Fundo preenchendo todo o cartão */}
                  {attendant.avatar ? (
                    <img
                      src={attendant.avatar}
                      alt={attendant.name}
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-[#182229] to-[#111b21] flex items-center justify-center">
                      <span className="text-6xl font-bold text-emerald-400/30">
                        {attendant.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Gradientes para contraste e legibilidade perfeita */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />

                  {/* Topo: Status Online & Preço */}
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 text-[11px] font-medium shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online agora
                    </span>

                    {attendant.productPrice > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold shadow-md">
                        <span className="text-emerald-400">
                          R$ {Number(attendant.productPrice).toFixed(2).replace(".", ",")}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Base: Informações & Botão de Conversar */}
                  <div className="relative z-10 space-y-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 drop-shadow-md">
                        <span>{attendant.name}</span>
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      </h3>
                      {attendant.bio && (
                        <p className="text-xs text-white/80 line-clamp-1 drop-shadow-sm mt-0.5">
                          {attendant.bio}
                        </p>
                      )}
                      {attendant.productName && (
                        <p className="text-[11px] text-emerald-300 font-medium line-clamp-1 drop-shadow-sm">
                          {attendant.productName}
                        </p>
                      )}
                    </div>

                    {/* Botão Conversar com [NOME] */}
                    <div className="w-full py-2.5 sm:py-3 px-4 bg-emerald-600 group-hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/50">
                      <span>Conversar com {firstName}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222e35]/60 bg-[#111b21]/60 py-4 px-4 text-center text-xs text-[#8696a0] flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        <div className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Atendimento seguro e confidencial</span>
        </div>
        <span className="hidden sm:inline text-[#222e35]">•</span>
        <span>Respostas em tempo real</span>
      </footer>
    </div>
  );
}
