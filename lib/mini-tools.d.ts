/// <reference types="express" />
import { Request, Response, NextFunction } from 'express';
export interface AnyErrorDuck extends Error {
    code?: string;
    status?: number;
    [key: string]: any;
}
export declare type ServeFunction = (req: Request, res: Response) => Promise<void>;
export declare type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare let globalOpts: {
    serveErr: {
        propertiesWhiteList: string[];
        sendStack: boolean;
    };
    logServe: boolean;
    readConfig: {
        exts: {
            ".yaml": any;
            ".yml": any;
            ".json": any;
        };
    };
};
export declare function serveErr(req: Request, res: Response, next: NextFunction): (err: AnyErrorDuck) => Promise<void>;
export declare function serveText(htmlText: string, contentTypeText: string): ServeFunction;
export declare function serveFile(fileName: any, options: any): ServeFunction;
export declare function escapeRegExp(string: string): string;
export declare function getTraceroute(): string;
export declare function serveStylus(pathToFile: any, anyFile: any): MiddlewareFunction;
export declare function serveJade(pathToFile: any, anyFileOrOptions: any): MiddlewareFunction;
export declare function serveJson(object: any): MiddlewareFunction;
export declare function serveYaml(object: any): MiddlewareFunction;
export declare function readConfig(listOfFileNamesOrConfigObjects: (string | object)[], opts?: {
    whenNotExist?: string;
}): Promise<object>;
