import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useGameStore } from '../store/gameStore'
import { YearSnapshot } from '../engine/types'

const margin = { top: 20, right: 30, bottom: 30, left: 60 }
const width = 800 - margin.left - margin.right
const height = 300 - margin.top - margin.bottom

export function PopulationChart() {
  const { colony } = useGameStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const initialized = useRef(false)

  // Build static structure once on mount.
  useEffect(() => {
    if (!svgRef.current || initialized.current) return
    initialized.current = true

    const svg = d3.select(svgRef.current)
    const g = svg
      .append('g')
      .attr('class', 'chart-root')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    g.append('path').attr('class', 'pop-line').attr('fill', 'none').attr('stroke', 'steelblue').attr('stroke-width', 2)
    g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${height})`)
    g.append('g').attr('class', 'y-axis')
    g.append('text').attr('class', 'x-label').attr('x', width / 2).attr('y', height + 30).attr('text-anchor', 'middle').text('Year')
    g.append('text').attr('class', 'y-label').attr('transform', 'rotate(-90)').attr('x', -height / 2).attr('y', -40).attr('text-anchor', 'middle').text('Population')
  }, [])

  // Update data and axes whenever history changes.
  useEffect(() => {
    if (!svgRef.current || !colony || colony.history.length === 0) return

    const svg = d3.select(svgRef.current)
    const history: YearSnapshot[] = colony.history

    const xScale = d3.scaleLinear().domain(d3.extent(history, (d) => d.year) as [number, number]).range([0, width])
    const yScale = d3.scaleLinear().domain([0, d3.max(history, (d) => d.population) as number]).range([height, 0])

    const line = d3.line<YearSnapshot>().x((d) => xScale(d.year)).y((d) => yScale(d.population))

    svg.select<SVGPathElement>('.pop-line').datum(history).attr('d', line)
    
    // Only show integer year ticks without decimal places
    const xDomain = xScale.domain()
    const tickValues = d3.range(Math.ceil(xDomain[0]), Math.floor(xDomain[1]) + 1)
    svg.select<SVGGElement>('.x-axis').call(
      d3.axisBottom(xScale)
        .tickValues(tickValues)
        .tickFormat(d3.format('d')) // Format as integers without .0
    )
    
    svg.select<SVGGElement>('.y-axis').call(d3.axisLeft(yScale))
  }, [colony])

  if (!colony) return null

  return (
    <div className="bg-white shadow p-4 rounded mb-4">
      <h2 className="text-xl font-bold mb-4">Population over Time</h2>
      <svg ref={svgRef} width="800" height="300" style={{ border: '1px solid #ccc' }} />
    </div>
  )
}
