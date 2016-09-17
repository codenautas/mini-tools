"use strict";

var MiniTools = {};

var Path = require('path');
var Promises = require('best-promise');
require('fs-extra');
var fs = require('fs-promise');
var jsYaml = require('js-yaml');
var readYaml = require('read-yaml-promise');

var bestGlobals = require('best-globals');
var changing = bestGlobals.changing;
var send = require('send');

MiniTools.serveErr=function serveErr(req,res,next){
    return function(err){
        if(err.message==='next'){
            return next();
        }
        console.log('ERROR', err);
        console.log('STACK', err.stack);
        var text='ERROR'+(err.code?' '+err.code:'')+': '+err.message+(
            MiniTools.serveErr.sendStack?'\n------------------\n'+err.stack:''
        );
        if(!res.headersSent){
            res.writeHead(err.status || 400, {
                'Content-Length': text.length,
                'Content-Type': 'text/plain; charset=utf-8'
            });
        }else{
            text="\n</script>\n<pre>\n------------------------------------\n"+text;
        }
        res.end(text);
    };
};

MiniTools.preEval=function(expresion, vars, functions){
    var r=/\b([a-zA-Z_]+)(\s*\()?/;
    var ok=true;
    expresion.replace(r,function(_, name, isFun){
        if(!(isFun?functions:vars)[name]){
            ok=false; // may be throw Exception
        }
    });
    return ok; 
};

MiniTools.serveText = function serveText(htmlText,contentTypeText){
    return function(req,res){
        var ct = (contentTypeText||'plain').replace(/^(.*\/)?([^\/]+)$/, function(phrase, first, second){
            return (first||'text/')+second;
        });
        res.setHeader('Content-Type', ct+'; charset=utf-8');
        var buf=new Buffer(htmlText);
        res.setHeader('Content-Length', buf.length);
        res.end(buf);
    };
};

MiniTools.serveFile = function serveFile(fileName,options){
    return function(req,res){
        send(req, fileName, options||{}).pipe(res);
    };
};

function escapeRegExp(string){
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_special_characters
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

MiniTools.serveTransforming = function serveTransforming(pathToFile, anyFileOrOptions, extOriginal, extTarget, renderizer, textType){
    var regExpExtDetect;
    var regExpExtReplace;
    var anyFile;
    var renderOptions;
    if(anyFileOrOptions==null || typeof anyFileOrOptions==="boolean"){
        anyFile=anyFileOrOptions;
    }else{
        anyFile=anyFileOrOptions.anyFile;
        renderOptions=changing(anyFileOrOptions,{anyFile:undefined},changing.options({deletingValue:undefined}));
    }
    if(extOriginal){
        regExpExtDetect =new RegExp('\.'+escapeRegExp(extOriginal)+'$');
        regExpExtReplace=new RegExp('\.'+escapeRegExp(extOriginal)+'$','g');
    }else{
        regExpExtDetect=/^(.*\/)?[^\/\.]+$/;
        regExpExtReplace=/$/g;
    }
    return function(req,res,next){
        if(anyFile && !regExpExtDetect.test(req.path)){
            return next();
        }
        Promises.start(function(){
            var fileName=(pathToFile+(anyFile?'/'+req.path:'')).replace(regExpExtReplace, '.'+extTarget);
            return fs.readFile(fileName, {encoding: 'utf8'});
        }).catch(function(err){
            if(anyFile && err.code==='ENOENT'){
                throw new Error('next');
            }
            throw err;
        }).then(function(fileContent){
            var args=[fileContent];
            if(renderOptions!==undefined){
                args.push(renderOptions);
            }
            return renderizer.render.apply(renderizer,args);
        }).then(function(htmlText){
            MiniTools.serveText(htmlText,textType)(req,res);
        }).catch(MiniTools.serveErr(req,res,next));
    };
};

MiniTools.serveStylus = function serveStylus(pathToFile,anyFile){
/*eslint global-require: 0*/
    return MiniTools.serveTransforming(pathToFile, anyFile, 'css', 'styl', require('stylus'), 'css');
};

MiniTools.serveJade = function serveJade(pathToFile,anyFileOrOptions){
/*eslint global-require: 0*/
    return MiniTools.serveTransforming(pathToFile, anyFileOrOptions, '', 'jade', require('pug'), 'html');
};

MiniTools.serveJson = function serveJson(object){
    return MiniTools.serveText(JSON.stringify(object),'application/json');
};

MiniTools.serveYaml = function serveYaml(object){
    return MiniTools.serveText(jsYaml.safeDump(object),'application/x-yaml');
};

MiniTools.readConfig = function readConfig(listOfFileNamesOrConfigObjects, opts){
    opts = opts || {};
    return Promises.all(listOfFileNamesOrConfigObjects.map(function(fileNameOrObject){
        if(typeof fileNameOrObject==="string"){
            return Promises.start(function(){
                var ext=Path.extname(fileNameOrObject);
                if(ext){
                    return {ext:ext, fileName:fileNameOrObject};
                }else{
                    var exts=Object.keys(MiniTools.readConfig.exts);
                    var searchFileName=function(){
                        return Promises.start(function(){
                            if(!exts.length){
                                if(opts.whenNotExist==='ignore'){
                                    return {ext:"direct", fileName:{}};
                                }else{
                                    return Promises.reject(Error('Config file does not found '+fileNameOrObject));
                                }
                            }
                            var ext=exts.shift();
                            return fs.access(fileNameOrObject+ext,fs.R_OK).then(function(){
                                return {ext:ext, fileName:fileNameOrObject+ext};
                            },searchFileName);
                        });
                    };
                    return searchFileName();
                }
            }).then(function(pair){
                return Promises.start(function(){
                    return MiniTools.readConfig.exts[pair.ext](pair.fileName);
                }).catch(function(err){
                    if(err.code==='ENOENT' && opts.whenNotExist==='ignore'){
                        return {};
                    }
                    throw err;
                });
            });
        }else if(typeof fileNameOrObject==="object" && !(fileNameOrObject instanceof Array)){
            return fileNameOrObject;
        }else{
            return Promises.reject(new Error("readConfig must receive string filename or config object"));
        }
    })).then(function(listOfConfig){
        return listOfConfig.reduce(function(acumConfig, oneConfig){
            return bestGlobals.changing(acumConfig, oneConfig);
        },{});
    });
};

MiniTools.readConfig.exts={
    ".yaml": readYaml,
    ".yml": readYaml,
    ".json": fs.readJson.bind(fs),
    "direct": function(x){ return x; },
};

module.exports=MiniTools;