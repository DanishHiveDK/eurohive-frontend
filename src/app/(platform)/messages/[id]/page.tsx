"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Loading } from "@/components/shared";

export default function ConversationPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/v1/messages/${id}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setLoading(false);
    }
    load();
    // Poll for new messages every 5s
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/v1/messages/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      const msg = await res.json();
      setMessages([...messages, msg]);
      setNewMessage("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <Link href="/messages" className="text-sm text-midnight-300 hover:text-honey">← Back to messages</Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-cream-200 p-4 space-y-3">
        {messages.map((m: any) => {
          const isMine = m.senderId === session?.user?.id;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                isMine ? "bg-midnight text-white rounded-br-md" : "bg-cream-100 text-midnight rounded-bl-md"
              }`}>
                <p>{m.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-white/50" : "text-midnight-200"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-3 mt-3">
        <input
          className="input flex-1"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          autoFocus
        />
        <Button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
