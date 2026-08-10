import { useEffect, useRef, useState } from "react";

import {
  getConversations,
  createConversation,
  sendMessage,
  deleteConversation,
} from "../services/bioGuideService";

// ==========================================
// CONSTANTS
// ==========================================

const MAX_MESSAGE_LENGTH = 1000;

const SUGGESTED_MODULES = [
  {
    title: "Mood Tracker",
    description: "Check in with your mood and energy.",
    route: "/mood-checkin",
  },
  {
    title: "Daily Goals",
    description: "Create and complete your wellness goals.",
    route: "/goals",
  },
  {
    title: "Mental Wellness",
    description: "Explore tools for mental recovery.",
    route: "/mental-wellness",
  },
  {
    title: "Recovery",
    description: "Focus on rest and recovery.",
    route: "/recovery",
  },
];

// ==========================================
// COMPONENT
// ==========================================

function BioGuide() {
  // ======================================
  // STATE
  // ======================================

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [deletingConversationId, setDeletingConversationId] = useState(null);

  const [showMobileHistory, setShowMobileHistory] = useState(false);

  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState("");

  // ======================================
  // REFS
  // ======================================

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ======================================
  // AUTO SCROLL
  // ======================================

  const scrollToBottom = (behavior = "smooth") => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  };

  useEffect(() => {
    if (!activeConversation?.messages?.length) {
      return;
    }

    requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });
  }, [activeConversation?.messages?.length, loading]);

  // ======================================
  // LOAD CONVERSATIONS
  // ======================================

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingHistory(true);

        const data = await getConversations();

        const conversationList = Array.isArray(data)
          ? data
          : data?.results || [];

        setConversations(conversationList);
      } catch (err) {
        console.error("Failed to load conversations:", err);

        setError("Unable to load your conversations.");
      } finally {
        setLoadingHistory(false);
      }
    };

    loadConversations();
  }, []);

  // ======================================
  // SELECT CONVERSATION
  // ======================================

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);

    setError(null);
    setLastFailedMessage("");

    // Close mobile history
    setShowMobileHistory(false);

    // Focus input
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // ======================================
  // NEW CHAT
  // ======================================

  const handleNewChat = () => {
    setActiveConversation(null);

    setMessage("");
    setError(null);
    setLastFailedMessage("");

    setShowMobileHistory(false);

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // ======================================
  // DELETE CONVERSATION
  // ======================================

  const handleDeleteConversation = async (event, conversationId) => {
    event.stopPropagation();

    if (deletingConversationId !== null) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingConversationId(conversationId);
      setError(null);

      await deleteConversation(conversationId);

      // Remove from sidebar
      setConversations((previous) =>
        previous.filter((conversation) => conversation.id !== conversationId),
      );

      // If deleted conversation is active
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessage("");
        setLastFailedMessage("");
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);

      setError("Unable to delete this conversation.");
    } finally {
      setDeletingConversationId(null);
    }
  };

  // ======================================
  // SEND MESSAGE
  // ======================================

  const handleSendMessage = async (customMessage = null) => {
    const text = (customMessage !== null ? customMessage : message).trim();

    if (!text) {
      return;
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      setError(`Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      setError(null);
      setLastFailedMessage("");

      let response;

      // ==================================
      // NEW CONVERSATION
      // ==================================

      if (!activeConversation) {
        response = await createConversation(text);
      }

      // ==================================
      // EXISTING CONVERSATION
      // ==================================
      else {
        response = await sendMessage(activeConversation.id, text);
      }

      // ==================================
      // UPDATE ACTIVE CONVERSATION
      // ==================================

      setActiveConversation(response);

      // ==================================
      // UPDATE HISTORY
      // ==================================

      setConversations((previous) => {
        const exists = previous.some(
          (conversation) => conversation.id === response.id,
        );

        if (exists) {
          return previous.map((conversation) =>
            conversation.id === response.id ? response : conversation,
          );
        }

        return [response, ...previous];
      });

      // ==================================
      // CLEAR INPUT
      // ==================================

      setMessage("");

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } catch (err) {
      console.error("Bio Guide message error:", err);

      setError("The Bio Guide could not process your message.");

      setLastFailedMessage(text);
    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // RETRY
  // ======================================

  const handleRetry = async () => {
    if (!lastFailedMessage) {
      return;
    }

    const failedMessage = lastFailedMessage;

    setLastFailedMessage("");

    await handleSendMessage(failedMessage);
  };

  // ======================================
  // CLEAR INPUT
  // ======================================

  const handleClearInput = () => {
    setMessage("");
    setError(null);

    textareaRef.current?.focus();
  };

  // ======================================
  // KEYBOARD HANDLING
  // ======================================

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      handleSendMessage();
    }
  };

  // ======================================
  // MODULE CLICK
  // ======================================

  const handleModuleClick = (route) => {
    window.location.href = route;
  };

  // ======================================
  // FORMAT TIME
  // ======================================

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // ======================================
  // CURRENT MESSAGES
  // ======================================

  const messages = activeConversation?.messages || [];

  // ======================================
  // CONVERSATION HISTORY
  // ======================================

  const ConversationHistory = () => {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {/* HISTORY HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-800/80 p-4">
          <h2 className="text-sm font-bold text-white">Conversations</h2>

          <button
            type="button"
            onClick={() => setShowMobileHistory(false)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        {/* NEW CHAT */}

        <div className="shrink-0 border-b border-slate-800/80 p-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-95"
          >
            + New Conversation
          </button>
        </div>

        {/* HISTORY LIST */}

        <div className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
          <h3 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            History
          </h3>

          {loadingHistory ? (
            <div className="px-2 py-4 text-xs text-slate-500">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-2 py-4 text-xs text-slate-500">
              No conversations yet.
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isDeleting = deletingConversationId === conversation.id;

                const isActive = activeConversation?.id === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`group relative w-full rounded-xl border transition ${
                      isActive
                        ? "border-slate-700/60 bg-slate-800"
                        : "border-transparent hover:bg-slate-800/50"
                    }`}
                  >
                    {/* SELECT */}

                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conversation)}
                      disabled={isDeleting}
                      className="w-full rounded-xl p-3 pr-10 text-left disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <p className="truncate text-xs font-semibold text-slate-200">
                        {conversation.title ||
                          conversation.messages?.[0]?.content ||
                          "New Conversation"}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        {formatTime(
                          conversation.updated_at || conversation.created_at,
                        )}
                      </p>
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={(event) =>
                        handleDeleteConversation(event, conversation.id)
                      }
                      disabled={isDeleting}
                      title="Delete conversation"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <span className="text-[10px]">...</span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 7h12M9 7V4h6v3m-8 0 .75 13h6.5L15 7M10 11v5m4-5v5"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      {/* ================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ================================= */}

      <aside className="hidden h-full w-72 min-h-0 shrink-0 flex-col border-r border-slate-800/80 bg-slate-900/90 md:flex">
        <ConversationHistory />
      </aside>

      {/* ================================= */}
      {/* MOBILE HISTORY DRAWER */}
      {/* ================================= */}

      {showMobileHistory && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* OVERLAY */}

          <button
            type="button"
            aria-label="Close history"
            onClick={() => setShowMobileHistory(false)}
            className="absolute inset-0 bg-black/60"
          />

          {/* DRAWER */}

          <aside className="relative z-10 flex h-full w-[85%] max-w-sm min-h-0 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl">
            <ConversationHistory />
          </aside>
        </div>
      )}

      {/* ================================= */}
      {/* MAIN CHAT */}
      {/* ================================= */}

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-950">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <header className="flex shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-4 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* MOBILE HISTORY */}

            <button
              type="button"
              onClick={() => setShowMobileHistory(true)}
              title="Conversation history"
              className="flex shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white md:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* TITLE */}

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-white">
                AI Bio Guide
              </h1>

              <p className="truncate text-xs text-slate-400">
                Your focused wellness assistant
              </p>
            </div>
          </div>

          {/* NEW CHAT */}

          <button
            type="button"
            onClick={handleNewChat}
            className="shrink-0 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
          >
            New Chat
          </button>
        </header>

        {/* ================================= */}
        {/* CHAT MESSAGE AREA */}
        {/* ================================= */}

        <section
          ref={messagesContainerRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent"
        >
          {!activeConversation && messages.length === 0 ? (
            /* EMPTY STATE */

            <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-600/20 text-2xl">
                🧠
              </div>

              <h2 className="text-2xl font-extrabold text-white">
                How can I support you today?
              </h2>

              <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
                Talk about your training, recovery, stress, motivation, or
                mental wellness.
              </p>

              {/* MODULES */}

              <div className="mt-6 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {SUGGESTED_MODULES.map((module) => (
                  <button
                    key={module.title}
                    type="button"
                    onClick={() => handleModuleClick(module.route)}
                    className="group rounded-xl border border-slate-800/80 bg-slate-900/80 p-4 text-left transition hover:border-indigo-500/50 hover:bg-slate-800/90"
                  >
                    <h3 className="text-xs font-bold text-white transition-colors group-hover:text-indigo-400">
                      {module.title}
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {module.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* MESSAGES */

            <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";

                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[85%] flex-col ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      {/* MESSAGE */}

                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isUser
                            ? "rounded-br-none bg-indigo-600 text-white"
                            : "rounded-bl-none border border-slate-700/50 bg-slate-800/90 text-slate-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                          {msg.content}
                        </p>
                      </div>

                      {/* TIME */}

                      {(msg.created_at || msg.timestamp) && (
                        <p
                          className={`mt-1 px-1 text-[10px] text-slate-500 ${
                            isUser ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTime(msg.created_at || msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* TYPING */}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-none border border-slate-700/50 bg-slate-800/80 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:150ms]" />

                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-px" />
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* ERROR */}
        {/* ================================= */}

        {error && (
          <div className="shrink-0 border-t border-red-900/50 bg-red-950/40 px-4 py-2.5 sm:px-5">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <p className="text-xs font-medium text-red-300">{error}</p>

              {lastFailedMessage && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="shrink-0 rounded-lg border border-red-800 bg-red-900/40 px-3 py-1 text-xs text-red-200 transition hover:bg-red-800/60"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================================= */}
        {/* INPUT */}
        {/* ================================= */}

        <div className="shrink-0 border-t border-slate-800/80 bg-slate-900/80 p-3 backdrop-blur-md sm:p-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-2xl border border-slate-700/80 bg-slate-950 transition-colors focus-within:border-indigo-500">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(event) => {
                  if (event.target.value.length <= MAX_MESSAGE_LENGTH) {
                    setMessage(event.target.value);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask your Bio Guide..."
                disabled={loading}
                rows={2}
                className="w-full resize-none bg-transparent px-4 py-3 pr-20 text-xs text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
              />

              {/* CLEAR */}

              {message.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  title="Clear"
                  className="absolute bottom-2.5 right-12 rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                >
                  ×
                </button>
              )}

              {/* SEND */}

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={loading || !message.trim()}
                className="absolute bottom-2 right-2 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>

            {/* FOOTER */}

            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-500">
              <span className="hidden sm:inline">
                Enter to send • Shift + Enter for new line
              </span>

              <span className="sm:hidden">Enter to send</span>

              <span
                className={
                  message.length >= MAX_MESSAGE_LENGTH
                    ? "font-bold text-red-400"
                    : ""
                }
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BioGuide;
