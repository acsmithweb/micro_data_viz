/**
 * vde-sample-datasets.js
 * Curated built-in sample datasets for rapid D3.js chart prototyping.
 */

window.VDE_SAMPLE_DATASETS = [
    {
        id: 'regional-revenue',
        name: 'Regional Revenue & Cloud Spend',
        defaultX: 'Quarter',
        defaultY: 'Revenue',
        defaultGroup: 'Region',
        defaultChart: 'Grouped Bar Chart',
        columns: ['Quarter', 'Region', 'Revenue', 'Cost', 'Customers'],
        data: [
            { Quarter: '2026-01-15', Region: 'North America', Revenue: 142000, Cost: 54000, Customers: 420 },
            { Quarter: '2026-01-15', Region: 'Europe', Revenue: 98000, Cost: 39000, Customers: 310 },
            { Quarter: '2026-01-15', Region: 'APAC', Revenue: 76000, Cost: 28000, Customers: 245 },
            { Quarter: '2026-04-15', Region: 'North America', Revenue: 168000, Cost: 59000, Customers: 490 },
            { Quarter: '2026-04-15', Region: 'Europe', Revenue: 112000, Cost: 43000, Customers: 355 },
            { Quarter: '2026-04-15', Region: 'APAC', Revenue: 94000, Cost: 33000, Customers: 298 },
            { Quarter: '2026-07-15', Region: 'North America', Revenue: 189000, Cost: 64000, Customers: 545 },
            { Quarter: '2026-07-15', Region: 'Europe', Revenue: 131000, Cost: 47000, Customers: 402 },
            { Quarter: '2026-07-15', Region: 'APAC', Revenue: 118000, Cost: 39000, Customers: 360 },
            { Quarter: '2026-10-15', Region: 'North America', Revenue: 224000, Cost: 71000, Customers: 620 },
            { Quarter: '2026-10-15', Region: 'Europe', Revenue: 154000, Cost: 52000, Customers: 468 },
            { Quarter: '2026-10-15', Region: 'APAC', Revenue: 141000, Cost: 45000, Customers: 415 }
        ]
    },
    {
        id: 'conversion-funnel',
        name: 'Product Conversion Funnel',
        defaultX: 'Stage',
        defaultY: 'Users',
        defaultGroup: 'Channel',
        defaultChart: 'Funnel Chart',
        columns: ['Stage', 'Users', 'AvgTimeSec', 'Channel'],
        data: [
            { Stage: 'Visited Landing', Users: 24500, AvgTimeSec: 42, Channel: 'Organic' },
            { Stage: 'Started Trial', Users: 14800, AvgTimeSec: 128, Channel: 'Organic' },
            { Stage: 'Created Workspace', Users: 9200, AvgTimeSec: 265, Channel: 'Product' },
            { Stage: 'Imported Dataset', Users: 5640, AvgTimeSec: 410, Channel: 'Product' },
            { Stage: 'Converted Paid', Users: 2380, AvgTimeSec: 590, Channel: 'Sales' }
        ]
    },
    {
        id: 'service-latency',
        name: 'API Latency Distribution (ms)',
        defaultX: 'Service',
        defaultY: 'LatencyMs',
        defaultGroup: 'Environment',
        defaultChart: 'Box Plot',
        columns: ['Service', 'LatencyMs', 'Throughput', 'Environment'],
        data: [
            { Service: 'Auth', LatencyMs: 18, Throughput: 1200, Environment: 'Prod' },
            { Service: 'Auth', LatencyMs: 22, Throughput: 1250, Environment: 'Prod' },
            { Service: 'Auth', LatencyMs: 25, Throughput: 1180, Environment: 'Prod' },
            { Service: 'Auth', LatencyMs: 31, Throughput: 1320, Environment: 'Prod' },
            { Service: 'Auth', LatencyMs: 64, Throughput: 980, Environment: 'Staging' },
            { Service: 'Query', LatencyMs: 44, Throughput: 860, Environment: 'Prod' },
            { Service: 'Query', LatencyMs: 52, Throughput: 890, Environment: 'Prod' },
            { Service: 'Query', LatencyMs: 59, Throughput: 820, Environment: 'Prod' },
            { Service: 'Query', LatencyMs: 74, Throughput: 760, Environment: 'Staging' },
            { Service: 'Query', LatencyMs: 135, Throughput: 610, Environment: 'Staging' },
            { Service: 'Ingest', LatencyMs: 32, Throughput: 1900, Environment: 'Prod' },
            { Service: 'Ingest', LatencyMs: 38, Throughput: 1850, Environment: 'Prod' },
            { Service: 'Ingest', LatencyMs: 41, Throughput: 1790, Environment: 'Prod' },
            { Service: 'Ingest', LatencyMs: 48, Throughput: 1720, Environment: 'Staging' },
            { Service: 'Export', LatencyMs: 85, Throughput: 310, Environment: 'Prod' },
            { Service: 'Export', LatencyMs: 92, Throughput: 295, Environment: 'Prod' },
            { Service: 'Export', LatencyMs: 108, Throughput: 270, Environment: 'Staging' },
            { Service: 'Export', LatencyMs: 145, Throughput: 240, Environment: 'Staging' }
        ]
    },
    {
        id: 'capability-radar',
        name: 'Platform Benchmark Radar',
        defaultX: 'Metric',
        defaultY: 'Score',
        defaultGroup: 'Build',
        defaultChart: 'Radar Chart',
        columns: ['Metric', 'Score', 'Build'],
        data: [
            { Metric: 'Throughput', Score: 92, Build: 'v2.4' },
            { Metric: 'Reliability', Score: 88, Build: 'v2.4' },
            { Metric: 'Memory', Score: 81, Build: 'v2.4' },
            { Metric: 'Cold Start', Score: 76, Build: 'v2.4' },
            { Metric: 'Query Speed', Score: 94, Build: 'v2.4' },
            { Metric: 'Compression', Score: 85, Build: 'v2.4' },
            { Metric: 'Throughput', Score: 74, Build: 'v1.9' },
            { Metric: 'Reliability', Score: 79, Build: 'v1.9' },
            { Metric: 'Memory', Score: 68, Build: 'v1.9' },
            { Metric: 'Cold Start', Score: 62, Build: 'v1.9' },
            { Metric: 'Query Speed', Score: 71, Build: 'v1.9' },
            { Metric: 'Compression', Score: 73, Build: 'v1.9' }
        ]
    }
];
