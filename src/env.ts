import dotenv from "dotenv";
dotenv.config();

export type Env = {
  mysql: {
    host: string;
    username: string;
    password: string;
    port: number;
    database: string;
  };
  reddit: {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
    userAgent: string;
  };
  azure: {
    endpoint: string;
    apiKey: string;
    modelName: string;
  };
  ollama: {
    host: string;
    model: string;
  };
};

export function parseEnv(): Env {
  const env = {
    mysql: {
      host: process.env.MYSQL_HOST || "",
      username: process.env.MYSQL_USERNAME || "",
      password: process.env.MYSQL_PASSWORD || "",
      port: parseInt(process.env.MYSQL_PORT || "3306"),
      database: process.env.MYSQL_DATABASE || "",
    },
    reddit: {
      clientId: process.env.REDDIT_CLIENT_ID || "",
      clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
      username: process.env.REDDIT_USERNAME || "",
      password: process.env.REDDIT_PASSWORD || "",
      userAgent: process.env.REDDIT_USER_AGENT || "",
    },
    azure: {
      endpoint: process.env.AZURE_ENDPOINT || "",
      apiKey: process.env.AZURE_API_KEY || "",
      modelName: process.env.AZURE_MODEL_NAME || "",
    },
    ollama: {
      host: process.env.OLLAMA_HOST || "",
      model: process.env.OLLAMA_MODEL || "",
    },
  };

  return env;
}
