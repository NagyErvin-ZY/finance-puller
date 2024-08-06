import { Request } from "express";

export interface LoggedRequest extends Request {
    requestId: string
}