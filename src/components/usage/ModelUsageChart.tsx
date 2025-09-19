import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { UsageSummary } from "@/utils/usageAnalysis";

interface ModelUsageChartProps {
  usageData: UsageSummary;
  formatCurrency: (amount: number) => string;
  formatTokens: (tokens: number) => string;
}

export function ModelUsageChart({ usageData, formatCurrency, formatTokens }: ModelUsageChartProps) {
  const modelChartData = Object.entries(usageData.modelBreakdown).map(([model, data]) => ({
    name: model,
    sessions: data.sessions,
    cost: data.cost,
    tokens: data.tokens,
  }));

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-slate-100">按模型统计</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={modelChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'cost' ? formatCurrency(value as number) : 
                name === 'tokens' ? formatTokens(value as number) : value,
                name
              ]}
            />
            <Bar dataKey="sessions" fill="#8884d8" name="会话" />
            <Bar dataKey="cost" fill="#82ca9d" name="费用" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
