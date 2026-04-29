import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useGameStore } from '../store/gameStore'

export function PopulationChart() {
  const { colony } = useGameStore()
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!colony || colony.history.length === 0 || !svgRef.current) return

    const margin = { top: 20, right: 30, bottom: 30, left: 60 }
    const width = 800 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3
      .scaleLinear()
      .domain(
        d3.extent(colony.history, (d) => d.year) as [number, number],
      )
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(colony.history, (d) => d.population) as number])
      .range([height, 0])

    const line = d3
      .line<any>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.population))

    g.append('path')
      .datum(colony.history)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line)

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))

    g.append('g').call(d3.axisLeft(yScale))

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 30)
      .attr('text-anchor', 'middle')
      .text('Year')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text('Population')
  }, [colony])

  if (!colony) return null

  return (
    <div className="bg-white shadow p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">Population over Time</h2>
      <svg
        ref={svgRef}
        width="800"
        height="300"
        style={{ border: '1px solid #ccc' }}
      />
    </div>
  )
}
