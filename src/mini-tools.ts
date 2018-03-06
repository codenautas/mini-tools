"use strict";

import * as Path from "path";
import * as url from 'url';
import * as fs from 'fs-extra';
import * as jsYaml from 'js-yaml';

import * as readYaml from 'read-yaml-promise';
// var readYaml = require('read-yaml-promise');

import bestGlobals, {changing} from 'best-globals';
// var changing = bestGlobals.changing;
import send from 'send';
import express, {Request, Response, NextFunction} from 'express';

export interface AnyErrorDuck extends Error {
    code?: string
    status?: number
    [key: string]: any
}

export type ServeFunction = (req: Request, res:Response)=>Promise<void>;
export type MiddlewareFunction = (req: Request, res:Response, next:NextFunction)=>Promise<void>;

export let globalOpts={
    serveErr:{
        propertiesWhiteList:['code'],
        sendStack:false
    },
    logServe:false,
    readConfig:{
        exts:{
            ".yaml": readYaml,
            ".yml": readYaml,
            ".json": fs.readJson.bind(fs)
        }
    }
};

export function serveErr(req:Request,res:Response,next:NextFunction):(err:AnyErrorDuck) => Promise<void>{
    return async function(err:AnyErrorDuck){
        if(err.message==='next'){
            return next();
        }
        console.log('ERROR', err);
        console.log('STACK', err.stack);
        let text='ERROR'+(err.code?' '+err.code:'')+': '+err.message;
        globalOpts.serveErr.propertiesWhiteList.forEach(function(attrName){
            if(attrName in err){
                text+='\n'+attrName+': '+JSON.stringify(err[attrName]);
            }
        });
        if(globalOpts.serveErr.sendStack){
            text+='\n------------------\n'+err.stack;
        }
        if(!res.headersSent){
            let buf=new Buffer(text);
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
};

// MiniTools.preEval=function(expresion, vars, functions){
//     var r=/\b([a-zA-Z_]+)(\s*\()?/;
//     var ok=true;
//     expresion.replace(r,function(_, name, isFun){
//         if(!(isFun?functions:vars)[name]){
//             ok=false; // may be throw Exception
//         }
//     });
//     return ok; 
// };

export function serveText(htmlText:string,contentTypeText:string):ServeFunction{
    return async function(req,res){
        let ct = (contentTypeText||'plain').replace(/^(.*\/)?([^\/]+)$/, function(phrase, first:string, second:string){
            return (first||'text/')+second;
        });
        res.setHeader('Content-Type', ct+'; charset=utf-8');
        let buf=new Buffer(htmlText);
        res.setHeader('Content-Length', buf.length);
        res.end(buf);
    };
};

export function serveFile(fileName,options):ServeFunction{
    return async function(req,res){
        await send(req, fileName, options||{}).pipe(res);
    };
};

export function escapeRegExp(string:string):string{
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_special_characters
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getTraceroute():string{
    try{
        throw new Error('aca estamos');
    }catch(err){
        return err.stack.split('\n')[4];
    }
}

function serveTransforming(
    pathToFile:string, 
    anyFileOrOptions:null|boolean|{anyFile:boolean, extOriginal:string}, 
    extOriginal:string, 
    extTarget:string, 
    renderizer:{render:Function, args:object}, 
    textType:string
):MiddlewareFunction{
    let regExpExtDetect:RegExp;
    let regExpExtReplace:RegExp;
    let anyFile:boolean;
    var renderOptions;
    if(typeof anyFileOrOptions==="boolean"){
        anyFile=anyFileOrOptions;
    }else if(anyFileOrOptions==null){
        anyFile=null;
    }else{
        anyFile=anyFileOrOptions.anyFile;
        renderOptions=changing(anyFileOrOptions,{anyFile:undefined},changing.options({deletingValue:undefined}));
        extOriginal=anyFileOrOptions.extOriginal||extOriginal;
    }
    let traceRoute=renderOptions && renderOptions.trace?'serveContent>'+renderOptions.trace:(globalOpts.logServe?getTraceroute():'');
    if(extOriginal){
        regExpExtDetect =new RegExp('\.'+escapeRegExp(extOriginal)+'$');
        regExpExtReplace=new RegExp('\.'+escapeRegExp(extOriginal)+'$','g');
    }else{
        regExpExtDetect=/^(.*\/)?[^\/\.]+$/;
        regExpExtReplace=/$/g;
    }
    return async function(req,res,next){
        try{
            let pathname = 'path' in req ? req.path : url.parse(req.url).pathname;
            if(traceRoute){
                console.log('xxxxx-minitools-por-revisar',traceRoute,pathname);
            }
            if(anyFile && !regExpExtDetect.test(pathname)){
                return next();
            }
            var sfn;
            var fileContent;
            try{
                let fileName=(pathToFile+(anyFile?'/'+pathname:'')).replace(regExpExtReplace, '.'+extTarget);
                sfn=fileName;
                fileContent = await fs.readFile(fileName, {encoding: 'utf8'});
            }catch(err){
                if(anyFile && err.code==='ENOENT'){
                    if(traceRoute){
                        console.log('xxxxx-minitools: no encontre el archivo',traceRoute,pathname);
                    }
                    throw new Error('next');
                }
                throw err;
            }
            let args=[fileContent];
            if(renderOptions!==undefined){
                args.push(renderOptions);
            }
            let htmlText = await renderizer.render.apply(renderizer,args);
            if(traceRoute){
                console.log('XXXXXXXX!!!!-xxxxx-minitools: ENVIANDO el archivo',traceRoute,pathname);
            }
            await serveText(htmlText,textType)(req,res);
        }catch(err){
            serveErr(req,res,next)(err)
        };
    };
};

export function serveStylus(pathToFile,anyFile):MiddlewareFunction{
/*eslint global-require: 0*/
    return serveTransforming(pathToFile, anyFile, 'css', 'styl', require('stylus'), 'css');
}

export function serveJade(pathToFile,anyFileOrOptions):MiddlewareFunction{
/*eslint global-require: 0*/
    return serveTransforming(pathToFile, anyFileOrOptions, '', 'jade', require('pug'), 'html');
}

export function serveJson(object):MiddlewareFunction{
    return serveText(JSON.stringify(object),'application/json');
};

export function serveYaml(object):MiddlewareFunction{
    return serveText(jsYaml.safeDump(object),'application/x-yaml');
};

export async function readConfig(listOfFileNamesOrConfigObjects:(string|object)[], opts:{whenNotExist?:string}={}):Promise<object>{
    let listOfConfig = await listOfFileNamesOrConfigObjects.map(async function(fileNameOrObject){
        let result:{fileName?:string, ext?:string, empty?:boolean};
        if(typeof fileNameOrObject==="string"){
                let ext=Path.extname(fileNameOrObject);
                let exts:string[];
                if(ext){
                    exts=[ext];
                }else{
                    exts=Object.keys(globalOpts.readConfig.exts);
                    async function searchFileName(){
                        if(!exts.length){
                            if(opts.whenNotExist==='ignore'){
                                return {empty:true};
                            }else{
                                throw new Error('Config file does not found '+fileNameOrObject);
                            }
                        }
                        var ext=exts.shift();
                        try{
                            await fs.access(fileNameOrObject+ext,fs.R_OK);
                            return {ext:ext, fileName:fileNameOrObject+ext};
                        }catch(err){
                            return await searchFileName();
                        }
                    }
                    result=await searchFileName();
                    if(result.empty){
                        return {};
                    }
                    return await globalOpts.readConfig.exts[result.ext](result.fileName);
                }
        }else if(typeof fileNameOrObject==="object" && !(fileNameOrObject instanceof Array)){
            return fileNameOrObject;
        }else{
            throw new Error("readConfig must receive string filename or config object");
        }
    });
    return listOfConfig.reduce(function(acumConfig, oneConfig){
        return bestGlobals.changing(acumConfig, oneConfig);
    },{});
};

