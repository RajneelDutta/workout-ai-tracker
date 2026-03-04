import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type Props = {
  STR: number;
  END: number;
  AGI: number;
  FLX: number;
};

export function StatRadar({ STR, END, AGI, FLX }: Props) {
  const max = Math.max(STR, END, AGI, FLX, 100);
  const data = [
    { stat: "STR", value: STR },
    { stat: "END", value: END },
    { stat: "AGI", value: AGI },
    { stat: "FLX", value: FLX },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="stat"
          tick={{ fontSize: 12, fontWeight: 600 }}
        />
        <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
