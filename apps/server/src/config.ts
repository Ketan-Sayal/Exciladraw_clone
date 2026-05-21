import * as dotenv from "dotenv";

dotenv.config();

const requiredEnv = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

const parsePort = (value: string | undefined, fallback: number) => {
    const port = Number(value ?? fallback);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid PORT value: ${value}`);
    }
    return port;
};

export const config = {
    port: parsePort(process.env.PORT, 3001),
    jwt_secret: requiredEnv("JWT_SECRET"),
    database_url: requiredEnv("DATABASE_URL"),
}
