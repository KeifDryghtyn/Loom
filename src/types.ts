export interface Dataset {
  id: string;
  name: string;
  userId: string;
  data: any[];
  columns: string[];
  createdAt: any;
}

export interface WidgetConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'card' | 'heatmap' | 'network' | 'sankey' | 'map';
  title: string;
  datasetId: string;
  config: {
    xField?: string;
    yField?: string;
    labelField?: string;
    valueField?: string;
    colors?: string[];
  };
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  userId: string;
  widgets: WidgetConfig[];
  sharedWith?: string[];
  isPublic?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Analysis {
  id: string;
  datasetId: string;
  report: string;
  summary?: string;
  createdAt: any;
}
