import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsageSummary } from "@/utils/usageAnalysis";

interface TokenBreakdownCardProps {
  usageData: UsageSummary;
  formatTokens: (tokens: number) => string;
}

export function TokenBreakdownCard({ usageData, formatTokens }: TokenBreakdownCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-slate-100">Token 构成</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">输入 Tokens</span>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
              {formatTokens(usageData.inputTokens)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">输出 Tokens</span>
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
              {formatTokens(usageData.outputTokens)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">缓存写入</span>
            <Badge variant="outline" className="border-purple-500/50 text-purple-400">
              {formatTokens(usageData.cacheWriteTokens)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">缓存读取</span>
            <Badge variant="outline" className="border-orange-500/50 text-orange-400">
              {formatTokens(usageData.cacheReadTokens)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
