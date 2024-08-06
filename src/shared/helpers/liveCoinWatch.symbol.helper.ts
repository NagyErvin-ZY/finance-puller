import config from "src/config/config";

export function composeLiveCoinWatchSymbolName(base: string): string {
    return `${base.toUpperCase()}${config().thirdParty.liveCoinWatch.currency}`;
}