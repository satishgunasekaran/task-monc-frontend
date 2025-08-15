"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("chat_id", id)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (!error && data) setMessages(data as Message[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, id]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    const userContent = input.trim();
    setInput("");

    // Insert user's message
    const { data: userMsg, error } = await supabase
      .from("chat_messages")
      .insert({ chat_id: id, role: "user", content: userContent })
      .select("id, role, content, created_at")
      .single();

    if (!error && userMsg) {
      setMessages((prev) => [...prev, userMsg as Message]);
      // Simulated assistant response
      setTimeout(async () => {
        const simulated = `Simulated response: ${userContent}`;
        const { data: botMsg, error: botErr } = await supabase
          .from("chat_messages")
          .insert({ chat_id: id, role: "assistant", content: simulated })
          .select("id, role, content, created_at")
          .single();
        if (!botErr && botMsg) {
          setMessages((prev) => [...prev, botMsg as Message]);
        }
        setSending(false);
      }, 600);
    } else {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl p-2">
          <Card>
            <CardContent className="p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="flex gap-2">
                    <div className="text-xs uppercase text-muted-foreground w-20 shrink-0">
                      {m.role}
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="border-t bg-background p-2">
        <form onSubmit={sendMessage} className="mx-auto flex max-w-3xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
