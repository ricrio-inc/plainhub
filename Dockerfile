# PlainHub MCP server, built from the source in cli/ (the same files as the npm package "plainhub").
# docker build -t plainhub-mcp . && docker run -i --rm plainhub-mcp
FROM node:22-slim
WORKDIR /app
COPY cli/package.json ./
RUN npm install --omit=dev --ignore-scripts --no-audit --no-fund
COPY cli/src ./src
ENTRYPOINT ["node", "src/mcp-server.js"]
