const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Create MCP server
const mcpServer = new McpServer({
  name: 'example-mcp-server',
  version: '1.0.0'
});

// Tool: get_weather
mcpServer.tool(
  'get_weather',
  'Get the current weather for a city',
  {
    city: { type: 'string', description: 'City name (e.g. "London", "New York")' }
  },
  async ({ city }) => {
    // Mock weather data
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Windy'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const temp = Math.floor(Math.random() * 30) + 5;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            city,
            temperature: `${temp}°C`,
            condition,
            humidity: `${Math.floor(Math.random() * 60) + 30}%`,
            wind: `${Math.floor(Math.random() * 30) + 5} km/h`
          }, null, 2)
        }
      ]
    };
  }
);

// Tool: get_time
mcpServer.tool(
  'get_time',
  'Get the current time in a timezone',
  {
    timezone: {
      type: 'string',
      description: 'IANA timezone (e.g. "America/New_York", "Europe/London"). Defaults to UTC.'
    }
  },
  async ({ timezone }) => {
    const tz = timezone || 'UTC';
    try {
      const time = new Date().toLocaleString('en-US', { timeZone: tz });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ timezone: tz, current_time: time }, null, 2)
          }
        ]
      };
    } catch {
      return {
        content: [{ type: 'text', text: `Invalid timezone: ${tz}` }],
        isError: true
      };
    }
  }
);

// MCP endpoint
const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

app.post('/mcp', async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

app.delete('/mcp', async (req, res) => {
  await transport.handleRequest(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'example-mcp-server', version: '1.0.0' });
});

async function main() {
  await mcpServer.connect(transport);
  app.listen(PORT, () => {
    console.log(`MCP server running on port ${PORT}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  });
}

main().catch(console.error);
