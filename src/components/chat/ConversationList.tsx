import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "@/types/chat";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  activeSessionId?: string;
  favoriteStatuses: Record<string, boolean>;
  isFav: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onToggleFavorite: (conversationId: string, e: React.MouseEvent) => void;
  onDeleteConversation: (conversationId: string, e: React.MouseEvent) => void;
  onSelectSession?: (sessionId: string) => void;
}

export function ConversationList({
  conversations,
  currentConversationId,
  favoriteStatuses,
  isFav,
  onSelectConversation,
  onToggleFavorite,
  onDeleteConversation,
  onSelectSession,
}: ConversationListProps) {
  const tabPrefix = isFav ? "favorites" : "all";

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        {isFav ? (
          <>
            <p>暂无收藏的会话</p>
            <p className="text-xs mt-1">给会话加星即可在此处看到</p>
          </>
        ) : (
          <>
            <p>暂时还没有会话</p>
            <p className="text-xs mt-1">创建你的第一个会话开始使用吧</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conversation: Conversation, index: number) => {
        const isCurrentlySelected = currentConversationId === conversation.id;
        const isFavorited = isFav ? true : favoriteStatuses[conversation.id] || false;

        return (
          <ConversationItem
            key={`${tabPrefix}-${conversation.id}-${index}`}
            conversation={conversation}
            index={index}
            tabPrefix={tabPrefix}
            isCurrentlySelected={isCurrentlySelected}
            isFavorited={isFavorited}
            onSelectConversation={onSelectConversation}
            onToggleFavorite={onToggleFavorite}
            onDeleteConversation={onDeleteConversation}
            onSelectSession={onSelectSession}
          />
        );
      })}
    </div>
  );
}
