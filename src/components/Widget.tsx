import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { WidgetConfig } from '../types';
import Heatmap from './charts/Heatmap';
import Network from './charts/Network';
import Sankey from './charts/Sankey';
import GeoMap from './charts/GeoMap';

const COLORS = ['#0f172a', '#2563eb', '#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

export default function Widget({ widget, data }: { widget: WidgetConfig; data: any[] }) {
  const renderChart = () => {
    const { type, config } = widget;
    const { xField = '', yField = '', labelField = '', valueField = ''} = config;

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey={xField} stroke="#475569" fontSize={10} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              <Line type="monotone" dataKey={yField} stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey={xField} stroke="#475569" fontSize={10} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              <Bar dataKey={yField} fill="#2563eb" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <PieChart>
              <Pie
                data={data}
                dataKey={yField || valueField || 'value'}
                nameKey={xField || labelField || 'name'}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
        <ResponsiveContainer width="100%" height="100%" debounce={100}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis type="number" dataKey={xField} stroke="#475569" fontSize={10} axisLine={{ stroke: '#cbd5e1' }} name={xField} />
              <YAxis type="number" dataKey={yField} stroke="#475569" fontSize={10} axisLine={{ stroke: '#cbd5e1' }} name={yField} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Scatter name={widget.title} data={data} fill="#2563eb" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'heatmap':
        return <Heatmap data={data} xField={xField} yField={yField} zField={valueField || yField} />;
      case 'network':
        return <Network data={data} sourceField={xField} targetField={yField} />;
      case 'sankey':
        return <Sankey data={data} sourceField={xField} targetField={yField} valueField={valueField || (yField === xField ? undefined : yField)} />;
      case 'map':
        return <GeoMap data={data} latField={xField} lngField={yField} labelField={labelField || xField} valueField={valueField || yField} />;
      default:
        return <div className="flex items-center justify-center h-full text-slate-300 font-bold uppercase tracking-widest text-[10px]">Structure Pending</div>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-6 flex items-center justify-between border-b border-slate-100 pb-2">
        {widget.title}
        <span className="text-[9px] text-slate-400 font-mono">/ {widget.type}</span>
      </h4>
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">
          {renderChart()}
        </div>
      </div>
    </div>
  );
}

