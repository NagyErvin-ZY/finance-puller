import { WinstonModuleOptions } from "nest-winston";
import { SERVER_MODE } from "src/shared/enums/config";

export interface IFinancePullerConfig {
    thirdParty: {
        liveCoinWatch: {
            apiKey: string;
            apiUrl: string;
            currency: string;
        },
    },
    database: {
        type: string;
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
        synchronize: boolean;
    }
    server: {
        port: number;
        mode: SERVER_MODE;
    },
    swagger: {
        path: string;
    },
    logging:{
        winston: WinstonModuleOptions
    }
}