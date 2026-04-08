import { useMemo, useState } from "react";
import { MessageCircle, X, Send, User } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAdminChatThreads, fetchChatThread, sendChatMessage, type ChatPeer } from "@/lib/api";
import { formatPkr } from "@/lib/money";
import { toast } from "sonner";

const ChatWidget = () => {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState("");
  const [text, setText] = useState("");
  const isAdmin = user?.role === "admin";

  const { data: threads = [] } = useQuery({
    queryKey: ["adminChatThreads"],
    queryFn: () => fetchAdminChatThreads(token!),
    enabled: Boolean(token) && isAdmin,
    refetchInterval: 5000,
  });

  const activePeerId = useMemo(() => {
    if (!isAdmin) return "";
    return selectedPeerId || threads[0]?.user.id || "";
  }, [threads, isAdmin, selectedPeerId]);

  const { data: thread, isLoading } = useQuery({
    queryKey: ["chatThread", isAdmin ? activePeerId : "user"],
    queryFn: () => fetchChatThread(token!, isAdmin ? activePeerId : undefined),
    enabled: Boolean(token) && (!isAdmin || Boolean(activePeerId)),
    refetchInterval: 5000,
  });

  const peer: ChatPeer | null = thread?.peer ?? null;
  const messages = thread?.messages ?? [];

  const submit = async () => {
    if (!token) {
      toast.error("Please login to chat");
      return;
    }
    if (!text.trim()) return;
    try {
      await sendChatMessage(token, {
        text: text.trim(),
        with: isAdmin ? activePeerId : peer?.id,
      });
      setText("");
      await queryClient.invalidateQueries({ queryKey: ["chatThread"] });
      if (isAdmin) await queryClient.invalidateQueries({ queryKey: ["adminChatThreads"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6 mx-auto" /> : <MessageCircle className="w-6 h-6 mx-auto" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {!token ? (
            <div className="p-5">
              <p className="font-semibold text-heading mb-2">Chat with support</p>
              <p className="text-sm text-muted-foreground mb-4">Please login first to start chat with admin.</p>
              <Link to="/auth" className="btn-gradient text-sm inline-block">Login</Link>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-heading text-sm">Live Chat</p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin
                    ? peer
                      ? `Talking to ${peer.name}`
                      : "Select a conversation"
                    : peer
                      ? "Talking to support"
                      : "Support is unavailable"}
                </p>
              </div>

              <div className={`h-80 bg-background/40 ${isAdmin ? "grid grid-cols-[140px_1fr]" : "flex flex-col"}`}>
                {isAdmin && (
                  <aside className="h-full min-h-0 border-r border-border overflow-y-auto overscroll-contain">
                    {threads.length === 0 && <p className="p-2 text-[11px] text-muted-foreground">No chats yet</p>}
                    {threads.map((t) => {
                      const active = t.user.id === activePeerId;
                      return (
                        <button
                          key={t.user.id}
                          type="button"
                          onClick={() => setSelectedPeerId(t.user.id)}
                          className={`w-full text-left px-2 py-2 border-b border-border/60 transition-colors ${active ? "bg-primary/10" : "hover:bg-secondary/50"}`}
                        >
                          <p className="text-xs font-medium text-heading truncate">{t.user.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {t.lastMessage
                              ? t.lastMessage.text || (t.lastMessage.hasProduct ? "Shared a product" : "Attachment")
                              : "No messages"}
                          </p>
                        </button>
                      );
                    })}
                  </aside>
                )}
                <div
                  className="h-full min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 space-y-2"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {isLoading && <p className="text-xs text-muted-foreground">Loading messages...</p>}
                  {!isLoading && messages.length === 0 && (
                    <p className="text-xs text-muted-foreground">No messages yet. Start the conversation.</p>
                  )}
                  {messages.map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-body"}`}>
                          {m.text && <p>{m.text}</p>}
                          {m.product && (
                            <Link
                              to={`/product/${m.product.productId}`}
                              className={`mt-2 block rounded-lg p-2 ${mine ? "bg-primary-foreground/20" : "bg-card"} border border-border`}
                            >
                              <div className="flex gap-2 items-center">
                                {m.product.image ? (
                                  <img src={m.product.image} alt={m.product.name} className="w-10 h-10 rounded object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="line-clamp-1 font-medium">{m.product.name}</p>
                                  <p>{formatPkr(m.product.price)}</p>
                                </div>
                              </div>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 border-t border-border flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submit();
                  }}
                  placeholder="Type message..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                <button type="button" onClick={submit} className="px-3 rounded-lg bg-primary text-primary-foreground">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
