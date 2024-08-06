import { parseEnv } from "src/shared/helpers/config.helper";
import { IFinancePullerConfig } from "./config.type";
import { format } from "logform"
import { SERVER_MODE } from "src/shared/enums/config";
import { transport, transports } from "winston"

export default (): IFinancePullerConfig => ({
    thirdParty: {
        liveCoinWatch: {
            apiKey: parseEnv<string>('LIVECOINWATCH_API_KEY', null),
            apiUrl: parseEnv<string>('LIVECOINWATCH_API_URL', 'https://api.livecoinwatch.com'),
            currency: parseEnv<string>('LIVECOINWATCH_API_PULL_CURRENCY', 'USD'),
        },
    },
    database: {
        type: parseEnv<string>('DB_TYPE', 'postgres'),
        host: parseEnv<string>('DB_HOST', 'localhost'),
        port: parseEnv<number>('DB_PORT', 5432),
        username: parseEnv<string>('DB_USERNAME', 'postgres'),
        password: parseEnv<string>('DB_PASSWORD', 'postgres'),
        database: parseEnv<string>('DB_NAME', 'postgres'),
        synchronize: parseEnv<boolean>('DB_SYNCHRONIZE', true),
    },
    swagger: {
        path: parseEnv<string>('SWAGGER_PATH', 'api-docs'),
    },
    server: {
        port: parseEnv<number>('SERVER_PORT', 3000),
        mode: parseEnv<SERVER_MODE>('SERVER_MODE', SERVER_MODE.DEVELOPMENT)
    },
    logging: {
        winston: {
            level: parseEnv<SERVER_MODE>('SERVER_MODE', SERVER_MODE.DEVELOPMENT) == 
                SERVER_MODE.DEVELOPMENT ? 'debug' : 'info',
            format: format.combine(
                format.metadata(),
                format.timestamp(),
                format.json({ space: 4 }),
                format.colorize(),
            ),
            defaultMeta: { service: "finance-puller" },
            transports: [
                new transports.Console(),
            ]
        }
    }
});