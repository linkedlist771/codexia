import React from 'react';
import { Button } from '../ui/button';
import { MessageSquare } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useChatInputStore } from '../../stores/chatInputStore';

interface NoteToChatProps {
  content: string;
  onSuccess?: () => void;
}

export const NoteToChat: React.FC<NoteToChatProps> = ({
  content,
  onSuccess,
}) => {
  const { appendToInput } = useChatInputStore();

  const handleAddToChat = () => {
    appendToInput(content);
    onSuccess?.();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToChat}
            className="h-8 w-8 p-0"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>添加到聊天输入框</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
