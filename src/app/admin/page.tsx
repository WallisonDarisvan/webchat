"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_MEDIA_INSTRUCTIONS,
  DEFAULT_DELIVERY_MESSAGE,
  MediaItem,
  PromptTag,
  SYSTEM_DEFAULT_TAGS,
} from "@/lib/config";
import { optimizeImageForVision } from "@/lib/image-optimizer";

import { AdminConfig, StatsData, AdminTabType } from "@/components/admin/types";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AttendantBanner } from "@/components/admin/AttendantBanner";
import { AdminTabsNav } from "@/components/admin/AdminTabsNav";

import { TabProfile } from "@/components/admin/tabs/TabProfile";
import { TabAi } from "@/components/admin/tabs/TabAi";
import { TabPrompt } from "@/components/admin/tabs/TabPrompt";
import { TabTimer } from "@/components/admin/tabs/TabTimer";
import { TabTags } from "@/components/admin/tabs/TabTags";
import { TabMedia } from "@/components/admin/tabs/TabMedia";
import { TabProduct } from "@/components/admin/tabs/TabProduct";
import { TabStats } from "@/components/admin/tabs/TabStats";

import { NewAttendantModal } from "@/components/admin/modals/NewAttendantModal";
import { TagModal } from "@/components/admin/modals/TagModal";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTabType>("profile");

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
    productDeliveryMessage: DEFAULT_DELIVERY_MESSAGE,
    paymentGateway: "simulated",
    paymentGatewayToken: "",
    paymentWebhookSecret: "",
    mediaCatalog: "[]",
    mediaInstructions: DEFAULT_MEDIA_INSTRUCTIONS,
    customTags: "[]",
    maxAgentPhotos: 3,
    postPurchaseMinutes: 10,
    nonPurchaseMinutes: 15,
    cooldownHours: 24,
  });

  // Tags Management State
  const [customTagsList, setCustomTagsList] = useState<PromptTag[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<PromptTag | null>(null);
  const [tagNameInput, setTagNameInput] = useState("");
  const [tagDescInput, setTagDescInput] = useState("");
  const [tagValueInput, setTagValueInput] = useState("");
  const [tagTypeInput, setTagTypeInput] = useState<"variable" | "action">("variable");
  const [tagCategoryInput, setTagCategoryInput] = useState<"general" | "timer" | "action">("general");
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [copiedTagId, setCopiedTagId] = useState<string | null>(null);

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
  }, []);

  // Check auth session on mount
  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(Boolean(data.authenticated));
        if (data.authenticated) {
          loadAttendants();
          loadStats();
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        loadAttendants();
        loadStats();
      } else {
        setAuthError(data.error || "Senha incorreta");
      }
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
        try {
          const parsedTags: PromptTag[] = JSON.parse(data.config.customTags || "[]");
          setCustomTagsList(parsedTags);
        } catch {
          setCustomTagsList([]);
        }
      }
    } catch (err) {
      console.error("Error loading config:", err);
    }
  };

  const loadAttendants = async (preferredId?: string) => {
    try {
      const res = await fetch("/api/admin/attendants");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.attendants) ? data.attendants : [];
        setAttendantsList(list);

        const currentExists = list.some((a: any) => a.id === selectedAttendantId);
        const targetId = preferredId || (currentExists ? selectedAttendantId : list[0]?.id || "");
        if (targetId) {
          setSelectedAttendantId(targetId);
          loadConfig(targetId);
        }
      }
    } catch (err) {
      console.error("Error loading attendants list:", err);
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
        customTags: JSON.stringify(customTagsList),
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
      loadAttendants(selectedAttendantId);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Falha ao salvar configurações: ${err?.message || "Erro desconhecido"}`);
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

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (val: string) => {
    setNewMediaTitle(val);
    if (!newMediaId || newMediaId === slugify(newMediaTitle)) {
      setNewMediaId(slugify(val));
    }
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

  // Tags CRUD Handlers
  const getTagDisplayValue = (tag: PromptTag) => {
    if (tag.id === "tag_nome") return config.agentName || "Gabriel Siqueira";
    if (tag.id === "tag_tempo_pos_venda") return `${config.postPurchaseMinutes ?? 10} minutos`;
    if (tag.id === "tag_tempo_inatividade") return `${config.nonPurchaseMinutes ?? 15} minutos`;
    if (tag.id === "tag_tempo_cooldown") return `${config.cooldownHours ?? 24} horas`;
    return tag.value;
  };

  const handleOpenNewTagModal = (defaultCategory: "general" | "timer" | "action" = "general") => {
    setEditingTag(null);
    setTagNameInput(defaultCategory === "timer" ? "[TEMPO-" : "");
    setTagDescInput("");
    setTagValueInput("");
    setTagTypeInput(defaultCategory === "action" ? "action" : "variable");
    setTagCategoryInput(defaultCategory);
    setIsTagModalOpen(true);
  };

  const handleOpenEditTagModal = (tag: PromptTag) => {
    setEditingTag(tag);
    setTagNameInput(tag.name);
    setTagDescInput(tag.description);
    setTagValueInput(tag.value);
    setTagTypeInput(tag.type || "variable");
    setTagCategoryInput(tag.category || (tag.name.includes("TEMPO") ? "timer" : tag.type === "action" ? "action" : "general"));
    setIsTagModalOpen(true);
  };

  const handleSaveTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let cleanName = tagNameInput.trim();
    if (!cleanName) {
      alert("Por favor, informe o nome ou código da tag.");
      return;
    }
    // Auto-format tag token to [UPPERCASE]
    if (!cleanName.startsWith("[")) cleanName = "[" + cleanName;
    if (!cleanName.endsWith("]")) cleanName = cleanName + "]";
    cleanName = cleanName.toUpperCase().replace(/\s+/g, "_");

    if (!tagDescInput.trim()) {
      alert("Por favor, descreva para que serve a tag.");
      return;
    }

    if (editingTag) {
      const updated = customTagsList.map((t) =>
        t.id === editingTag.id
          ? {
              ...t,
              name: cleanName,
              description: tagDescInput.trim(),
              value: tagValueInput.trim(),
              type: tagTypeInput,
              category: tagCategoryInput,
            }
          : t
      );
      setCustomTagsList(updated);
      setConfig((prev) => ({ ...prev, customTags: JSON.stringify(updated) }));
      setIsTagModalOpen(false);
      setEditingTag(null);
    } else {
      const allExisting = [...SYSTEM_DEFAULT_TAGS, ...customTagsList];
      if (allExisting.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) {
        alert("Já existe uma tag com este nome. Escolha outro nome.");
        return;
      }

      const newTag: PromptTag = {
        id: "tag_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        name: cleanName,
        description: tagDescInput.trim(),
        value: tagValueInput.trim(),
        type: tagTypeInput,
        category: tagCategoryInput,
        isSystem: false,
      };

      const updated = [...customTagsList, newTag];
      setCustomTagsList(updated);
      setConfig((prev) => ({ ...prev, customTags: JSON.stringify(updated) }));
      setIsTagModalOpen(false);
    }
  };

  const handleDeleteTag = (id: string) => {
    const tag = customTagsList.find((t) => t.id === id);
    if (!tag) return;
    if (confirm(`Deseja realmente excluir a tag "${tag.name}"?`)) {
      const updated = customTagsList.filter((t) => t.id !== id);
      setCustomTagsList(updated);
      setConfig((prev) => ({ ...prev, customTags: JSON.stringify(updated) }));
    }
  };

  const handleCopyTagToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTagId(id);
    setTimeout(() => setCopiedTagId(null), 2000);
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
    <div className="h-screen bg-[#0b141a] text-[#e9edef] flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <AdminHeader
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onSave={() => handleSaveConfig()}
        onLogout={handleLogout}
      />

      {/* 2-Column Dashboard: Full-bleed Left Sidebar + Right Workspace */}
      <div className="flex-1 flex flex-col md:flex-row w-full min-h-0 overflow-hidden">
        {/* Left Sidebar: Attendants */}
        <AdminSidebar
          attendantsList={attendantsList}
          selectedAttendantId={selectedAttendantId}
          onSelectAttendant={handleSelectAttendant}
          onOpenNewModal={() => setIsNewAttendantModalOpen(true)}
          onDeleteAttendant={handleDeleteAttendant}
        />

        {/* Right Workspace: Config tabs (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0 custom-scrollbar h-full">
          {/* Current Attendant Mini-Banner with Sales Link */}
          <AttendantBanner config={config} appUrl={appUrl} />

          {/* Navigation Tabs */}
          <AdminTabsNav
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              if (tab === "stats") {
                loadStats();
              }
            }}
            totalTagsCount={SYSTEM_DEFAULT_TAGS.length + customTagsList.length}
            mediaCount={mediaList.length}
          />

          {/* Tab 1: Perfil do Atendente */}
          {activeTab === "profile" && (
            <TabProfile
              config={config}
              setConfig={setConfig}
              appUrl={appUrl}
              onUploadAvatar={handleUploadAvatar}
              isUploadingAvatar={isUploadingAvatar}
              avatarFileInputRef={avatarFileInputRef}
            />
          )}

          {/* Tab 2: AI Provider Config */}
          {activeTab === "ai" && (
            <TabAi
              config={config}
              setConfig={setConfig}
              showApiKey={showApiKey}
              setShowApiKey={setShowApiKey}
              aiTestResult={aiTestResult}
              isTestingAi={isTestingAi}
              onTestAi={handleTestAI}
            />
          )}

          {/* Tab 3: System Prompt & Sales Behavior */}
          {activeTab === "prompt" && (
            <TabPrompt
              config={config}
              setConfig={setConfig}
              allTags={[...SYSTEM_DEFAULT_TAGS, ...customTagsList]}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* Tab 4: Timer & Ciclos de Conversa */}
          {activeTab === "timer" && (
            <TabTimer
              config={config}
              setConfig={setConfig}
              customTagsList={customTagsList}
              onOpenNewTagModal={handleOpenNewTagModal}
              onOpenEditTagModal={handleOpenEditTagModal}
              onDeleteTag={handleDeleteTag}
              onCopyTagToken={handleCopyTagToken}
              copiedTagId={copiedTagId}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* Tab 5: Gerenciador de Tags & Variáveis */}
          {activeTab === "tags" && (
            <TabTags
              systemTags={SYSTEM_DEFAULT_TAGS}
              customTagsList={customTagsList}
              tagSearchQuery={tagSearchQuery}
              setTagSearchQuery={setTagSearchQuery}
              onOpenNewTagModal={handleOpenNewTagModal}
              onOpenEditTagModal={handleOpenEditTagModal}
              onDeleteTag={handleDeleteTag}
              onCopyTagToken={handleCopyTagToken}
              copiedTagId={copiedTagId}
              getTagDisplayValue={getTagDisplayValue}
            />
          )}

          {/* Tab 6: Mídias & Amostras */}
          {activeTab === "media" && (
            <TabMedia
              config={config}
              setConfig={setConfig}
              mediaList={mediaList}
              newMediaTitle={newMediaTitle}
              setNewMediaTitle={setNewMediaTitle}
              newMediaId={newMediaId}
              setNewMediaId={setNewMediaId}
              newMediaUrl={newMediaUrl}
              setNewMediaUrl={setNewMediaUrl}
              newMediaTrigger={newMediaTrigger}
              setNewMediaTrigger={setNewMediaTrigger}
              newMediaViewOnce={newMediaViewOnce}
              setNewMediaViewOnce={setNewMediaViewOnce}
              isUploadingMedia={isUploadingMedia}
              onUploadMediaFile={handleUploadMediaFile}
              mediaFileInputRef={mediaFileInputRef}
              onAddMedia={handleAddMedia}
              onDeleteMedia={handleDeleteMedia}
              onToggleMediaViewOnce={handleToggleMediaViewOnce}
              onCopyTag={copyTag}
              mediaTagCopied={mediaTagCopied}
              onTitleChange={handleTitleChange}
              slugify={slugify}
            />
          )}

          {/* Tab 7: Product & Payment Settings */}
          {activeTab === "product" && (
            <TabProduct
              config={config}
              setConfig={setConfig}
              appUrl={appUrl}
              webhookCopied={webhookCopied}
              onCopyWebhookUrl={copyWebhookUrl}
            />
          )}

          {/* Tab 8: Stats & Audit */}
          {activeTab === "stats" && <TabStats statsData={statsData} />}
        </main>
      </div>

      {/* Modal: Novo Atendente */}
      <NewAttendantModal
        isOpen={isNewAttendantModalOpen}
        onClose={() => setIsNewAttendantModalOpen(false)}
        name={newAttendantName}
        setName={setNewAttendantName}
        slug={newAttendantSlug}
        setSlug={setNewAttendantSlug}
        isCreating={isCreatingAttendant}
        onSubmit={handleCreateAttendant}
        appUrl={appUrl}
      />

      {/* Modal: Criar / Editar Tag */}
      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        editingTag={editingTag}
        tagNameInput={tagNameInput}
        setTagNameInput={setTagNameInput}
        tagDescInput={tagDescInput}
        setTagDescInput={setTagDescInput}
        tagValueInput={tagValueInput}
        setTagValueInput={setTagValueInput}
        tagTypeInput={tagTypeInput}
        setTagTypeInput={setTagTypeInput}
        onSave={handleSaveTag}
      />
    </div>
  );
}
