import { IsCron } from "@kovalenko/is-cron";
import { IsString } from "class-validator";

export class StartFetchDto {
    @IsString()
    @IsCron({
        override:{
            useSeconds: true
        }
    })
    intervalCron: string;
}