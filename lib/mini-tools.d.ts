import { Request, Response, NextFunction } from 'express';
export interface AnyErrorDuck extends Error {
    code?: string;
    status?: number;
    [key: string]: any;
}
export type ServeFunction = (req: Request, res: Response) => void;
export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;
export type TransformPromiseFromFileName = ((fileName: string) => Promise<any>);
export declare function readJson(p: string): Promise<any>;
export declare let globalOpts: {
    serveErr: {
        propertiesWhiteList: string[];
        sendStack: boolean;
    };
    logServe: boolean;
    readConfig: {
        exts: {
            [key: string]: TransformPromiseFromFileName;
        };
    };
};
export declare function serveErr(_req: Request, res: Response, next: NextFunction): (err: AnyErrorDuck) => Promise<void>;
export type IdentsMap = {
    [key: string]: boolean;
};
export declare function preEval(expresion: string, vars: IdentsMap, functions: IdentsMap): boolean;
export declare function serveBuffer(buf: Buffer, headers: [type: string, value: string][]): ServeFunction;
export declare function serveImage(imageBuffer: Buffer, headers: [type: string, value: string][]): ServeFunction;
export declare function serveText(htmlText: string, contentTypeText: string): ServeFunction;
export declare function serveFile(fileName: string, options: object): ServeFunction;
export declare function escapeRegExp(string: string): string;
export declare function getTraceroute(): string;
export declare function serveStylus(pathToFile: string, anyFile: boolean): MiddlewareFunction;
export declare function serveJade(pathToFile: string, anyFileOrOptions: boolean): MiddlewareFunction;
export declare function serveJson(object: any): MiddlewareFunction;
export declare function serveYaml(object: any): MiddlewareFunction;
export declare function readConfig<T>(listOfFileNamesOrConfigObjects: (string | T)[], opts?: {
    whenNotExist?: 'ignore';
}): Promise<T>;
