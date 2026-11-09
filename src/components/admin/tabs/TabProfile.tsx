"use client";

import React from "react";
import { User, Upload, Trash2 } from "lucide-react";
import { AdminConfig } from "../types";

interface TabProfileProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  appUrl: string;
  onUploadAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingAvatar: boolean;
  avatarFileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function TabProfile({
  config,
  setConfig,
  appUrl,
  onUploadAvatar,
  isUploadingAvatar,
  avatarFileInputRef,
}: TabProfileProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-[#222e35] pb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <span>Perfil & Identidade do Atendente</span>
          </h2>
          <p className="text-xs text-[#8696a0] mt-1">
            Configure o nome, link direto de atendimento, biografia e foto de perfil deste atendente.
          </p>
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Nome do Atendente
            </label>
            <input
              type="text"
              value={config.agentName}
              onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
              placeholder="Ex: Gabriel Siqueira"
              className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
            />
            <p className="text-[11px] text-[#8696a0] mt-1">
              Nome visível para os clientes na conversa e no lobby.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Slug da URL (Link Direto)
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-[#182229] border border-r-0 border-[#26353d] rounded-l-xl text-xs text-[#8696a0] font-mono">
                {"/"}
              </span>
              <input
                type="text"
                value={config.slug || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_-]/g, "-"),
                  })
                }
                placeholder="gabriel"
                className="w-full px-3 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-r-xl text-xs sm:text-sm text-white font-mono outline-none"
              />
            </div>
            <p className="text-[11px] text-[#8696a0] mt-1">
              Define a URL direta: <code className="text-emerald-400 font-mono">{`${appUrl}/${config.slug || "gabriel"}`}</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Bio / Especialidade (Exibido no Lobby Inicial)
            </label>
            <input
              type="text"
              value={config.bio || ""}
              onChange={(e) => setConfig({ ...config, bio: e.target.value })}
              placeholder="Ex: Especialista em Vendas e Suporte VIP"
              className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
            />
            <p className="text-[11px] text-[#8696a0] mt-1">
              Breve descrição ou cargo que aparece no cartão do atendente.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-4 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.isActive !== false}
                onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#202c33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
            <div>
              <span className="text-xs font-semibold text-white block">
                Exibir na Página Inicial (Lobby)
              </span>
              <span className="text-[11px] text-[#8696a0]">
                Se desativado, o atendente só pode ser acessado pelo link direto.
              </span>
            </div>
          </div>

          {/* Opções de Exibição no Cartão do Lobby */}
          <div className="col-span-1 sm:col-span-2 pt-4 border-t border-[#222e35]/60 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white">
                Elementos Visíveis no Cartão (Lobby)
              </label>
              <p className="text-[11px] text-[#8696a0] mt-0.5">
                Escolha quais informações aparecem sobrepostas na foto do atendente na página inicial.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Exibir Bio */}
              <div className="flex items-center gap-3 p-3 bg-[#182229] border border-[#26353d] rounded-xl">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.showBio !== false}
                    onChange={(e) => setConfig({ ...config, showBio: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#202c33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <div>
                  <span className="text-xs font-medium text-white block">Exibir Bio</span>
                  <span className="text-[10px] text-[#8696a0]">Descrição/cargo</span>
                </div>
              </div>

              {/* Exibir Nome do Produto */}
              <div className="flex items-center gap-3 p-3 bg-[#182229] border border-[#26353d] rounded-xl">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.showProductName !== false}
                    onChange={(e) => setConfig({ ...config, showProductName: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#202c33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <div>
                  <span className="text-xs font-medium text-white block">Exibir Nome do Produto</span>
                  <span className="text-[10px] text-[#8696a0]">Título do produto</span>
                </div>
              </div>

              {/* Exibir Preço do Produto */}
              <div className="flex items-center gap-3 p-3 bg-[#182229] border border-[#26353d] rounded-xl">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.showProductPrice !== false}
                    onChange={(e) => setConfig({ ...config, showProductPrice: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#202c33] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <div>
                  <span className="text-xs font-medium text-white block">Exibir Preço</span>
                  <span className="text-[10px] text-[#8696a0]">Valor no topo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Foto da Atendente */}
        <div className="pt-5 border-t border-[#222e35] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#182229] p-4 rounded-xl border border-[#26353d]">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#202c33] border-2 border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
              {config.agentAvatar ? (
                <img
                  src={config.agentAvatar}
                  alt="Foto da Atendente"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base font-bold text-emerald-400">
                  {config.agentName
                    ? config.agentName
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((s) => s[0])
                        .join("")
                        .toUpperCase()
                    : "AT"}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white">
                Foto da Atendente (Avatar de Perfil)
              </label>
              <p className="text-[11px] text-[#8696a0] mt-0.5">
                Essa foto aparecerá no cabeçalho, nas mensagens e no indicador de digitação do chat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              onChange={onUploadAvatar}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => avatarFileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50 shadow-md shadow-emerald-950"
            >
              {isUploadingAvatar ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{config.agentAvatar ? "Trocar Foto" : "Fazer Upload da Foto"}</span>
            </button>

            {config.agentAvatar && (
              <button
                type="button"
                onClick={() => setConfig({ ...config, agentAvatar: "" })}
                className="p-2.5 text-[#8696a0] hover:text-red-400 hover:bg-[#202c33] rounded-xl transition-colors text-xs"
                title="Remover foto (usar iniciais)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

