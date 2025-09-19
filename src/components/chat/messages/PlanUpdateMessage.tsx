import React, { useMemo, useState } from 'react';
import { PlanDisplay } from './PlanDisplay';
import { MarkdownRenderer } from '../MarkdownRenderer';
import type { ChatMessage } from '@/types/chat';
import { ArrowRight, CheckCircle, Circle, ChevronsUpDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PlanUpdateMessageProps {
  message: ChatMessage;
}

export const PlanUpdateMessage: React.FC<PlanUpdateMessageProps> = ({ message }) => {
  // Prefer structured plan payload; fallback to parsing simple list in content
  const payload = (message as any).plan as ChatMessage['plan'] | undefined;
  // console.log('plan payload', payload, message)
  const steps = payload?.plan && Array.isArray(payload.plan) ? payload.plan : [];
  const total = steps.length;

  const inferredIndex = useMemo(() => {
    if (total === 0) return -2; // special: no steps
    const ip = steps.findIndex(s => s.status === 'in_progress');
    if (ip >= 0) return ip;
    const pending = steps.findIndex(s => s.status === 'pending');
    if (pending >= 0) return pending;
    return -1; // all done
  }, [steps, total]);

  const [open, setOpen] = useState(false);

  if (total === 0) {
    // Fallback to regular markdown if no structured steps
    return <MarkdownRenderer content={message.content} />;
  }

  const renderIcon = () => {
    if (inferredIndex === -1) return <CheckCircle className="w-4 h-4 text-green-600" />;
    const status = steps[inferredIndex].status as 'pending' | 'in_progress' | 'completed';
    if (status === 'in_progress') return <ArrowRight className="w-4 h-4 text-blue-600" />;
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <Circle className="w-4 h-4 text-gray-400" />;
  };

  const leftText = inferredIndex === -1 ? '已完成' : steps[inferredIndex]?.step || '';
  const rightText = inferredIndex === -1 ? `${total}/${total}` : `${inferredIndex + 1}/${total}`;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center w-full gap-2 cursor-pointer select-none">
          {/* Left: in_progress icon + step text */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {renderIcon()}
            <div className="truncate text-sm text-orange-900 dark:text-orange-100">
              {leftText}
            </div>
          </div>
          {/* Right: n/total and toggle chevrons */}
          <div className="flex items-center gap-2 text-xs text-orange-800 dark:text-orange-200">
            <span className="whitespace-nowrap">{rightText}</span>
            <ChevronsUpDown className="w-4 h-4" />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <PlanDisplay
          steps={steps}
          currentStep={inferredIndex >= 0 ? inferredIndex : undefined}
          className="border-0 bg-transparent"
        />
      </CollapsibleContent>
    </Collapsible>
  );
};
