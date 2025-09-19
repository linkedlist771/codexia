import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageSummary } from "@/utils/usageAnalysis";

interface MostUsedModelsCardProps {
  usageData: UsageSummary;
  formatCurrency: (amount: number) => string;
  formatTokens: (tokens: number) => string;
}

export function MostUsedModelsCard({ usageData, formatCurrency, formatTokens }: MostUsedModelsCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-slate-100">最常用模型</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(usageData.modelBreakdown)
            .sort((a, b) => b[1].sessions - a[1].sessions)
            .slice(0, 5)
            .map(([model, data]) => (
              <div key={model} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-200">{model}</span>
                  <span className="text-sm text-slate-400">
                    {data.sessions} 次会话
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="text-emerald-400">{formatCurrency(data.cost)}</span>
                  <span className="text-cyan-400">{formatTokens(data.tokens)} tokens</span>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
