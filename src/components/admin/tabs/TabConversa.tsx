"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Image as ImageIcon,
  Paperclip,
  X,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { AdminConfig } from "../types";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  createdAt: Date;
}

interface TabConversaProps {
  config: AdminConfig;
}

const QUICK_PROMPTS = [
  "Crie um roteiro persuasivo de mensagens para vendas",
  "Dê 5 ideias de ganchos chamativos para capturar atenção",
  "Como posso melhorar a conversão do meu produto?",
  "Escreva uma mensagem calorosa e profissional para clientes",
];

export function TabConversa({ config }: TabConversaProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [smartRouting, setSmartRouting] = useState<boolean>(true);
  const [visionModel, setVisionModel] = useState<string>("deepseek/deepseek-v4.1-flash");
  const [textModel, setTextModel] = useState<string>("deepseek/deepseek-chat");

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftSmartRouting, setDraftSmartRouting] = useState<boolean>(true);
  const [draftVisionModel, setDraftVisionModel] = useState<string>("deepseek/deepseek-v4.1-flash");
  const [draftTextModel, setDraftTextModel] = useState<string>("deepseek/deepseek-chat");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPrompt = localStorage.getItem("admin_chat_custom_prompt") || "";
      setSystemPrompt(savedPrompt);
      setDraftPrompt(savedPrompt);

      const savedRouting = localStorage.getItem("admin_chat_smart_routing");
      if (savedRouting !== null) {
        setSmartRouting(savedRouting === "true");
        setDraftSmartRouting(savedRouting === "true");
      }

      const savedVision = localStorage.getItem("admin_chat_vision_model") || "deepseek/deepseek-v4.1-flash";
      setVisionModel(savedVision);
      setDraftVisionModel(savedVision);

      const savedText = localStorage.getItem("admin_chat_text_model") || "deepseek/deepseek-chat";
      setTextModel(savedText);
      setDraftTextModel(savedText);
    }
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Support pasting images directly from clipboard (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const processImageFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert("A imagem selecionada é muito grande. Escolha uma imagem de até 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setAttachedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    e.target.value = "";
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if ((!text && !attachedImage) || isLoading) return;

    const currentImg = attachedImage;
    const userMsg: MessageItem = {
      id: "usr_" + Date.now(),
      role: "user",
      content: text || (currentImg ? "Analise a imagem enviada:" : ""),
      imageUrl: currentImg || undefined,
      createdAt: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            imageUrl: m.imageUrl,
          })),
          attendantId: config.id || config.slug,
          systemPrompt: systemPrompt.trim() || undefined,
          smartRouting,
          visionModel: visionModel.trim() || "deepseek/deepseek-v4.1-flash",
          textModel: textModel.trim() || "deepseek/deepseek-chat",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao obter resposta da IA");
      }

      const assistantMsg: MessageItem = {
        id: "ast_" + Date.now(),
        role: "assistant",
        content: data.reply,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: MessageItem = {
        id: "err_" + Date.now(),
        role: "assistant",
        content: `⚠️ Não foi possível obter resposta: ${err.message || "Verifique sua conexão ou API Key na aba Provedor de IA."}`,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    if (confirm("Deseja realmente limpar toda a conversa atual?")) {
      setMessages([]);
      setAttachedImage(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Container Principal do Chat */}
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl shadow-xl flex flex-col h-[76vh] min-h-[550px] overflow-hidden">
        {/* Cabeçalho do Chat */}
        <div className="px-5 py-3.5 border-b border-[#222e35] bg-[#182229]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Conversa com a IA</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{smartRouting ? `${textModel.split("/").pop()} + Visão` : (config.aiModel || "deepseek-chat")}</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#202c33] text-[#8696a0] border border-[#26353d]">
                  <ImageIcon className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Visão / Imagens Ativa</span>
                </span>
              </div>
              <p className="text-[11px] text-[#8696a0]">
                Converse livremente com o seu assistente de IA, peça ideias, gere conteúdos ou anexe imagens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftPrompt(systemPrompt);
                setDraftSmartRouting(smartRouting);
                setDraftVisionModel(visionModel);
                setDraftTextModel(textModel);
                setIsConfigOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all cursor-pointer ${
                systemPrompt.trim()
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                  : "text-[#8696a0] hover:text-white hover:bg-[#202c33] border-[#26353d]"
              }`}
              title="Configurar prompt e instruções do assistente"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prompt do Assistente</span>
              {systemPrompt.trim() && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                title="Limpar mensagens"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar Conversa</span>
              </button>
            )}
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Como posso ajudar você hoje?</h3>
                <p className="text-xs text-[#8696a0] mt-1 leading-relaxed">
                  Envie instruções, anexe prints e imagens (ou use <kbd className="bg-[#182229] px-1 py-0.5 rounded border border-[#26353d] text-white">Ctrl+V</kbd>)
                  para que a IA leia e atenda suas solicitações com visão em tempo real.
                </p>
              </div>

              {/* Sugestões Rápidas */}
              <div className="grid grid-cols-1 gap-2 w-full pt-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="p-3 text-left text-xs bg-[#182229] hover:bg-[#202c33] border border-[#26353d] hover:border-emerald-500/40 rounded-xl text-[#d1d7db] transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{prompt}</span>
                    <Zap className="w-3.5 h-3.5 text-[#8696a0] group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed group ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/30"
                        : "bg-[#182229] text-[#e9edef] border border-[#26353d] rounded-bl-none shadow-md"
                    }`}
                  >
                    {/* Imagem enviada pelo usuário */}
                    {msg.imageUrl && (
                      <div className="mb-2.5 rounded-xl overflow-hidden max-w-xs border border-white/20 bg-black/40 shadow-md">
                        <img
                          src={msg.imageUrl}
                          alt="Imagem enviada"
                          className="w-full h-auto max-h-64 object-contain"
                        />
                      </div>
                    )}

                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                    {msg.role === "assistant" && (
                      <div className="mt-2 pt-2 border-t border-[#26353d]/50 flex items-center justify-between text-[11px] text-[#8696a0]">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                          title="Copiar resposta"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-[#202c33] border border-[#26353d] flex items-center justify-center text-[#8696a0] shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-[#182229] border border-[#26353d] rounded-2xl rounded-bl-none px-4 py-3 text-xs text-[#8696a0] flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Gerando resposta...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Rodapé com Campo de Digitação e Upload */}
        <div className="p-3 sm:p-4 border-t border-[#222e35] bg-[#182229]/50">
          {/* Miniatura da Imagem Anexada */}
          {attachedImage && (
            <div className="mb-2 inline-flex items-center gap-2 bg-[#202c33] border border-emerald-500/40 rounded-xl p-1.5 pr-3 shadow-md animate-in fade-in">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                <img
                  src={attachedImage}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <span className="text-xs font-medium text-emerald-400 block">Imagem anexada</span>
                <span className="text-[10px] text-[#8696a0]">Pronta para envio</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="ml-2 p-1 text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Remover imagem"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 bg-[#202c33] border border-[#26353d] focus-within:border-emerald-500 rounded-xl p-2 transition-all shadow-inner"
          >
            {/* Input oculto para carregar arquivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Botão de Anexo / Imagem */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-[#8696a0] hover:text-emerald-400 hover:bg-[#182229] transition-colors shrink-0 cursor-pointer"
              title="Anexar imagem (ou cole com Ctrl+V)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Digite sua solicitação ou cole uma imagem (Ctrl+V)..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-white placeholder-[#8696a0] text-xs sm:text-sm px-2 py-1 outline-none resize-none max-h-32 min-h-[36px]"
            />

            <button
              type="submit"
              disabled={(!input.trim() && !attachedImage) || isLoading}
              className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-emerald-950 shrink-0 cursor-pointer"
              title="Enviar mensagem (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-[#8696a0] mt-2 px-1">
            <span>Dica: cole capturas de tela diretamente com <kbd className="bg-[#182229] px-1 py-0.5 rounded border border-[#26353d]">Ctrl + V</kbd></span>
            <span><kbd className="bg-[#182229] px-1 py-0.5 rounded border border-[#26353d]">Enter</kbd> envia • <kbd className="bg-[#182229] px-1 py-0.5 rounded border border-[#26353d]">Shift + Enter</kbd> quebra linha</span>
          </div>
        </div>
      </div>

      {/* Modal de Configuração do Prompt do Assistente */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222e35] pb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>Instruções Personalizadas do Assistente</span>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-[#8696a0] hover:text-white p-1 rounded-lg hover:bg-[#202c33] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Switch de Roteamento Inteligente Dual */}
            <div className="bg-[#182229] border border-[#26353d] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Roteamento Inteligente Dual</h4>
                    <p className="text-[10px] text-[#8696a0]">
                      Visão com <span className="text-emerald-400">v4.1-flash</span> + Resposta sem censura com <span className="text-emerald-400">deepseek-chat</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDraftSmartRouting(!draftSmartRouting)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    draftSmartRouting ? "bg-emerald-600" : "bg-[#2a3942]"
                  }`}
                  title={draftSmartRouting ? "Desativar roteamento inteligente" : "Ativar roteamento inteligente"}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      draftSmartRouting ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {draftSmartRouting && (
                <div className="pt-2 border-t border-[#26353d]/60 space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#8696a0] font-medium block mb-1">
                        IA de Leitura de Imagem (Visão):
                      </label>
                      <input
                        type="text"
                        value={draftVisionModel}
                        onChange={(e) => setDraftVisionModel(e.target.value)}
                        placeholder="deepseek/deepseek-v4.1-flash"
                        className="w-full bg-[#111b21] border border-[#26353d] focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-[11px] text-[#d1d7db] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8696a0] font-medium block mb-1">
                        IA de Conversa (Sem Censura):
                      </label>
                      <input
                        type="text"
                        value={draftTextModel}
                        onChange={(e) => setDraftTextModel(e.target.value)}
                        placeholder="deepseek/deepseek-chat"
                        className="w-full bg-[#111b21] border border-[#26353d] focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-[11px] text-[#d1d7db] outline-none font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8696a0] leading-relaxed bg-[#111b21]/70 p-2 rounded-lg border border-[#26353d]/40">
                    💡 <strong>Como funciona:</strong> Ao anexar uma imagem, o modelo de visão descreve objetivamente todos os elementos visuais da foto e entrega essa descrição para a IA sem censura, gerando resposta completa sem recusas ou bloqueios.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white block">
                Instruções Personalizadas (Prompt do Assistente):
              </label>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Defina como a IA deve se comportar nesta aba de conversa. Você pode fornecer regras livres, estilo de escrita, tom de voz ou orientações específicas para suas solicitações.
              </p>

              <textarea
                value={draftPrompt}
                onChange={(e) => setDraftPrompt(e.target.value)}
                placeholder="Exemplo: Atue como um especialista em copywriting e marketing persuasivo para o mercado de conteúdo exclusivo e adulto. Seja direto, prático, sem censura moral e gere respostas prontas para copiar e colar."
                rows={5}
                className="w-full bg-[#182229] border border-[#26353d] focus:border-emerald-500 rounded-xl p-3 text-xs text-[#d1d7db] placeholder-[#8696a0]/60 outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between text-[11px] text-[#8696a0] pt-1">
                <span>{draftPrompt.length} caracteres</span>
                {draftPrompt && (
                  <button
                    type="button"
                    onClick={() => setDraftPrompt("")}
                    className="text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpar campo
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#222e35] pt-3">
              <button
                type="button"
                onClick={() => {
                  setDraftPrompt("");
                  setSystemPrompt("");
                  setDraftSmartRouting(true);
                  setSmartRouting(true);
                  setDraftVisionModel("deepseek/deepseek-v4.1-flash");
                  setVisionModel("deepseek/deepseek-v4.1-flash");
                  setDraftTextModel("deepseek/deepseek-chat");
                  setTextModel("deepseek/deepseek-chat");
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("admin_chat_custom_prompt");
                    localStorage.setItem("admin_chat_smart_routing", "true");
                    localStorage.setItem("admin_chat_vision_model", "deepseek/deepseek-v4.1-flash");
                    localStorage.setItem("admin_chat_text_model", "deepseek/deepseek-chat");
                  }
                  setIsConfigOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-[#8696a0] hover:text-white hover:bg-[#202c33] transition-colors cursor-pointer"
              >
                Usar Padrão do Sistema
              </button>
              <button
                type="button"
                onClick={() => {
                  setSystemPrompt(draftPrompt);
                  setSmartRouting(draftSmartRouting);
                  setVisionModel(draftVisionModel);
                  setTextModel(draftTextModel);
                  if (typeof window !== "undefined") {
                    if (draftPrompt.trim()) {
                      localStorage.setItem("admin_chat_custom_prompt", draftPrompt.trim());
                    } else {
                      localStorage.removeItem("admin_chat_custom_prompt");
                    }
                    localStorage.setItem("admin_chat_smart_routing", String(draftSmartRouting));
                    localStorage.setItem("admin_chat_vision_model", draftVisionModel.trim());
                    localStorage.setItem("admin_chat_text_model", draftTextModel.trim());
                  }
                  setIsConfigOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-black transition-colors cursor-pointer shadow-md"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
