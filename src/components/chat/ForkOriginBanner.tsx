import React from 'react';
import { CornerUpLeft } from 'lucide-react';
import { useConversationStore } from '@/stores/ConversationStore';

interface ForkOriginBannerProps {
  fromConversationId: string;
  parentMessageId?: string;
}

// Small banner that appears in a forked conversation and lets users jump
// back to the source conversation. Keeps UI lightweight and unobtrusive.
export const ForkOriginBanner: React.FC<ForkOriginBannerProps> = ({
  fromConversationId,
  parentMessageId,
}) => {
  const { setCurrentConversation } = useConversationStore();

  const handleJump = () => {
    if (fromConversationId) {
      setCurrentConversation(fromConversationId);
    }
  };

  return (
    <div className="px-2 pt-2">
      <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-muted/40">
        <div className="text-sm text-muted-foreground truncate">
          来源会话 <span className="font-mono text-foreground/80">{fromConversationId}</span>
          {parentMessageId ? (
            <span className="text-muted-foreground/80">，消息 {parentMessageId}</span>
          ) : null}
        </div>
        <button
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={handleJump}
          title="跳转到来源会话"
        >
          <CornerUpLeft className="w-3.5 h-3.5" />
          查看来源
        </button>
      </div>
    </div>
  );
};
