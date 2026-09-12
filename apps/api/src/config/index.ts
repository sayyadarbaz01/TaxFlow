import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const uploadDir = process.env.STORAGE_UPLOAD_DIR || path.resolve(process.cwd(), "storage");
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  // Directory fallback handled gracefully
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  appUrl: process.env.APP_URL || "http://localhost:3000",
  apiUrl: process.env.API_URL || "http://localhost:5000",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/casaas_db?schema=public",

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "super-secret-access-token-key-32-chars-min",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "super-secret-refresh-token-key-32-chars-min",
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d"
  },

  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || "mock",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "mock_whatsapp_access_token",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "100200300400",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "casaas_verify_token_123"
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    chatModel: process.env.OLLAMA_CHAT_MODEL || "llama3.1:8b",
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text"
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || "local",
    uploadDir,
    minioEndpoint: process.env.MINIO_ENDPOINT || "localhost",
    minioAccessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    minioSecretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    minioBucket: process.env.MINIO_BUCKET || "casaas-docs"
  }
};
