"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Settings,
  Bot,
  FileText,
  DollarSign,
  BarChart3,
  Lock,
  Eye,
  EyeOff,
  Check,
  Copy,
  Save,
  LogOut,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Zap,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Clock,
} from "lucide-react";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_MEDIA_INSTRUCTIONS, MediaItem } from "@/lib/config";
import { optimizeImageForVision } from "@/lib/image-optimizer";

interface AdminConfig {
  id?: string;
  slug?: string;
  bio?: string;
  isActive?: boolean;
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiTemperature: number;
  systemPrompt: string;
  agentName: string;
  agentAvatar: string;
  productName: string;
  productPrice: number;
  productDeliveryLink: string;
  paymentGateway: string;
  paymentGatewayToken: string;
  paymentWebhookSecret: string;
  mediaCatalog: string; // JSON string of MediaItem[]
  mediaInstructions: string;
  maxAgentPhotos: number;
  postPurchaseMinutes?: number;
  nonPurchaseMinutes?: number;
  cooldownHours?: number;
}

interface StatsData {
  stats: {
    totalSessions: number;
    totalMessages: number;
    totalOrders: number;
    paidOrdersCount: number;
    totalRevenue: number;
  };
  recentOrders: Array<{
    id: string;
    amount: number;
    status: string;
    deliveryLink: string;
    createdAt: string;
    paidAt?: string;
    session: {
      userName: string;
      deviceId: string;
      lastIp: string;
    };
  }>;
  recentSessions: Array<{
    id: string;
    userName: string;
    lastIp: string;
    userAgent: string;
    updatedAt: string;
    _count: { messages: number };
  }>;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"ai" | "prompt" | "product" | "stats" | "media">("ai");

  // Config Form State
  const [config, setConfig] = useState<AdminConfig>({
    aiBaseUrl: "https://api.deepseek.com",
    aiApiKey: "",
    aiModel: "deepseek-chat",
    aiTemperature: 0.75,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    agentName: "Gabriel Siqueira",
    agentAvatar: "",
    productName: "Método Alta Conversão",
    productPrice: 97.0,
    productDeliveryLink: "https://seusite.com/download/acesso-vip",
    paymentGateway: "simulated",
    paymentGatewayToken: "",
    paymentWebhookSecret: "",
    mediaCatalog: "[]",
    mediaInstructions: DEFAULT_MEDIA_INSTRUCTIONS,
    maxAgentPhotos: 3,
    postPurchaseMinutes: 10,
    nonPurchaseMinutes: 15,
    cooldownHours: 24,
  });

  // Media Management State
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [newMediaTitle, setNewMediaTitle] = useState("");
  const [newMediaId, setNewMediaId] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaDesc, setNewMediaDesc] = useState("");
  const [newMediaTrigger, setNewMediaTrigger] = useState("");
  const [newMediaViewOnce, setNewMediaViewOnce] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaTagCopied, setMediaTagCopied] = useState<string | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [appUrl, setAppUrl] = useState("");

  // Multi-attendant management state
  const [attendantsList, setAttendantsList] = useState<any[]>([]);
  const [selectedAttendantId, setSelectedAttendantId] = useState<string>("");
  const [isNewAttendantModalOpen, setIsNewAttendantModalOpen] = useState(false);
  const [newAttendantName, setNewAttendantName] = useState("");
  const [newAttendantSlug, setNewAttendantSlug] = useState("");
  const [isCreatingAttendant, setIsCreatingAttendant] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
      if (data.isAuthenticated) {
        loadAttendants();
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const loadAttendants = async (preferredId?: string) => {
    try {
      const res = await fetch("/api/admin/attendants");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.attendants)) {
          setAttendantsList(data.attendants);
          const targetId =
            preferredId ||
            selectedAttendantId ||
            (data.attendants.length > 0 ? data.attendants[0].id : "");

          if (targetId) {
            setSelectedAttendantId(targetId);
            loadConfig(targetId);
            loadStats(targetId);
          }
        }
      }
    } catch (err) {
      console.error("Error loading attendants:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      if (!res.ok) {
        setAuthError("Senha incorreta");
        return;
      }

      setIsAuthenticated(true);
      loadAttendants();
    } catch {
      setAuthError("Erro de conexão ao autenticar");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  const loadConfig = async (attendantId?: string) => {
    try {
      const targetId = attendantId || selectedAttendantId;
      const query = targetId ? `?attendantId=${encodeURIComponent(targetId)}` : "";
      const res = await fetch(`/api/admin/config${query}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        try {
          const parsedMedia: MediaItem[] = JSON.parse(data.config.mediaCatalog || "[]");
          setMediaList(parsedMedia);
        } catch {
          setMediaList([]);
        }
      }
    } catch (err) {
      console.error("Error loading config:", err);
    }
  };

  const loadStats = async (attendantId?: string) => {
    try {
      const targetId = attendantId || selectedAttendantId;
      const query = targetId ? `?attendantId=${encodeURIComponent(targetId)}` : "";
      const res = await fetch(`/api/admin/stats${query}`);
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleSelectAttendant = (id: string) => {
    setSelectedAttendantId(id);
    loadConfig(id);
    loadStats(id);
  };

  const handleCreateAttendant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendantName.trim()) {
      alert("Informe o nome do atendente.");
      return;
    }

    setIsCreatingAttendant(true);
    try {
      const res = await fetch("/api/admin/attendants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAttendantName.trim(),
          slug: newAttendantSlug.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erro ao criar atendente");
      }

      const data = await res.json();
      setIsNewAttendantModalOpen(false);
      setNewAttendantName("");
      setNewAttendantSlug("");
      await loadAttendants(data.attendant.id);
      alert("Novo atendente criado com sucesso!");
    } catch (err: any) {
      alert(`Falha ao criar atendente: ${err.message}`);
    } finally {
      setIsCreatingAttendant(false);
    }
  };

  const handleDeleteAttendant = async () => {
    if (attendantsList.length <= 1) {
      alert("Você não pode excluir o único atendente do sistema.");
      return;
    }

    const current = attendantsList.find((a) => a.id === selectedAttendantId);
    if (!confirm(`Tem certeza que deseja excluir o atendente "${current?.name || "selecionado"}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/attendants/${selectedAttendantId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erro ao excluir");
      }

      const remaining = attendantsList.filter((a) => a.id !== selectedAttendantId);
      const nextId = remaining.length > 0 ? remaining[0].id : "";
      await loadAttendants(nextId);
      alert("Atendente excluído com sucesso.");
    } catch (err: any) {
      alert(`Falha ao excluir atendente: ${err.message}`);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payloadToSave = {
        ...config,
        id: selectedAttendantId,
        attendantId: selectedAttendantId,
        mediaCatalog: JSON.stringify(mediaList),
      };

      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSave),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Erro ao salvar");
      }

      setSaveSuccess(true);
      // Reload attendants list to update any changed names or slugs
      loadAttendants(selectedAttendantId);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Falha ao salvar configurações: ${err?.message || "Erro desconhecido"}`);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAI = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);

    try {
      const res = await fetch("/api/admin/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiBaseUrl: config.aiBaseUrl,
          aiApiKey: config.aiApiKey,
          aiModel: config.aiModel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiTestResult({ success: true, message: data.message });
      } else {
        setAiTestResult({ success: false, message: data.error || "Falha na comunicação" });
      }
    } catch {
      setAiTestResult({ success: false, message: "Erro de conexão ao testar IA" });
    } finally {
      setIsTestingAi(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${appUrl}/api/webhooks/payment`;
    navigator.clipboard.writeText(url);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2500);
  };

  // Auto-slugify title to ID
  const handleTitleChange = (val: string) => {
    setNewMediaTitle(val);
    if (!newMediaId || newMediaId === slugify(newMediaTitle)) {
      setNewMediaId(slugify(val));
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleUploadMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const optimized = await optimizeImageForVision(file);
      setNewMediaUrl(optimized.dataUrl);
      if (!newMediaTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setNewMediaTitle(cleanName);
        setNewMediaId(slugify(cleanName));
      }
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      alert("Não foi possível carregar a imagem.");
    } finally {
      setIsUploadingMedia(false);
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const optimized = await optimizeImageForVision(file);
      setConfig((prev) => ({ ...prev, agentAvatar: optimized.dataUrl }));
    } catch (err) {
      console.error("Erro ao processar avatar:", err);
      alert("Não foi possível carregar a foto do atendente.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = "";
    }
  };

  const handleAddMedia = () => {
    if (!newMediaTitle.trim() || !newMediaUrl.trim() || !newMediaTrigger.trim()) {
      alert("Preencha o título, a imagem e a instrução de quando a IA deve enviar.");
      return;
    }

    const cleanId = (newMediaId.trim() || slugify(newMediaTitle)).toLowerCase();

    if (mediaList.some((m) => m.id === cleanId)) {
      alert("Já existe uma mídia com este Identificador (ID). Escolha outro.");
      return;
    }

    const item: MediaItem = {
      id: cleanId,
      title: newMediaTitle.trim(),
      url: newMediaUrl.trim(),
      description: newMediaDesc.trim() || undefined,
      triggerInstruction: newMediaTrigger.trim(),
      viewOnce: newMediaViewOnce,
    };

    const updated = [...mediaList, item];
    setMediaList(updated);
    setConfig((prev) => ({ ...prev, mediaCatalog: JSON.stringify(updated) }));

    // Reset form
    setNewMediaTitle("");
    setNewMediaId("");
    setNewMediaUrl("");
    setNewMediaDesc("");
    setNewMediaTrigger("");
    setNewMediaViewOnce(false);
  };

  const handleDeleteMedia = (id: string) => {
    if (confirm(`Deseja remover a mídia "${id}"?`)) {
      const updated = mediaList.filter((m) => m.id !== id);
      setMediaList(updated);
      setConfig((prev) => ({ ...prev, mediaCatalog: JSON.stringify(updated) }));
    }
  };

  const handleToggleMediaViewOnce = (id: string) => {
    const updated = mediaList.map((m) =>
      m.id === id ? { ...m, viewOnce: !m.viewOnce } : m
    );
    setMediaList(updated);
    setConfig((prev) => ({ ...prev, mediaCatalog: JSON.stringify(updated) }));
  };

  const copyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setMediaTagCopied(tag);
    setTimeout(() => setMediaTagCopied(null), 2000);
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b141a]">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Login view
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b141a] p-4 chat-wallpaper">
        <div className="w-full max-w-md bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-1">
            Painel Administrativo
          </h2>
          <p className="text-xs text-[#8696a0] text-center mb-6">
            Digite a senha mestra configurada em <code className="text-emerald-400">ADMIN_PASSWORD</code>.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-white outline-none text-sm transition-colors"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40"
            >
              Entrar no Painel
            </button>

            <div className="text-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-[#8696a0] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o Chat de Atendimento</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b141a] text-[#e9edef] flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#111b21] border-b border-[#222e35] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-lg transition-colors"
            title="Ir para o Chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Webchat Sales Admin</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Produção
              </span>
            </h1>
            <p className="text-xs text-[#8696a0]">
              Gerenciamento de IA, Mídias, Vendas e Gatilhos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveConfig()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-emerald-950 disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            title="Sair"
            className="p-2 text-[#8696a0] hover:text-red-400 hover:bg-[#202c33] rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 flex-1">
        {/* Attendant Switcher Bar */}
        <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {config.agentAvatar ? (
                <img
                  src={config.agentAvatar}
                  alt={config.agentName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/50 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#202c33] flex items-center justify-center text-emerald-400 font-bold text-lg ring-2 ring-emerald-500/40">
                  {(config.agentName || "G").charAt(0)}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#111b21] ${
                  config.isActive !== false ? "bg-emerald-500" : "bg-neutral-500"
                }`}
                title={config.isActive !== false ? "Atendente Ativo no Lobby" : "Atendente Oculto do Lobby"}
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#8696a0] font-medium">Atendente Selecionado:</span>
                <select
                  value={selectedAttendantId}
                  onChange={(e) => handleSelectAttendant(e.target.value)}
                  className="bg-[#202c33] text-white border border-[#26353d] rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {attendantsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (/{a.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#8696a0]">Link de Vendas:</span>
                <a
                  href={`${appUrl}/${config.slug || "gabriel"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-mono inline-flex items-center gap-1 transition-colors"
                >
                  <span>{`${appUrl}/${config.slug || "gabriel"}`}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${appUrl}/${config.slug || "gabriel"}`);
                    alert("Link do atendente copiado!");
                  }}
                  className="p-1 text-[#8696a0] hover:text-white transition-colors"
                  title="Copiar link"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={() => setIsNewAttendantModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#202c33] hover:bg-[#2a3942] text-white rounded-xl text-xs font-medium border border-[#26353d] transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Novo Atendente</span>
            </button>

            {attendantsList.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteAttendant}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium border border-red-500/20 transition-all"
                title="Excluir este atendente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#222e35] pb-4 mb-6">
          <button
            onClick={() => setActiveTab("ai")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "ai"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>1. Provedor de IA</span>
          </button>

          <button
            onClick={() => setActiveTab("prompt")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "prompt"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Comportamento & Prompt</span>
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "media"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>3. Mídias & Instruções</span>
            {mediaList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400/20 text-emerald-300 font-bold">
                {mediaList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("product")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "product"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>4. Produto & Pagamento</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("stats");
              loadStats();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "stats"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>5. Vendas & Auditoria</span>
          </button>
        </div>

        {/* Tab 1: AI Provider Config */}
        {activeTab === "ai" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="border-b border-[#222e35] pb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <span>Configuração do Provedor de IA</span>
                </h2>
                <p className="text-xs text-[#8696a0] mt-1">
                  Compatível com DeepSeek, OpenAI, OpenRouter ou qualquer endpoint compatível.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                    Endpoint Base URL
                  </label>
                  <input
                    type="text"
                    value={config.aiBaseUrl}
                    onChange={(e) => setConfig({ ...config, aiBaseUrl: e.target.value })}
                    placeholder="https://api.deepseek.com"
                    className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
                  />
                  <span className="text-[11px] text-[#8696a0] mt-1 block">
                    Ex: <code className="text-emerald-400">https://api.deepseek.com</code> ou <code className="text-emerald-400">https://openrouter.ai/api/v1</code>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                    Nome do Modelo
                  </label>
                  <input
                    type="text"
                    value={config.aiModel}
                    onChange={(e) => setConfig({ ...config, aiModel: e.target.value })}
                    placeholder="deepseek-chat"
                    className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
                  />
                  <span className="text-[11px] text-[#8696a0] mt-1 block">
                    Ex: <code className="text-emerald-400">deepseek-chat</code>, <code className="text-emerald-400">gpt-4o-mini</code>
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                    Chave de API (API Key)
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={config.aiApiKey}
                      onChange={(e) => setConfig({ ...config, aiApiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full px-4 py-2.5 pr-12 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-white p-1"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-[#8696a0]">
                      Temperatura: <strong className="text-white">{config.aiTemperature}</strong>
                    </label>
                    <span className="text-[11px] text-[#8696a0]">
                      {config.aiTemperature <= 0.3
                        ? "Muito Preciso"
                        : config.aiTemperature <= 0.8
                        ? "Equilibrado (Recomendado para Vendas)"
                        : "Mais Criativo"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={config.aiTemperature}
                    onChange={(e) =>
                      setConfig({ ...config, aiTemperature: parseFloat(e.target.value) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222e35] flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleTestAI}
                  disabled={isTestingAi || !config.aiApiKey}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#202c33] hover:bg-[#26353d] border border-[#26353d] text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isTestingAi ? "Testando conexão..." : "Testar Conexão com a IA"}</span>
                </button>

                {aiTestResult && (
                  <span
                    className={`text-xs px-3 py-1.5 rounded-lg border ${
                      aiTestResult.success
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {aiTestResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: System Prompt & Sales Behavior */}
        {activeTab === "prompt" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#222e35] pb-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span>System Prompt & Instruções de Humanização</span>
                  </h2>
                  <p className="text-xs text-[#8696a0] mt-1">
                    Define a personalidade do atendente, regras anti-robô e o gatilho de checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
                  className="text-xs text-[#8696a0] hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restaurar Padrão</span>
                </button>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Gatilho de Pagamento Automático:</span>
                </p>
                <p className="text-emerald-200/80">
                  Quando o cliente concordar em pagar ou pedir a compra, a IA emitirá a tag{" "}
                  <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-white font-mono">
                    [GERAR_PAGAMENTO]
                  </code>
                  . O backend captura essa tag, remove do texto visível e monta o card com QR Code PIX imediatamente.
                </p>
              </div>

              {/* Agent Profile & Identity */}
              <div className="p-4 bg-[#182229] border border-[#222e35] rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Nome do Atendente
                    </label>
                    <input
                      type="text"
                      value={config.agentName}
                      onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                      placeholder="Ex: Gabriel Siqueira"
                      className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
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
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Bio / Especialidade (Exibido no Lobby Inicial)
                    </label>
                    <input
                      type="text"
                      value={config.bio || ""}
                      onChange={(e) => setConfig({ ...config, bio: e.target.value })}
                      placeholder="Ex: Especialista em Vendas e Suporte VIP"
                      className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4 pt-4 sm:pt-6">
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
                </div>

                <div className="pt-2 border-t border-[#222e35]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs text-[#8696a0]">Variáveis Dinâmicas do Prompt:</span>
                  <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById("systemPromptTextarea") as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart || 0;
                            const end = textarea.selectionEnd || 0;
                            const text = config.systemPrompt;
                            const updated = text.substring(0, start) + "[NOME]" + text.substring(end);
                            setConfig({ ...config, systemPrompt: updated });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 6, start + 6);
                            }, 50);
                          } else {
                            setConfig({ ...config, systemPrompt: config.systemPrompt + " [NOME]" });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs hover:bg-emerald-500/25 transition-colors cursor-pointer"
                        title="Clique para inserir [NOME] no prompt"
                      >
                        <span>+ Inserir [NOME]</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById("systemPromptTextarea") as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart || 0;
                            const end = textarea.selectionEnd || 0;
                            const text = config.systemPrompt;
                            const updated = text.substring(0, start) + "[TEMPO]" + text.substring(end);
                            setConfig({ ...config, systemPrompt: updated });
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + 7, start + 7);
                            }, 50);
                          } else {
                            setConfig({ ...config, systemPrompt: config.systemPrompt + " [TEMPO]" });
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 font-mono text-xs hover:bg-teal-500/25 transition-colors cursor-pointer"
                        title="Clique para inserir [TEMPO] no prompt"
                      >
                        <span>+ Inserir [TEMPO]</span>
                      </button>
                    </div>
                  </div>

                {/* Upload Foto da Atendente */}
                <div className="pt-3 border-t border-[#222e35] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Avatar Preview */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#202c33] border-2 border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
                      {config.agentAvatar ? (
                        <img
                          src={config.agentAvatar}
                          alt="Foto da Atendente"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-emerald-400">
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
                      onChange={handleUploadAvatar}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50 shadow-md shadow-emerald-950"
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
                        className="p-2 text-[#8696a0] hover:text-red-400 hover:bg-[#202c33] rounded-xl transition-colors text-xs"
                        title="Remover foto (usar iniciais)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-[#8696a0]">
                  As tags <code className="bg-[#202c33] text-emerald-300 px-1 py-0.5 rounded font-mono">[NOME]</code> e <code className="bg-[#202c33] text-teal-300 px-1 py-0.5 rounded font-mono">[TEMPO]</code> serão substituídas automaticamente pelo nome do atendente e pelo tempo de conversa configurados.
                </p>
              </div>

              {/* Ciclo de Conversa & Finalização Automática */}
              <div className="p-4 bg-[#182229] border border-[#222e35] rounded-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#222e35] pb-3">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Ciclo de Conversa & Encerramento Automático (Desculpa do Namorado)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8696a0] mb-1">
                      Tempo Pós-Venda (Comprou)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={config.postPurchaseMinutes ?? 10}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            postPurchaseMinutes: parseInt(e.target.value) || 10,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
                      />
                      <span className="text-xs text-[#8696a0]">minutos</span>
                    </div>
                    <p className="text-[11px] text-[#8696a0] mt-1">
                      Tempo de conversa pós-PIX antes de acionar a despedida.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8696a0] mb-1">
                      Tempo de Inatividade
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={config.nonPurchaseMinutes ?? 15}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            nonPurchaseMinutes: parseInt(e.target.value) || 15,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
                      />
                      <span className="text-xs text-[#8696a0]">minutos</span>
                    </div>
                    <p className="text-[11px] text-[#8696a0] mt-1">
                      Tempo de silêncio do cliente para acionar a despedida por inatividade.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8696a0] mb-1">
                      Bloqueio / Cooldown
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={72}
                        value={config.cooldownHours ?? 24}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            cooldownHours: parseInt(e.target.value) || 24,
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
                      />
                      <span className="text-xs text-[#8696a0]">horas</span>
                    </div>
                    <p className="text-[11px] text-[#8696a0] mt-1">
                      Horas que a atendente fica offline até poder voltar a falar.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-[#202c33]/70 rounded-lg text-[11px] text-[#8696a0] space-y-1">
                  <p>
                    • <strong>3 Gatilhos Inteligentes:</strong> O atendimento sem compra só é encerrado se o cliente sumir por inatividade, se recusar expressamente a compra, ou se demorar mais de 5 minutos para pagar o PIX gerado. Conversas ativas nunca são cortadas!
                  </p>
                  <p>
                    • <strong>Tag [TEMPO]:</strong> Substituída automaticamente por{" "}
                    <code className="text-teal-400 font-mono">
                      {config.postPurchaseMinutes ?? 10} minutos
                    </code>{" "}
                    no prompt da IA.
                  </p>
                  <p>
                    • <strong>Retorno no Dia Seguinte:</strong> Após o período de bloqueio (24h), quando o cliente mandar mensagem, o backend injeta a instrução secreta apropriada (se comprou: pergunta se gostou das fotinhas; se não comprou: volta a provocar e tenta fechar a venda).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                  Prompt de Sistema Completo
                </label>
                <textarea
                  id="systemPromptTextarea"
                  rows={16}
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                  className="w-full px-4 py-3 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white font-mono leading-relaxed outline-none resize-y"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Mídias & Instruções de Uso na IA (NOVA ABA) */}
        {activeTab === "media" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* General Media Instructions Card */}
            <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#222e35] pb-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-emerald-400" />
                    <span>Instruções Gerais de Uso de Mídias para a IA</span>
                  </h2>
                  <p className="text-xs text-[#8696a0] mt-1">
                    Essas diretrizes ensinam o modelo como se comportar ao disparar fotos e amostras.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setConfig({ ...config, mediaInstructions: DEFAULT_MEDIA_INSTRUCTIONS })
                  }
                  className="text-xs text-[#8696a0] hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restaurar Diretrizes</span>
                </button>
              </div>

              <div>
                <textarea
                  rows={5}
                  value={config.mediaInstructions}
                  onChange={(e) => setConfig({ ...config, mediaInstructions: e.target.value })}
                  placeholder="Defina regras gerais para o envio de imagens..."
                  className="w-full px-4 py-3 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white font-mono leading-relaxed outline-none resize-y"
                />
              </div>

              {/* Max Agent Photos Limit Field */}
              <div className="pt-3 border-t border-[#222e35] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
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
                    className="w-24 px-3 py-2 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-center text-sm font-bold text-white outline-none"
                  />
                  <span className="text-xs text-[#8696a0]">fotos</span>
                </div>
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
                    onChange={(e) => handleTitleChange(e.target.value)}
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
                      onChange={handleUploadMediaFile}
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
                  onClick={handleAddMedia}
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
                            onClick={() => copyTag(`[ENVIAR_MIDIA:${media.id}]`)}
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
                              onChange={() => handleToggleMediaViewOnce(media.id)}
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
                        onClick={() => handleDeleteMedia(media.id)}
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
        )}

        {/* Tab 4: Product & Payment Settings */}
        {activeTab === "product" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="border-b border-[#222e35] pb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>Configurações do Produto & Entrega Segura</span>
                </h2>
                <p className="text-xs text-[#8696a0] mt-1">
                  Defina o valor e a URL restrita de entrega liberada somente após o webhook de confirmação.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                    Nome Comercial do Produto
                  </label>
                  <input
                    type="text"
                    value={config.productName}
                    onChange={(e) => setConfig({ ...config, productName: e.target.value })}
                    placeholder="Método Alta Conversão"
                    className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.productPrice}
                    onChange={(e) =>
                      setConfig({ ...config, productPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="97.00"
                    className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#8696a0] mb-1.5 flex items-center justify-between">
                    <span>Link Exclusivo de Entrega (Protegido)</span>
                    <span className="text-[11px] text-amber-400 font-normal">
                      NUNCA exposto à IA antes da confirmação do webhook
                    </span>
                  </label>
                  <input
                    type="url"
                    value={config.productDeliveryLink}
                    onChange={(e) =>
                      setConfig({ ...config, productDeliveryLink: e.target.value })
                    }
                    placeholder="https://seusite.com/download/acesso-vip"
                    className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                    Modo do Gateway de Pagamento
                  </label>
                  <select
                    value={config.paymentGateway}
                    onChange={(e) => setConfig({ ...config, paymentGateway: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none"
                  >
                    <option value="simulated">Simulador Sandbox (Teste Imediato)</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="asaas">Asaas</option>
                    <option value="stripe">Stripe / Webhook Genérico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                    Token / Chave de API do Gateway
                  </label>
                  <input
                    type="password"
                    value={config.paymentGatewayToken}
                    onChange={(e) =>
                      setConfig({ ...config, paymentGatewayToken: e.target.value })
                    }
                    placeholder="APP_USR-..."
                    className="w-full px-4 py-2.5 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-sm text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#222e35]">
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                  URL de Notificação do Webhook (Copie para seu Gateway)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${appUrl}/api/webhooks/payment`}
                    className="w-full px-4 py-2.5 bg-[#182229] border border-[#222e35] rounded-xl text-xs text-emerald-400 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyWebhookUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#202c33] hover:bg-[#26353d] border border-[#26353d] text-white rounded-xl text-xs font-medium transition-colors shrink-0"
                  >
                    {webhookCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Stats & Audit */}
        {activeTab === "stats" && (
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
        )}
      </div>

      {/* New Attendant Modal */}
      {isNewAttendantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111b21] border border-[#222e35] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#222e35] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Cadastrar Novo Atendente</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewAttendantModalOpen(false)}
                className="text-[#8696a0] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAttendant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Nome do Atendente *
                </label>
                <input
                  type="text"
                  required
                  value={newAttendantName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewAttendantName(val);
                    setNewAttendantSlug(
                      val
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-+|-+$/g, "")
                    );
                  }}
                  placeholder="Ex: Amanda Castro"
                  className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Slug da URL (Link)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-[#182229] border border-r-0 border-[#26353d] rounded-l-xl text-xs text-[#8696a0] font-mono">
                    {"/"}
                  </span>
                  <input
                    type="text"
                    value={newAttendantSlug}
                    onChange={(e) =>
                      setNewAttendantSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_-]/g, "-")
                      )
                    }
                    placeholder="amanda"
                    className="w-full px-3 py-2.5 bg-[#202c33] border border-[#26353d] focus:border-emerald-500 rounded-r-xl text-xs sm:text-sm text-white font-mono outline-none"
                  />
                </div>
                <p className="text-[11px] text-[#8696a0] mt-1">
                  O link de vendas será: <span className="text-emerald-400 font-mono">{`${appUrl}/${newAttendantSlug || "nome"}`}</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAttendantModalOpen(false)}
                  className="px-4 py-2 bg-[#202c33] hover:bg-[#2a3942] text-white text-xs font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAttendant}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-emerald-950 disabled:opacity-50"
                >
                  {isCreatingAttendant ? "Criando..." : "Criar Atendente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
