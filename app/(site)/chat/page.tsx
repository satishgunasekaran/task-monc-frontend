"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const samplePrompts = [
  "Help me plan a weekend trip to Paris",
  "Explain quantum computing in simple terms",
  "Write a creative story about time travel",
  "Give me a healthy meal plan for the week",
  "Help me learn the basics of photography",
  "What are the best programming languages to learn in 2024?",
];

export default function ChatWelcomePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function handleStartChat(prompt?: string) {
    setCreating(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const message = prompt || input.trim();
      if (!message) return;

      // Create new chat
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .insert({ title: message.slice(0, 50), created_by: userId })
        .select("id")
        .single();

      if (chatError || !chatData) throw new Error("Failed to create chat");

      // Add the first user message
      await supabase.from("chat_messages").insert({
        chat_id: chatData.id,
        role: "user",
        content: message,
      });

      // Add both messages before navigation
      await supabase.from("chat_messages").insert({
        chat_id: chatData.id,
        role: "assistant",
        content: `Simulated response: ${message}`,
      });

      // Navigate to the new chat
      router.push(`/chat/${chatData.id}`);
    } finally {
      setCreating(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) handleStartChat();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Welcome header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">How can I help you today?</h1>
          <p className="text-muted-foreground">
            Start a conversation or try one of the examples below
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={creating || !input.trim()}>
            {creating ? "Starting..." : "Send"}
          </Button>
        </form>

        {/* Sample prompts */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Or try these examples:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {samplePrompts.map((prompt, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleStartChat(prompt)}
              >
                <CardContent className="p-4">
                  <p className="text-sm">{prompt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
