import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { UsageSummary } from "@/utils/usageAnalysis";

interface TimelineChartProps {
  usageData: UsageSummary;
  formatCurrency: (amount: number) => string;
  formatTokens: (tokens: number) => string;
}

export function TimelineChart({ usageData, formatCurrency, formatTokens }: TimelineChartProps) {
  const timelineChartData = usageData.timelineData.slice(-30);

  return (
    <Card className="bg-slate-950/50 border-slate-800/50">
      <CardHeader>
        <CardTitle className="text-slate-100">用量时间线（最近 30 天）</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={timelineChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'cost' ? formatCurrency(value as number) : 
                name === 'tokens' ? formatTokens(value as number) : value,
                name
              ]}
            />
            <Line type="monotone" dataKey="cost" stroke="#8884d8" name="费用" />
            <Line type="monotone" dataKey="sessions" stroke="#82ca9d" name="会话" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
