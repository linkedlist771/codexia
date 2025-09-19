import React from 'react';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { VirtualizedTextRenderer } from '../VirtualizedTextRenderer';
import type { ChatMessage } from '@/types/chat';

interface CommandExecutionMessageProps {
  message: ChatMessage;
}

export const CommandExecutionMessage: React.FC<CommandExecutionMessageProps> = ({ message }) => {
  const getCleanExecutionContent = () => {
    if (message.content.includes('✅ Command completed')) {
      // Extract only the output and error parts
      let cleanContent = '';
      
      const outputMatch = message.title && message.title.match(/.*?Read/);
      const errorMatch = message.content.match(/(?:Errors|错误):\n```\n([\s\S]*?)\n```/);
      
      if (outputMatch) {
        cleanContent += `**Read:**\n\`\`\`\n${outputMatch[1]}\n\`\`\``;
      }
      
      if (errorMatch) {
        if (cleanContent) cleanContent += '\n\n';
        cleanContent += `**错误:**\n\`\`\`\n${errorMatch[1]}\n\`\`\``;
      }
      
      // If no output or errors found, show a simple completion message
      if (!cleanContent) {
        const exitMatch = message.content.match(/exit code: (\d+)/);
        cleanContent = exitMatch ? `命令已完成，退出码：${exitMatch[1]}` : '命令已成功完成';
      }
      
      return cleanContent;
    }
    
    return message.content;
  };

  const shouldUseVirtualizedRenderer = () => {
    const contentToRender = getCleanExecutionContent();
    const lineCount = contentToRender.split('\n').length;
    const charCount = contentToRender.length;
    
    return lineCount > 100 || charCount > 10000
  };

  const content = getCleanExecutionContent();

  if (shouldUseVirtualizedRenderer()) {
    return <VirtualizedTextRenderer content={content} />;
  }

  return <MarkdownRenderer content={content} />;
};
