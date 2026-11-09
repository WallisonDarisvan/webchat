"use client";

import React from "react";
import {
  ShieldAlert,
  Plus,
  Upload,
  Sparkles,
  Eye,
  Image as ImageIcon,
  Check,
  Copy,
  Trash2,
} from "lucide-react";
import { AdminConfig } from "../types";
import { MediaItem } from "@/lib/config";

interface TabMediaProps {
  config: AdminConfig;
  setConfig: React.Dispatch<React.SetStateAction<AdminConfig>>;
  mediaList: MediaItem[];
  newMediaTitle: string;
  setNewMediaTitle: (val: string) => void;
  newMediaId: string;
  setNewMediaId: (val: string) => void;
  newMediaUrl: string;
  setNewMediaUrl: (val: string) => void;
  newMediaTrigger: string;
  setNewMediaTrigger: (val: string) => void;
  newMediaViewOnce: boolean;
  setNewMediaViewOnce: (val: boolean) => void;
  isUploadingMedia: boolean;
  onUploadMediaFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mediaFileInputRef: React.RefObject<HTMLInputElement | null>;
  onAddMedia: () => void;
  onDeleteMedia: (id: string) => void;
  onToggleMediaViewOnce: (id: string) => void;
  onCopyTag: (tag: string) => void;
  mediaTagCopied: string | null;
  onTitleChange: (val: string) => void;
  slugify: (text: string) => string;
}

export function TabMedia({
  config,
  setConfig,
  mediaList,
  newMediaTitle,
  newMediaId,
  setNewMediaId,
  newMediaUrl,
  setNewMediaUrl,
  newMediaTrigger,
  setNewMediaTrigger,
  newMediaViewOnce,
  setNewMediaViewOnce,
  isUploadingMedia,
  onUploadMediaFile,
  mediaFileInputRef,
  onAddMedia,
  onDeleteMedia,
  onToggleMediaViewOnce,
  onCopyTag,
  mediaTagCopied,
  onTitleChange,
  slugify,
}: TabMediaProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Max Agent Photos Limit Card */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Limite de Fotos que a IA Pode Enviar por Atendimento</span>
          </label>
          <p className="text-[11px] text-[#8696a0] mt-0.5">
            Quantidade máxima de fotos/amostras que a IA tem permissão de disparar para o mesmo cliente. Ao atingir essa cota, o servidor bloqueia sumariamente qualquer novo disparo de mídia.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            min={0}
            max={20}
            value={config.maxAgentPhotos}
            onChange={(e) =>
              setConfig({
                ...config,
                maxAgentPhotos: Math.max(0, parseInt(e.target.value) || 0),
              })
            }
            className="w-24 px-3 py-2 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-center text-sm font-bold text-white outline-none"
          />
          <span className="text-xs text-[#8696a0]">fotos</span>
        </div>
      </div>

      {/* Add New Media Form */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="border-b border-[#222e35] pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Cadastrar Nova Mídia com Instrução</span>
          </h3>
          <p className="text-xs text-[#8696a0] mt-0.5">
            Adicione uma foto e diga exatamente em qual momento a IA deve enviá-la para o cliente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              Título da Mídia
            </label>
            <input
              type="text"
              value={newMediaTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ex: Print de Faturamento Aluno 10k"
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              Identificador (ID do Gatilho)
            </label>
            <input
              type="text"
              value={newMediaId}
              onChange={(e) => setNewMediaId(slugify(e.target.value))}
              placeholder="Ex: print-faturamento-aluno"
              className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white font-mono outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[#8696a0] mb-1">
              Imagem da Mídia
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                placeholder="Cole a URL direta da imagem ou clique em Enviar Foto..."
                className="flex-1 px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none font-mono"
              />

              <input
                ref={mediaFileInputRef}
                type="file"
                accept="image/*"
                onChange={onUploadMediaFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => mediaFileInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#202c33] hover:bg-[#26353d] border border-[#26353d] text-white rounded-xl text-xs font-medium transition-colors shrink-0 disabled:opacity-50"
              >
                {isUploadingMedia ? (
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fazer Upload</span>
                  </>
                )}
              </button>
            </div>

            {newMediaUrl && (
              <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-[#26353d] bg-black/40">
                <img src={newMediaUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instrução de Disparo para a IA (Quando enviar?)</span>
            </label>
            <input
              type="text"
              value={newMediaTrigger}
              onChange={(e) => setNewMediaTrigger(e.target.value)}
              placeholder="Ex: Envie quando o cliente perguntar se o método realmente dá resultados ou pedir provas reais."
              className="w-full px-4 py-2.5 bg-[#202c33] border border-emerald-500/40 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
            />
            <span className="text-[11px] text-[#8696a0] mt-1 block">
              A IA lerá essa instrução e incluirá a tag de disparo no momento certo da conversa.
            </span>
          </div>

          {/* View Once Checkbox */}
          <div className="md:col-span-2 p-3 bg-[#182229] border border-[#26353d] rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newMediaViewOnce}
                onChange={(e) => setNewMediaViewOnce(e.target.checked)}
                className="w-4 h-4 rounded bg-[#202c33] border-[#26353d] text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ativar Visualização Única (1x)</span>
                </div>
                <p className="text-[11px] text-[#8696a0] mt-0.5">
                  O cliente só poderá abrir e visualizar esta foto uma única vez no chat. Após fechar, a foto expira permanentemente (estilo WhatsApp).
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onAddMedia}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Mídia ao Catálogo</span>
          </button>
        </div>
      </div>

      {/* Registered Media List */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222e35] pb-3">
          <h3 className="text-sm font-semibold text-white">
            Mídias Cadastradas ({mediaList.length})
          </h3>
          <span className="text-xs text-[#8696a0]">
            Lembre-se de clicar em <strong>Salvar Alterações</strong> no topo para persistir.
          </span>
        </div>

        {mediaList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8696a0] border border-dashed border-[#222e35] rounded-xl">
            <ImageIcon className="w-8 h-8 text-[#8696a0]/40 mx-auto mb-2" />
            <p>Nenhuma mídia cadastrada ainda.</p>
            <p className="mt-1">
              Cadastre uma foto acima para a IA poder ilustrar suas conversas de vendas!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaList.map((media) => (
              <div
                key={media.id}
                className="p-4 bg-[#182229] border border-[#222e35] rounded-xl flex gap-3.5 relative overflow-hidden group hover:border-[#26353d] transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/40 border border-[#26353d] shrink-0">
                  <img
                    src={media.url}
                    alt={media.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <h4 className="text-xs font-bold text-white truncate">{media.title}</h4>

                  {/* Tag Pill with copy */}
                  <div className="mt-1 flex items-center flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onCopyTag(`[ENVIAR_MIDIA:${media.id}]`)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] hover:bg-emerald-500/25 transition-colors"
                      title="Clique para copiar a tag de disparo"
                    >
                      <span>[ENVIAR_MIDIA:{media.id}]</span>
                      {mediaTagCopied === `[ENVIAR_MIDIA:${media.id}]` ? (
                        <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </div>

                  {/* Trigger rule */}
                  <p className="text-[11px] text-[#8696a0] mt-1.5 line-clamp-2">
                    <strong className="text-emerald-300 font-normal">Gatilho:</strong>{" "}
                    {media.triggerInstruction}
                  </p>

                  {/* Interactive View Once Checkbox on Registered Media */}
                  <div className="mt-2.5 pt-2 border-t border-[#222e35]/80 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none group/chk">
                      <input
                        type="checkbox"
                        checked={Boolean(media.viewOnce)}
                        onChange={() => onToggleMediaViewOnce(media.id)}
                        className="w-3.5 h-3.5 rounded bg-[#202c33] border-[#26353d] text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                      />
                      <span className="text-[11px] font-medium text-[#e9edef] group-hover/chk:text-white flex items-center gap-1.5">
                        <Eye
                          className={`w-3.5 h-3.5 transition-colors ${
                            media.viewOnce ? "text-emerald-400" : "text-[#8696a0]"
                          }`}
                        />
                        <span>Visualização Única</span>
                      </span>
                    </label>

                    {media.viewOnce ? (
                      <span className="text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium">
                        Ativa (1x)
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8696a0]/70">
                        Desativada
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete Action */}
                <button
                  type="button"
                  onClick={() => onDeleteMedia(media.id)}
                  className="absolute top-3 right-3 p-1.5 text-[#8696a0] hover:text-red-400 hover:bg-[#202c33] rounded-lg transition-colors"
                  title="Excluir mídia"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
