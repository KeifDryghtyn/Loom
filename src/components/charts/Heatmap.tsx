import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

interface HeatmapProps {
  data: any[];
  xField: string;
  yField: string;
  zField?: string;
}

export default function Heatmap({ data, xField, yField, zField }: HeatmapProps) {
  // For a heatmap with Recharts, we can use ScatterChart with color based on value
  // We need to normalize data if it's not already in X, Y, Z format
  const chartData = useMemo(() => {
    return data.map(d => ({
      x: d[xField],
      y: d[yField],
      z: zField ? Number(d[zField]) : 1
    }));
  }, [data, xField, yField, zField]);

  const maxZ = Math.max(...chartData.map(d => d.z), 1);

  const getColor = (z: number) => {
    const ratio = z / maxZ;
    // Yellow to Orange/Red gradient for better visibility
    const r = Math.round(254 + (220 - 254) * ratio);
    const g = Math.round(240 + (38 - 240) * ratio);
    const b = Math.round(177 + (38 - 177) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%" debounce={100}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
        <XAxis type="category" dataKey="x" name={xField} stroke="#475569" fontSize={10} axisLine={{ stroke: '#cbd5e1' }} />
        <YAxis type="category" dataKey="y" name={yField} stroke="#475569" fontSize={10} axisLine={{ stroke: '#cbd5e1' }} />
        <ZAxis type="number" dataKey="z" range={[100, 600]} name={zField || 'value'} />
        <Tooltip 
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
        />
        <Scatter name="Heatmap" data={chartData}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.z)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
