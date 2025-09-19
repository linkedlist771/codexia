import { memo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MessageFooter } from './MessageFooter';
import { MessageRouter } from './messages/MessageRouter';
import { ReasoningDisplay } from './ReasoningDisplay';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ChatMessage } from '@/types/chat';
import type { ApprovalRequest } from '@/types/codex';
import { useConversationStore } from '@/stores/ConversationStore';
import { useChatInputStore } from '@/stores/chatInputStore';

interface MessageProps {
  message: ChatMessage;
  index: number;
  isLastMessage: boolean;
  selectedText: string;
  previousMessage?: ChatMessage;
  onApproval?: (approved: boolean, approvalRequest: ApprovalRequest) => void;
  allMessages: ChatMessage[];
  // Optional: inline reasoning content grouped from a preceding reasoning message
  inlineReasoningContent?: string;
}

const getMessageStyle = (role: string, messageType?: string) => {
  // Special styling for different AI operations
  if (messageType === 'reasoning') {
    return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-900 dark:text-purple-100 shadow-sm';
  }
  if (messageType === 'tool_call') {
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-900 dark:text-green-100 shadow-sm';
  }
  if (messageType === 'plan_update') {
    return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-900 dark:text-orange-100 shadow-sm';
  }
  if (messageType === 'exec_command') {
    return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 shadow-sm';
  }
  
  switch (role) {
    case 'user':
      return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700 text-primary-900 dark:text-primary-100 shadow-sm';
    case 'assistant':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 shadow-sm'; 
    case 'system':
      return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm';
    case 'approval':
      return 'bg-transparent'; // ApprovalMessage has its own styling
    default:
      return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm';
  }
};

// Get preview text for collapsed messages
const getPreviewText = (normalized: ChatMessage) => {
  // Use title if available - much simpler!
  if (normalized.title) {
    return normalized.title;
  }
  
  // Fallback to content-based detection for messages without titles
  const content = normalized.content;
  
  if (normalized.messageType === 'plan_update') {
    return '待办'
  }
  
  // Reasoning content
  if (normalized.messageType === 'reasoning') {
    const firstLine = content.split('\n')[0];
    if (firstLine.length > 50) {
      return `🧠 ${firstLine.substring(0, 50)}...`;
    }
    return `🧠 ${firstLine || 'AI 思考'}`;
  }
  
  // Fallback for content without titles
  if (content.length > 100) {
    return content.substring(0, 100) + '...';
  }
  
  return content || '消息';
};

export const Message = memo<MessageProps>(({ 
  message: normalized, 
  index, 
  isLastMessage, 
  selectedText,
  onApproval,
  allMessages,
  inlineReasoningContent,
}) => {
  const { createForkConversation, currentConversationId, setCurrentConversation } = useConversationStore();
  const { setInputValue, requestFocus, setEditingTarget } = useChatInputStore();
  // Detect message types that should be collapsible
  const isSystemMessage = normalized.role === 'system';
  const isReasoningMessage = normalized.messageType === 'reasoning';
  const isToolCallMessage = normalized.messageType === 'tool_call';
  const isExecutionMessage = normalized.messageType === 'exec_command';
  const isApprovalMessage = normalized.role === 'approval';
  const isCodeContent = normalized.content.includes('```') && normalized.content.length > 200;
  const hasLongOutput = normalized.content.length > 500;
  
  // Determine if this message should be collapsible and initially collapsed
  const shouldBeCollapsible = isReasoningMessage ||
                              isToolCallMessage ||
                              (isSystemMessage && (isExecutionMessage || (isCodeContent && hasLongOutput)));
  
  // Never collapse approval messages - they need to be immediately visible
  
  // Keep important messages visible: approvals, plans
  // Collapse all collapsible messages except plan_update
  const [isCollapsed, setIsCollapsed] = useState(
    shouldBeCollapsible && !isApprovalMessage
  );

  const handleFork = () => {
    // Fork should be initiated from assistant messages, not user messages
    if (normalized.role !== 'assistant') return;
    // Build history up to and including this message index
    const history = allMessages.slice(0, index + 1);
    const fromConversationId = currentConversationId || '';
    const newId = createForkConversation(fromConversationId, normalized.id, history);
    if (newId) {
      setCurrentConversation(newId);
      requestFocus();
    }
  };

  const handleEditResend = () => {
    if (normalized.role !== 'user') return;
    // Prefill composer and focus for edit & resend (never fork here)
    setInputValue(normalized.content || '');
    requestFocus();
    // Mark this message as the edit target so send will truncate from here
    if (currentConversationId) {
      setEditingTarget(currentConversationId, normalized.id);
    }
  };
  
  return (
    <div
      key={`${normalized.id}-${index}`}
      className={`group min-w-0 relative flex items-start gap-1 transition-opacity duration-300 ease-in-out ${isLastMessage ? 'mb-6' : 'mb-3'}`}
      data-message-role={normalized.role}
      data-message-timestamp={normalized.timestamp}
    >
      {/* Timeline indicator */}
      {normalized.role !== 'user' && (
        <div className="flex flex-col items-center min-w-0 pt-2 relative">
          {/* Timeline dot */}
          <div className={`w-3 h-3 rounded-full border-2 bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-md z-10 ${
            normalized.role === 'assistant' ? 'border-blue-400 dark:border-blue-500 bg-blue-100 dark:bg-blue-900/50' : 'border-gray-400 dark:border-gray-500 bg-gray-200 dark:bg-gray-700'
          }`} />
        </div>
      )}

      {(normalized.content.length !== 0 || normalized.messageType === 'plan_update' || !!normalized.title) && 
        <div className="flex-1 min-w-0 relative">
          {/* Content container */}
          <div className={`relative w-full min-w-0 max-w-full ${getMessageStyle(normalized.role, normalized.messageType)} rounded-lg px-2 py-1`}>
            <div className="break-words overflow-wrap-anywhere min-w-0 max-w-full overflow-hidden prose prose-sm prose-slate dark:prose-invert transition-all duration-300 ease-in-out">
              {/* Inline Thinking (grouped reasoning) */}
              {inlineReasoningContent && normalized.role === 'assistant' && (
                <div className="mb-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground pb-1">思考</div>
                  <ReasoningDisplay content={inlineReasoningContent} isStreaming={false} />
                </div>
              )}
              {shouldBeCollapsible && !isApprovalMessage ? (
                <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center gap-2 w-full text-left rounded-md py- cursor-pointer select-none transition-colors duration-200 ease-in-out hover:bg-accent/20 dark:hover:bg-accent/10`}>
                      <span className={`transform transition-transform duration-300 ease-in-out ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>
                        {isCollapsed ? <ChevronRight className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </span>
                      <span className="text-sm text-muted-foreground font-mono select-text">
                        {getPreviewText(normalized)}
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 overflow-hidden transition-all duration-300 ease-in-out">
                    <MessageRouter 
                      message={normalized}
                      selectedText={selectedText}
                      onApproval={onApproval}
                    />
                  </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <MessageRouter 
                  message={normalized}
                  selectedText={selectedText}
                  onApproval={onApproval}
                />
              </>
            )}
            {/* Overlay footer: float on hover without affecting layout */}
            <MessageFooter
              messageId={normalized.id}
              messageContent={normalized.content}
              messageRole={normalized.role}
              timestamp={normalized.timestamp}
              messageType={normalized.messageType}
              eventType={normalized.eventType}
              selectedText={selectedText}
              onFork={handleFork}
              onEdit={handleEditResend}
            />
          </div>
        </div>
      </div>
    }
  </div>
);
});
