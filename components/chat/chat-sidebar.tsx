"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

type Chat = { id: string; title: string | null; created_at: string };

export function ChatSidebar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<Chat[]>([]);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const fetchChats = useCallback(async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setChats(data as Chat[]);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchChats();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchChats]);

  async function handleNewChat() {
    setCreating(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) return;
      const { data, error } = await supabase
        .from("chats")
        .insert({ title: "New Chat", created_by: userId })
        .select("id")
        .single();
      if (!error && data) {
        router.push(`/chat/${data.id}`);
        // Refresh chat list
        await fetchChats();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveTitle(chatId: string) {
    if (!editTitle.trim()) return;
    const { error } = await supabase
      .from("chats")
      .update({ title: editTitle.trim() })
      .eq("id", chatId);
    if (!error) {
      await fetchChats();
      setEditingId(null);
      setEditTitle("");
    }
  }

  function handleEditStart(chat: Chat) {
    setEditingId(chat.id);
    setEditTitle(chat.title || "");
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditTitle("");
  }

  async function handleDeleteChat(chatId: string) {
    if (!confirm("Are you sure you want to delete this chat?")) return;

    const { error } = await supabase.from("chats").delete().eq("id", chatId);

    if (!error) {
      await fetchChats();
      // If we're currently viewing the deleted chat, redirect to chat list
      if (pathname?.endsWith(`/chat/${chatId}`)) {
        router.push("/chat");
      }
    }
  }

  const filtered = chats.filter((c) => {
    const t = c.title || "Untitled";
    return t.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar p-2">
      <div className="mb-2 flex gap-2">
        <Button
          size="sm"
          onClick={handleNewChat}
          disabled={creating}
          className="w-full"
        >
          {creating ? "Creating..." : "New Chat"}
        </Button>
      </div>
      <div className="mb-2">
        <Input
          placeholder="Search chats"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">No chats</div>
        ) : (
          <ul className="space-y-1">
            {filtered.map((chat) => {
              const active = pathname?.endsWith(`/chat/${chat.id}`);
              const isEditing = editingId === chat.id;
              return (
                <li key={chat.id}>
                  {isEditing ? (
                    <div className="flex gap-1 p-1">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle(chat.id);
                          if (e.key === "Escape") handleEditCancel();
                        }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveTitle(chat.id)}
                        className="h-7 px-2"
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-1">
                      <Link
                        href={`/chat/${chat.id}`}
                        className={`flex-1 truncate rounded px-2 py-1 text-sm hover:bg-muted ${active ? "bg-muted font-medium" : ""}`}
                      >
                        {chat.title || "Untitled"}
                      </Link>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStart(chat)}
                          className="h-6 w-6 p-0 hover:bg-muted-foreground/10"
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteChat(chat.id)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
