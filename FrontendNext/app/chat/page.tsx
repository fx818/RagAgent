"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Bot,
  UserCircle,
  Send,
  Trash2,
  FilePlus,
  Loader2,
  UploadCloud,
  Eye,
  Share2,
  Plus,
  Copy,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { sender: "user" | "ai"; text: string; createdAt?: string };
type ConversationSummary = {
  id: string;
  title?: string;
  updatedAt?: string;
  isPublic?: boolean;
};

export default function InsightStreamFullUI() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;


  function getAuthHeaders(): Record<string, string> {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // autoscroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // initial load
  useEffect(() => {
    fetchHistory();
  }, []);

  // toast auto clear
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // fetch history
  async function fetchHistory() {
    try {
      const res = await fetch(`${BASE_URL}/api/qa/history`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        console.error("history status", res.status);
        throw new Error("Failed to load history");
      }
      const data = await res.json();
      const list = data.history || data || [];
      setConversations(list);
      // if nothing selected and list exists, select first
      if (list.length > 0 && !selectedId) {
        selectConversation(list[0].id);
      }
    } catch (err) {
      console.error("History Fetch Error:", err);
      setConversations([]);
    }
  }

  // select conversation
  async function selectConversation(id: string) {
    setSelectedId(id);
    setShareLink(null);
    try {
      const res = await fetch(`${BASE_URL}/api/qa/history/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        console.error("select convo status", res.status);
        throw new Error("Failed to fetch conversation");
      }
      const data = await res.json();
      const convo = data.conversation || data;

      // set messages (backend returns role/content)
      if (convo?.messages?.length) {
        const formattedMsgs: Message[] = convo.messages.map((m: any) => ({
          sender: m.role === "user" ? "user" : "ai",
          text: m.content,
          createdAt: m.createdAt,
        }));
        setMessages(formattedMsgs);
        setTitle(convo.messages[0]?.content?.slice(0, 40) || "Conversation");
      } else {
        setMessages([]);
        setTitle(convo?.title || "New Conversation");
      }

      // if convo has isPublic and a share url endpoint exists, build shareLink if available
      if (convo?.isPublic && convo?.user?.username) {
        const url = `${window.location.origin}/${convo.user.username}/${convo.id}`;
        setShareLink(url);
      }
    } catch (err) {
      console.error("Conversation Load Error:", err);
      setMessages([{ sender: "ai", text: "⚠️ Unable to load conversation." }]);
    }
  }

  // create new conversation
  async function createNewChat() {
    try {
      const res = await fetch(`${BASE_URL}/api/qa/new`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("create new chat failed", res.status, t);
        throw new Error("Failed to create conversation");
      }
      const data = await res.json();
      const newId = data.conversationId || data.id || data.conversation?.id;
      if (!newId) throw new Error("No conversationId returned");
      setSelectedId(String(newId));
      setMessages([]);
      setTitle("New Conversation");
      setToast("New chat created");
      // refresh list
      await fetchHistory();
    } catch (err) {
      console.error("New Chat Error:", err);
      setToast("Failed to create new chat");
    }
  }

  // send message
  async function handleSendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    const userMsg: Message = {
      sender: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const form = new URLSearchParams();
      form.append("prompt", text);
      if (selectedId) form.append("conversationId", selectedId);

      const res = await fetch(`${BASE_URL}/api/qa/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...getAuthHeaders(),
        },
        body: form,
      });

      if (!res.ok) {
        console.error("ask status", res.status);
        // show server message if any
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }

      const data = await res.json();

      // if backend returned conversationId (new convo), adopt it
      if (data.conversationId) {
        setSelectedId(String(data.conversationId));
      }

      const aiMsg: Message = {
        sender: "ai",
        text: data.answer || "No response.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      await fetchHistory();
    } catch (err) {
      console.error("Ask Error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ There was an error connecting to the server." },
      ]);
      setToast("Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSendMessage();
  }

  // file upload
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch(`${BASE_URL}/api/qa/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("upload failed", res.status, txt);
        throw new Error("Upload failed");
      }
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `📁 Uploaded ${files.length} file(s). You can now ask questions about them.`,
        },
      ]);
      await fetchHistory();
      setToast("Files uploaded");
    } catch (err) {
      console.error("Upload Error:", err);
      setToast("Upload failed");
    }
  }

  // share chat: toggle and if public copy link
  async function handleShareChat() {
    if (!selectedId) {
      setToast("Select a chat first");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/qa/share/${selectedId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("share status", res.status, txt);
        throw new Error("Failed to toggle share");
      }

      const data = await res.json();
      // backend should return { isPublic, shareUrl? }
      if (data.isPublic) {
        const shareUrl = data.shareUrl || data.shareUrl === "" ? data.shareUrl : `${window.location.origin}/${data.username || "user"}/${selectedId}`;
        setShareLink(shareUrl);
        // try copying to clipboard
        try {
          if (navigator.clipboard && shareUrl) {
            await navigator.clipboard.writeText(shareUrl);
            setToast("Public link copied to clipboard");
          } else if (shareUrl) {
            // fallback: create temporary input
            const tmp = document.createElement("input");
            tmp.value = shareUrl;
            document.body.appendChild(tmp);
            tmp.select();
            document.execCommand("copy");
            document.body.removeChild(tmp);
            setToast("Public link copied to clipboard");
          } else {
            setToast("Shared, but no URL returned");
          }
        } catch {
          setToast("Shared — copy failed");
        }
        // add small ai message in chat
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: `🔗 Chat is public: ${shareUrl || "(no URL returned)"}` },
        ]);
      } else {
        // now private
        setShareLink(null);
        setMessages((prev) => [...prev, { sender: "ai", text: "🔒 Chat made private." }]);
        setToast("Chat is now private");
      }

      // refresh history to update isPublic flag
      await fetchHistory();
    } catch (err) {
      console.error("Share Chat Error:", err);
      setToast("Failed to toggle share");
    }
  }

  // delete conversation
  async function handleDeleteConversation() {
    if (!selectedId) {
      setToast("Select a chat first");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/qa/history/${selectedId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("delete status", res.status, txt);
        throw new Error("Delete failed");
      }
      setConversations((prev) => prev.filter((c) => String(c.id) !== String(selectedId)));
      setSelectedId(null);
      setMessages([]);
      setTitle(null);
      setShareLink(null);
      setToast("Conversation deleted");
      await fetchHistory();
    } catch (err) {
      console.error("Delete Error:", err);
      setToast("Failed to delete conversation");
    }
  }

  const filtered = conversations.filter((c) =>
    (c.title || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-[80vh] w-[85vw] mx-auto mt-8 rounded-2xl overflow-hidden shadow-2xl bg-white/70 backdrop-blur-md border border-gray-200">
      {/* Sidebar */}
      <aside className="w-80 bg-gradient-to-b from-blue-50 to-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-200 bg-white/70 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="text-blue-600" />
              <h2 className="font-semibold text-lg text-gray-800">InsightStream</h2>
            </div>
            <button onClick={createNewChat} className="p-2 rounded-full hover:bg-blue-400 bg-blue-100 transition size-small" title="New Chat">
              {/* <Plus className="text-blue-600" size={18} /> */}
              <p className="text-[.9vw]">New Chat</p>
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:ring-1 focus:ring-blue-400 outline-none"
            />
            {/* <button onClick={() => fileInputRef.current?.click()} className="p-2 border rounded-full hover:bg-blue-50 transition">
              <UploadCloud size={18} className="text-blue-600" />
            </button> */}
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-500 text-center mt-10">No chats yet. Start a new one!</div>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className={`px-4 py-3 cursor-pointer rounded-lg mb-2 ${selectedId === String(c.id) ? "bg-blue-100 border border-blue-300" : "hover:bg-gray-50"} transition`}
                  onClick={() => selectConversation(String(c.id))}
                >
                  <div className="flex justify-between items-center">
                    <div className="truncate">
                      <div className="font-medium text-gray-800 text-sm">
                        {c.title || "Untitled Chat"}
                      </div>
                      <div className="text-xs text-gray-500">{c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ""}</div>
                    </div>
                    {c.isPublic && <Eye size={14} className="text-blue-500" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-white to-blue-50">
        <div ref={chatRef} className="flex-1 overflow-auto p-8 space-y-4 max-w-3xl mx-auto w-full">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              {m.sender === "ai" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="text-blue-600 w-4 h-4" />
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${m.sender === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-200 rounded-bl-none text-gray-800"}`}>
                {m.sender === "ai" ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown> : <pre className="whitespace-pre-wrap">{m.text}</pre>}
              </div>
              {m.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserCircle className="text-gray-700 w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4 flex items-center gap-3 shadow-inner">
          <input type="text" placeholder="Ask a question..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} className="flex-1 px-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-blue-400 outline-none" />
          <button onClick={handleSendMessage} disabled={loading} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition">
            {loading ? <Loader2 className="animate-spin" /> : <Send />}
          </button>
        </div>
      </main>

      {/* Right Panel */}
      <aside className="w-80 border-l bg-white p-5 flex flex-col gap-5 shadow-inner">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Conversation Details</h3>
          <p className="text-xs text-gray-500">Share or delete this chat instance.</p>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-800">{title || "Untitled"}</div>
          <div className="text-xs text-gray-500">ID: {selectedId || "-"}</div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleShareChat} className="flex-1 px-3 py-2 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm flex items-center gap-2">
            <Share2 size={14} /> Share Chat
          </button>
          <button onClick={() => { if (shareLink) { navigator.clipboard?.writeText(shareLink).then(()=>setToast("Copied link"), ()=>setToast("Copy failed")) } }} title="Copy link" className="px-2 py-2 rounded-md border border-gray-200 bg-white">
            <Copy size={16} />
          </button>
        </div>

        {shareLink && (
          <div className="text-xs text-gray-600 break-all border p-2 rounded bg-gray-50">
            Public Link: <a className="text-blue-700 underline" href={shareLink} target="_blank" rel="noreferrer">{shareLink}</a>
          </div>
        )}

        <button onClick={handleDeleteConversation} className="px-3 py-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-sm flex items-center gap-2">
          <Trash2 size={14} /> Delete
        </button>

        {toast && <div className="mt-2 px-3 py-2 bg-black text-white text-xs rounded">{toast}</div>}
      </aside>
    </div>
  );
}
