"use strict";

import * as Path from "node:path";
import * as url from 'node:url';
import {promises as fs} from 'node:fs';
import * as FS from 'node:fs';
import * as jsYaml from 'js-yaml';

import * as bestGlobals from 'best-globals';
import {changing} from 'best-globals';
import {expected} from 'cast-error';
import * as send from 'send';
import {Request, Response, NextFunction} from 'express';

export interface AnyErrorDuck extends Error {
    code?: string
    status?: number
    [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type ServeFunction = (req: Request, res:Response)=>void;
export type MiddlewareFunction = (req: Request, res:Response, next:NextFunction)=>void;

export type TransformPromiseFromFileName = ((fileName:string)=> Promise<any>); // eslint-disable-line @typescript-eslint/no-explicit-any

export async function readJson(p:string){
    return fs.readFile(p, 'utf8').then(c => JSON.parse(c))
}

export async function readYaml(fileName:string):Promise<any>{ // eslint-disable-line @typescript-eslint/no-explicit-any
    return fs.readFile(fileName, 'utf8').then(c => jsYaml.load(c))
}

/* tslint:disable:no-object-literal-type-assertion */
export const globalOpts={
    serveErr:{
        propertiesWhiteList:['code'],
        sendStack:false
    },
    logServe:false,
    readConfig:{
        exts:{
            ".yaml": readYaml,
            ".yml": readYaml,
            ".json": readJson,
        } as {[key: string]: TransformPromiseFromFileName}
    }
};
/* tslint:enable:no-object-literal-type-assertion */

const errorList:string[] = [];

export function serveErr(_req:Request,res:Response,next:NextFunction):(err:AnyErrorDuck) => Promise<void>{
    return async function(err:AnyErrorDuck){ // eslint-disable-line @typescript-eslint/require-await
        if(err.message==='next'){
            return next();
        }
        if (errorList.length > 100) errorList.shift();
        let text='ERROR'+(err.code?' '+err.code:'')+': '+err.message;
        if (!errorList.includes(text)) {
            errorList.push(text);
            console.log('ERROR', err);
        }
        globalOpts.serveErr.propertiesWhiteList.forEach(function(attrName){
            if(attrName in err){
                text+='\n'+attrName+': '+JSON.stringify(err[attrName]);
            }
        });
        if(globalOpts.serveErr.sendStack){
            text+='\n------------------\n'+err.stack;
        }
        if(!res.headersSent){
            let buf=Buffer.from(text,'utf8');
            let length=buf.length;
            res.writeHead(err.status || 400, {
                'Content-Length': length,
                'Content-Type': 'text/plain; charset=utf-8'
            });
        }else{
            text+="\n</script>\n<pre>\n------------------------------------\n"+text;
        }
        res.end(text);
    };
}

export type IdentsMap = {[key:string]:boolean};

export function preEval(expresion:string, vars:IdentsMap, functions:IdentsMap):boolean{
    const r=/\b([a-zA-Z_]+)(\s*\()?/;
    let ok=true;
    expresion.replace(r,function(_:string, name:string, isFun:string):string{
        if(!(isFun?functions:vars)[name]){
            ok=false; // may be throw Exception
        }
        return "";
    });
    return ok;
}

export function serveBuffer(buf:Buffer,headers:[type:string, value:string][]):ServeFunction{
    return function(req,res){
        headers.forEach(([type,value]:[type:string, value:string])=>{
            res.setHeader(type, value);
        })
        res.setHeader('Content-Length', buf.length);
        res.end(buf);
    };
}

export function serveImage(imageBuffer:Buffer,headers:[type:string, value:string][]):ServeFunction{
    return serveBuffer(imageBuffer, headers);
}

export function serveText(htmlText:string,contentTypeText:string):ServeFunction{
    let ct = (contentTypeText||'plain').replace(/^(.*\/)?([^/]+)$/, function(phrase, first:string, second:string){
        return (first||'text/')+second;
    });
    return serveBuffer(Buffer.from(htmlText,'utf8'), [['Content-Type', ct+'; charset=utf-8']]);
}

export function serveFile(fileName:string, options:object):ServeFunction{
    return function(req,res){
        send(req, fileName, options||{}).pipe(res);
    }
}

export function escapeRegExp(string:string):string{
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_special_characters
  return string.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/* istanbul ignore next */
export function getTraceroute():string{
    try{
        throw new Error('aca estamos');
    }catch(err){
        const error = expected(err);
        return error.stack?.split('\n')[4]??'';
    }
}

type RenderOptions = {anyFile:boolean, extOriginal:string, trace?:boolean};

function serveTransforming(
    pathToFile:string,
    anyFileOrOptions:null|boolean|RenderOptions,
    extOriginal:string,
    extTarget:string,
    renderizer:{render:Function, args:object},
    textType:string
):MiddlewareFunction{
    let regExpExtDetect:RegExp;
    let regExpExtReplace:RegExp;
    let anyFile:boolean|null;
    let renderOptions:RenderOptions|null=null;
    if(typeof anyFileOrOptions==="boolean"){
        anyFile=anyFileOrOptions;
    }else if(anyFileOrOptions==null){
        /* istanbul ignore next */
        anyFile=null;
    }else{
        anyFile=anyFileOrOptions.anyFile;
        renderOptions=changing(anyFileOrOptions,{anyFile:undefined},changing.options({deletingValue:undefined})) as RenderOptions;
        extOriginal=anyFileOrOptions.extOriginal||extOriginal;
    }
    /* istanbul ignore next */
    let traceRoute=renderOptions?.trace?'serveContent>'+renderOptions.trace:(globalOpts.logServe?getTraceroute():''); // eslint-disable-line sonarjs/no-nested-conditional
    if(extOriginal){
        regExpExtDetect =new RegExp('\.'+escapeRegExp(extOriginal)+'$');
        regExpExtReplace=new RegExp('\.'+escapeRegExp(extOriginal)+'$','g');
    }else{
        regExpExtDetect=/^(.*\/)?[^/.]+$/;
        regExpExtReplace=/$/g;
    }
    return function(req,res,next){
        async function unchainedFunction():Promise<void>{ // eslint-disable-line sonarjs/cognitive-complexity
            try{
                let pathname:string = ('path' in (req as any /*never*/) ? req.path : url.parse(req.url).pathname) as string; // eslint-disable-line @typescript-eslint/no-explicit-any
                /* istanbul ignore next */
                if(traceRoute){
                    console.log('xxxxx-minitools-por-revisar',traceRoute,pathname);
                }
                if(anyFile && !regExpExtDetect.test(pathname)){
                    return next();
                }
                let fileContent;
                try{
                    let fileName=(pathToFile+(anyFile?'/'+pathname:'')).replace(regExpExtReplace, '.'+extTarget);
                    const status = await new Promise(function(resolve){ FS.exists(fileName, resolve); });
                    if (!status){
                        return next();
                    }
                    fileContent = await fs.readFile(fileName, {encoding: 'utf8'});
                }catch(err){
                    const error = expected(err);
                    if(anyFile && error.code==='ENOENT'){
                        /* istanbul ignore next */
                        if(traceRoute){
                            console.log('xxxxx-minitools: no encontre el archivo',traceRoute,pathname);
                        }
                        return next();
                    }
                    throw err;
                }
                let args:any[]=[fileContent]; // eslint-disable-line @typescript-eslint/no-explicit-any
                if(renderOptions!==undefined){
                    args.push(renderOptions);
                }
                let htmlText = await renderizer.render(...args);
                /* istanbul ignore next */
                if(traceRoute){
                    console.log('XXXXXXXX!!!!-xxxxx-minitools: ENVIANDO el archivo',traceRoute,pathname);
                }
                serveText(htmlText,textType)(req,res);
            }catch(err){
                const error = expected(err);
                await serveErr(req,res,next)(error)
            }
        }
        void unchainedFunction();
    };
}

export function serveStylus(pathToFile:string ,anyFile:boolean):MiddlewareFunction{
/*eslint global-require: 0*/
    return serveTransforming(pathToFile, anyFile, 'css', 'styl', require('stylus'), 'css');
}

export function serveJade(pathToFile:string ,anyFileOrOptions:boolean):MiddlewareFunction{
    return serveTransforming(pathToFile, anyFileOrOptions, '', 'jade', require('pug'), 'html');
}

export function serveJson(object:any):MiddlewareFunction{ // eslint-disable-line @typescript-eslint/no-explicit-any
    return serveText(JSON.stringify(object),'application/json');
}

export function serveYaml(object:any):MiddlewareFunction{ // eslint-disable-line @typescript-eslint/no-explicit-any
    return serveText(jsYaml.dump(object),'application/x-yaml');
}

export async function readConfig<T>(listOfFileNamesOrConfigObjects:(string|T)[], opts:{whenNotExist?:'ignore'}={}):Promise<T>{
    let listOfConfig = await Promise.all(listOfFileNamesOrConfigObjects.map(async function(fileNameOrObject){
        type FileNameExtObjOrEmpty = {fileName:string, ext:string}|{empty:true}
        let result:FileNameExtObjOrEmpty;
        if(typeof fileNameOrObject==="string"){
                let ext=Path.extname(fileNameOrObject);
                let exts:string[];
                if(ext){
                    fileNameOrObject=fileNameOrObject.substring(0,fileNameOrObject.length-ext.length);
                    exts=[ext];
                }else{
                    exts=Object.keys(globalOpts.readConfig.exts);
                }
                async function searchFileName():Promise<FileNameExtObjOrEmpty>{
                    if(exts.length){
                        // eslint-disable-next-line sonarjs/todo-tag
                        // TODO: algún día esto no va a ser necesario porque van a implementar los arreglos compactos!
                        const ext=exts.shift() as string;
                        try{
                            await fs.access(fileNameOrObject+ext,fs.constants.R_OK);
                            return {ext:ext, fileName:fileNameOrObject+ext};
                        }catch{ // the file is not readable with this extension, the search continues with the next one
                            return searchFileName();
                        }
                    }else if(opts.whenNotExist==='ignore'){
                        return {empty:true};
                    }else{
                        throw new Error('Config file does not found '+fileNameOrObject);
                    }
                }
                result=await searchFileName();
                if('empty' in result){
                    return {};
                }else{
                    return (globalOpts.readConfig.exts[result.ext] as TransformPromiseFromFileName)(result.fileName);
                }
        }else if(typeof fileNameOrObject==="object" && !(fileNameOrObject instanceof Array)){ // eslint-disable-line unicorn/no-instanceof-builtins
            return fileNameOrObject;
        }else{
            throw new Error("readConfig must receive string filename or config object"); // xeslint-disable-line unicorn/prefer-type-error
        }
    }));
    return listOfConfig.reduce(function(acumConfig, oneConfig){
        return bestGlobals.changing(acumConfig, oneConfig);
    },{});
}
