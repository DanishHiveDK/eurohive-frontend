"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PageHeader, EmptyState, Loading } from "@/components/shared";

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/v1/messages");
      const data = await res.json();
      setConversations(data.data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader title="Messages" description="Your conversations" />
      {conversations.length === 0 ? (
        <EmptyState icon="💬" title="No messages yet" description="Conversations start when you accept a proposal or contact a freelancer." />
      ) : (
        <div className="bg-white rounded-xl border border-cream-200 divide-y divide-cream-100">
          {conversations.map((c: any) => {
            const other = c.participants?.find((p: any) => p.userId !== session?.user?.id);
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className="block p-4 hover:bg-cream-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-midnight text-sm">{other?.user?.firstName} {other?.user?.lastName}</p>
                    <p className="text-xs text-midnight-300 mt-0.5 line-clamp-1">{c.messages?.[0]?.content || "No messages"}</p>
                  </div>
                  <span className="text-xs text-midnight-200">{c.messages?.[0]?.createdAt ? new Date(c.messages[0].createdAt).toLocaleDateString() : ""}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
