"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, UserCircle, Bot, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Message {
  sender: "user" | "ai";
  text: string;
}

// --- Helper to fix unsupported Tailwind LAB colors ---
function sanitizeColors(element: HTMLElement) {
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach((sheet) => {
    try {
      const rules = (sheet as CSSStyleSheet).cssRules;
      if (!rules) return;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i] as CSSStyleRule;
        if (rule.style && rule.style.color && rule.style.color.includes("lab")) {
          rule.style.color = "rgb(0, 0, 0)";
        }
        if (rule.style && rule.style.backgroundColor && rule.style.backgroundColor.includes("lab")) {
          rule.style.backgroundColor = "rgb(255, 255, 255)";
        }
      }
    } catch {
      // ignore cross-origin stylesheets
    }
  });

  element.querySelectorAll("*").forEach((el) => {
    const computed = window.getComputedStyle(el);
    const bg = computed.backgroundColor;
    const color = computed.color;
    if (bg.includes("lab")) (el as HTMLElement).style.backgroundColor = "#ffffff";
    if (color.includes("lab")) (el as HTMLElement).style.color = "#000000";
  });
}

// --- PDF Export ---
async function exportChatAsPDF() {
  const chatContainer = document.getElementById("chat-container");
  if (!chatContainer) {
    alert("No chat found!");
    return;
  }

  sanitizeColors(chatContainer);

  const canvas = await html2canvas(chatContainer, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgProps = pdf.getImageProperties(imgData);
  const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save("chat-export.pdf");
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ prompt: input.trim() }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const aiMessage: Message = {
        sender: "ai",
        text: data.answer || "No response.",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "⚠️ There was an error connecting to the server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Bot className="text-blue-600" /> Document Assistant
        </h1>
        <button
          onClick={exportChatAsPDF}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition"
        >
          <FileDown size={16} />
          Export PDF
        </button>
      </div>

      {/* Chat Body */}
      <div id="chat-container" className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md px-10 py-12 max-w-3xl w-full">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome to InsightStream
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Start by asking a question about your uploaded documents. Try one of these:
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {[
                  "Summarize the key findings from the calibration report",
                  "What are the total expenses in Lot 2?",
                  "Summarize the invoice for client A.",
                  "List all unique project names mentioned in documents.",
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(example)}
                    className="border border-gray-200 rounded-lg py-2 px-4 text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                {msg.sender === "ai" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bot className="text-blue-600 w-4 h-4" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                    }`}
                >
                  {msg.sender === "ai" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-lg font-bold text-blue-600 mb-2">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-semibold text-blue-500 mb-1">{children}</h2>
                        ),
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-5 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-5 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => (
                          <strong className="text-blue-600 font-semibold">{children}</strong>
                        ),
                        code: ({ children }) => (
                          <code className="bg-blue-50 px-1 py-0.5 rounded text-sm text-blue-700 border border-blue-100">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>

                {msg.sender === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircle className="text-gray-700 w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bot className="text-blue-600 w-4 h-4" />
                </div>
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl text-sm text-gray-500 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center gap-3 sticky bottom-0">
        <input
          type="text"
          autoComplete="off"
          name="chatInput"
          id="chatInput"
          placeholder="Ask a follow-up question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          suppressHydrationWarning
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center shadow-sm"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
