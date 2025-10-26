import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
// Configure WebSocket with SSL certificate handling for Replit environment
class CustomWebSocket extends ws {
    constructor(address, protocols) {
        super(address, protocols, {
            rejectUnauthorized: false // Accept self-signed certificates in development
        });
    }
}
neonConfig.webSocketConstructor = CustomWebSocket;
// Disable pipelining to use regular HTTP pooling instead of WebSocket
neonConfig.pipelineConnect = false;
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
