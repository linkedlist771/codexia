import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Trash2,
  Star,
  StarOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Conversation } from "@/types/chat";
import { useConversationStore } from "@/stores/ConversationStore";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tag } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  index: number;
  tabPrefix: string;
  isCurrentlySelected: boolean;
  isFavorited: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onToggleFavorite: (conversationId: string, e: React.MouseEvent) => void;
  onDeleteConversation: (conversationId: string, e: React.MouseEvent) => void;
  onSelectSession?: (sessionId: string) => void;
}

export function ConversationItem({
  conversation,
  index,
  tabPrefix,
  isCurrentlySelected,
  isFavorited,
  onSelectConversation,
  onToggleFavorite,
  onDeleteConversation,
  onSelectSession,
}: ConversationItemProps) {
  const { categories, setConversationCategory } = useConversationStore();
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getPreviewText = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage) {
      return lastMessage.content.length > 100
        ? lastMessage.content.substring(0, 100) + "..."
        : lastMessage.content;
    }
    return "还没有消息";
  };

  return (
    <div
      key={`${tabPrefix}-${conversation.id}-${index}`}
      className={cn(
        "group relative p-3 rounded-lg cursor-pointer border transition-all hover:bg-accent hover:shadow-sm",
        isCurrentlySelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-card border-transparent hover:border-border",
      )}
      onClick={() => {
        // For active sessions, we need to switch to that session
        if (onSelectSession && conversation.id.startsWith('codex-event-')) {
          onSelectSession(conversation.id);
        }
        // Also select the conversation for UI state
        onSelectConversation(conversation);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate flex-1 text-foreground">
              {conversation.title}
            </h4>
            {isFavorited && (
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {getPreviewText(conversation)}
          </p>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground/70">
              {formatDate(conversation.updatedAt)}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {conversation.messages.length} 条消息
            </span>
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(conversation.id, e);
                  }}
                >
                  {isFavorited ? (
                    <>
                      <Star className="h-3 w-3 mr-2 text-yellow-500 fill-current" />
                      取消收藏
                    </>
                  ) : (
                    <>
                      <StarOff className="h-3 w-3 mr-2" />
                      收藏
                    </>
                  )}
                </DropdownMenuItem>
                {/* Category assignment */}
                {conversation.categoryId && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversationCategory(conversation.id, null);
                    }}
                  >
                    <Tag className="h-3 w-3 mr-2" />
                    从分类中移除
                  </DropdownMenuItem>
                )}
                {categories.length > 0 && <DropdownMenuSeparator />}
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversationCategory(conversation.id, cat.id);
                    }}
                  >
                    <Tag className="h-3 w-3 mr-2" />
                    添加到“{cat.name}”
                  </DropdownMenuItem>
                ))}

                <DropdownMenuItem
                  onClick={(e) => onDeleteConversation(conversation.id, e)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
