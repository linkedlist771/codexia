import { Brain, Lightbulb, Target, Cog } from 'lucide-react';

interface ReasoningDisplayProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function ReasoningDisplay({ content, isStreaming = false, className = '' }: ReasoningDisplayProps) {
  
  // Extract reasoning sections with bold headers
  const extractReasoningSections = (text: string) => {
    const sections: Array<{ header: string; content: string }> = [];
    const lines = text.split('\n');
    
    let currentHeader = '';
    let currentContent: string[] = [];
    
    for (const line of lines) {
      const boldMatch = line.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        // Save previous section if exists
        if (currentHeader && currentContent.length > 0) {
          sections.push({
            header: currentHeader,
            content: currentContent.join('\n').trim()
          });
        }
        // Start new section
        currentHeader = boldMatch[1];
        currentContent = [];
        // Add remaining content from this line
        const remaining = line.replace(/^\*\*[^*]+\*\*/, '').trim();
        if (remaining) {
          currentContent.push(remaining);
        }
      } else if (line.trim()) {
        currentContent.push(line);
      }
    }
    
    // Add final section
    if (currentHeader && currentContent.length > 0) {
      sections.push({
        header: currentHeader,
        content: currentContent.join('\n').trim()
      });
    }
    
    return sections;
  };

  const getHeaderIcon = (header: string) => {
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.includes('analyz') || lowerHeader.includes('understand')) {
      return <Brain className="w-4 h-4 text-purple-500" />;
    }
    if (lowerHeader.includes('plan') || lowerHeader.includes('approach')) {
      return <Target className="w-4 h-4 text-blue-500" />;
    }
    if (lowerHeader.includes('implement') || lowerHeader.includes('execut')) {
      return <Cog className="w-4 h-4 text-green-500" />;
    }
    if (lowerHeader.includes('consider') || lowerHeader.includes('think')) {
      return <Lightbulb className="w-4 h-4 text-yellow-500" />;
    }
    return <Brain className="w-4 h-4 text-purple-500" />;
  };

  const sections = extractReasoningSections(content);

  if (sections.length === 0) {
    return (
      <div className={`reasoning-content prose prose-sm prose-slate dark:prose-invert ${className}`}>
        <div className="text-gray-600 dark:text-gray-400 italic">
          {isStreaming && <span className="animate-pulse">🧠 AI 正在思考...</span>}
          {!isStreaming && content}
        </div>
      </div>
    );
  }

  return (
    <div className={`reasoning-sections space-y-3 ${className}`}>
      {sections.map((section, index) => (
        <div key={index} className="reasoning-section">
          <div className="flex items-center gap-2 mb-2">
            {getHeaderIcon(section.header)}
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {section.header}
            </h4>
          </div>
          <div className="ml-6 text-sm text-gray-600 dark:text-gray-400 prose prose-sm prose-slate dark:prose-invert">
            {section.content}
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 ml-6 text-sm text-gray-500 animate-pulse">
          <Brain className="w-4 h-4" />
          <span>继续分析中...</span>
        </div>
      )}
    </div>
  );
}
