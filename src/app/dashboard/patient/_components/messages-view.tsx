"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Draft = { sender: string; text: string; time: string };
type Thread = {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
  drafts: Draft[];
};

const THREADS: Thread[] = [
  {
    id: "1",
    name: "Dr. Sipho Dlamini",
    role: "Cardiology",
    lastMessage: "Your blood work looks good. Let's adjust your dosage.",
    time: "2 min ago",
    unread: 2,
    drafts: [
      { sender: "Dr. Dlamini", text: "Hi, just reviewed your latest results.", time: "10:30 AM" },
      { sender: "Dr. Dlamini", text: "Your blood work looks good. Let's adjust your dosage.", time: "10:32 AM" },
    ],
  },
  {
    id: "2",
    name: "MedLink Pharmacy",
    role: "Pharmacy",
    lastMessage: "Your prescription is ready for collection.",
    time: "1 hr ago",
    unread: 0,
    drafts: [
      { sender: "Pharmacy", text: "Your prescription is ready for collection.", time: "9:15 AM" },
    ],
  },
  {
    id: "3",
    name: "Dr. Thandi Nkosi",
    role: "General Practitioner",
    lastMessage: "See you at your next appointment.",
    time: "Yesterday",
    unread: 0,
    drafts: [
      { sender: "Dr. Nkosi", text: "See you at your next appointment.", time: "Yesterday" },
    ],
  },
];

export function MessagesView() {
  const [active, setActive] = useState(THREADS[0].id);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const thread = THREADS.find((t) => t.id === active)!;
  const filtered = THREADS.filter((t) => {
    if (!search) return true;
    return t.name.toLowerCase().includes(search.toLowerCase()) || t.lastMessage.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-bold">Messages</h2>
      <div className="glass-panel flex h-[calc(100svh-240px)] overflow-hidden rounded-2xl">
        {/* Thread list */}
        <div className="w-72 shrink-0 border-r border-border">
          <div className="border-b border-border p-3">
            <div className="input-premium flex h-9 items-center gap-2 rounded-lg px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filtered.map((t) => (
              <Button
                key={t.id}
                variant="ghost"
                onClick={() => setActive(t.id)}
                className={cn(
                  "flex h-auto w-full flex-col gap-1 border-b border-border p-3 text-left",
                  active === t.id && "bg-medical/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.time}</span>
                </div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
                <div className="truncate text-xs text-muted-foreground/70">{t.lastMessage}</div>
                {t.unread > 0 && (
                  <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-medical text-[10px] font-bold text-white">
                    {t.unread}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Message area */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-medical/10 text-sm font-bold text-medical">
              {thread.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-semibold">{thread.name}</div>
              <div className="text-xs text-muted-foreground">{thread.role}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {thread.drafts.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "max-w-xs rounded-xl px-3 py-2 text-sm",
                    d.sender.startsWith("Dr") || d.sender === "Pharmacy"
                      ? "mr-auto bg-card/80"
                      : "ml-auto bg-medical text-white"
                  )}
                >
                  <div>{d.text}</div>
                  <div className="mt-1 text-[10px] opacity-60">{d.time}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-card/60" aria-label="Attach file">
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="input-premium flex-1 h-9 rounded-lg px-3 text-sm"
            />
            <Button size="icon" className="h-9 w-9 rounded-lg bg-medical text-white hover:bg-medical/90" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
