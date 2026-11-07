"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/config";

interface AdminConfig {
  aiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
  aiTemperature: number;
  systemPrompt: string;
  productName: string;
  productPrice: number;
  productDeliveryLink: string;
  paymentGateway: string;
  paymentGatewayToken: string;
  paymentWebhookSecret: string;
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
  const [activeTab, setActiveTab] = useState<"ai" | "prompt" | "product" | "stats">("ai");

  // Config Form State
  const [config, setConfig] = useState<AdminConfig>({
    aiBaseUrl: "https://api.deepseek.com",
    aiApiKey: "",
    aiModel: "deepseek-chat",
    aiTemperature: 0.75,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    productName: "Método Alta Conversão",
    productPrice: 97.0,
    productDeliveryLink: "https://seusite.com/download/acesso-vip",
    paymentGateway: "simulated",
    paymentGatewayToken: "",
    paymentWebhookSecret: "",
  });

  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [appUrl, setAppUrl] = useState("");

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
        loadConfig();
        loadStats();
      }
    } catch {
      setIsAuthenticated(false);
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
      loadConfig();
      loadStats();
    } catch {
      setAuthError("Erro de conexão ao autenticar");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setPasswordInput("");
  };

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (err) {
      console.error("Error loading config:", err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Falha ao salvar configurações.");
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
    } catch (err) {
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
              Gerenciamento de IA, Vendas e Gatilhos de Entrega
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
            onClick={() => setActiveTab("product")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === "product"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "bg-[#182229] text-[#8696a0] hover:text-white hover:bg-[#202c33]"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Produto & Pagamento</span>
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
            <span>4. Vendas & Auditoria</span>
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
                {/* Base URL */}
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

                {/* Model */}
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

                {/* API Key */}
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

                {/* Temperature */}
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

              {/* Test AI Connection Button */}
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

              {/* Anti-bot rules badge */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Regra de Disparo Automático:</span>
                </p>
                <p className="text-emerald-200/80">
                  Quando o cliente concordar em pagar ou pedir a compra, a IA emitirá a tag{" "}
                  <code className="bg-emerald-950 px-1.5 py-0.5 rounded text-white font-mono">
                    [GERAR_PAGAMENTO]
                  </code>
                  . O backend captura essa tag, remove do texto visível e monta o card com QR Code PIX imediatamente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                  Prompt de Sistema Completo
                </label>
                <textarea
                  rows={16}
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                  className="w-full px-4 py-3 bg-[#202c33] border border-[#222e35] focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white font-mono leading-relaxed outline-none resize-y"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Product & Payment Settings */}
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
                {/* Product Name */}
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

                {/* Product Price */}
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

                {/* Protected Delivery Link */}
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

                {/* Payment Gateway */}
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

                {/* Gateway Token */}
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

              {/* Webhook URL Helper */}
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

        {/* Tab 4: Stats & Audit */}
        {activeTab === "stats" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Metric Cards */}
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

            {/* Orders Table */}
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
    </div>
  );
}

