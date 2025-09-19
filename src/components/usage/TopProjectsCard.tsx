import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsageSummary } from "@/utils/usageAnalysis";

interface TopProjectsCardProps {
  usageData: UsageSummary;
  formatCurrency: (amount: number) => string;
  formatTokens: (tokens: number) => string;
}

export function TopProjectsCard({ usageData, formatCurrency, formatTokens }: TopProjectsCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-slate-100">热门项目</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(usageData.projectBreakdown)
            .sort((a, b) => b[1].cost - a[1].cost)
            .slice(0, 5)
            .map(([project, data]) => (
              <div key={project} className="flex items-center justify-between p-3 border border-border bg-muted/30 rounded">
                <div>
                  <p className="font-medium text-slate-200">{project}</p>
                  <p className="text-sm text-slate-400">
                    <span className="text-cyan-400">{data.sessions} 次会话</span> • <span className="text-purple-400">{formatTokens(data.tokens)} tokens</span>
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                  {formatCurrency(data.cost)}
                </Badge>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
