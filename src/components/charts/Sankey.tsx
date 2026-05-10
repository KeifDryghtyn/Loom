import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal, sankeyCenter } from 'd3-sankey';

interface SankeyProps {
  data: any[];
  sourceField: string;
  targetField: string;
  valueField?: string;
}

export default function Sankey({ data, sourceField, targetField, valueField }: SankeyProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    // Format data for Sankey
    const linksData = data.map(d => ({
      source: String(d[sourceField]),
      target: String(d[targetField]),
      value: valueField ? Number(d[valueField]) : 1
    })).filter(l => l.source && l.target && !isNaN(l.value));

    const nodesData = Array.from(new Set(linksData.flatMap(l => [l.source, l.target])))
      .map(name => ({ name }));

    const nodeMap = new Map(nodesData.map((d, i) => [d.name, i]));
    
    const formattedLinks = linksData.map(l => ({
      source: nodeMap.get(l.source)!,
      target: nodeMap.get(l.target)!,
      value: l.value
    }));

    const sankey = d3Sankey<any, any>()
      .nodeId(d => d.index)
      .nodeAlign(sankeyCenter)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 5]]);

    const { nodes, links } = sankey({
      nodes: nodesData.map((d, i) => ({ ...d, index: i })),
      links: formattedLinks
    });

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    svg.append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.6)
      .selectAll("g")
      .data(links)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", d => color(d.source.name))
      .attr("stroke-width", d => Math.max(1, d.width));

    svg.append("g")
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", d => color(d.name))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .append("title")
      .text(d => `${d.name}\n${d.value}`);

    svg.append("g")
      .style("font", "10px sans-serif")
      .style("font-weight", "bold")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name)
      .attr("fill", "#1e293b");

  }, [data, sourceField, targetField, valueField]);

  return <svg ref={svgRef} className="w-full h-full" />;
}
