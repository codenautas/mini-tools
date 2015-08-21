"use strict";

var MiniTools={};

MiniTools.serveErr=function serveErr(req,res,next){
    return function(err){
        if(err.message=='next'){
            return next();
        }
        console.log('ERROR', err);
        console.log('STACK', err.stack);
        var text='ERROR! '+(err.code||'')+'\n'+err.message+'\n------------------\n'+err.stack;
        res.writeHead(400, {
            'Content-Length': text.length,
            'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end(text);
    }
}

MiniTools.preEval=function(expresion, vars, functions){
    var r=/\b([a-zA-Z_]+)(\s*\()?/;
    var ok=true;
    expresion.replace(r,function(_, name, isFun){
        if(!(isFun?functions:vars)[name]){
            ok=false; // may be throw Exception
        }
    });
    return ok; 
}

MiniTools.serveText = function serveText(htmlText,contentTypeText){
    return function(req,res){
        res.setHeader('Content-Type', 'text/'+(contentTypeText||'plain')+'; charset=utf-8');
        var buf=new Buffer(htmlText);
        res.setHeader('Content-Length', buf.length);
        res.end(buf);
    }
}

MiniTools.serveStylus = function serveStylus(pathToFile,anyFile){
    var Promises = require('best-promise');
    var stylus = require('stylus');
    var fs = require('fs-promise');
    return function(req,res,next){
        var regExpExt=/\.css$/g;
        if(anyFile && !regExpExt.test(req.path)){
            return next();
        }
        Promises.start(function(){
            var fileName=(pathToFile+'/'+(anyFile?req.path:'')).replace(regExpExt,'.styl');
            return fs.readFile(fileName, {encoding: 'utf8'});
        }).catch(function(err){
            if(anyFile && err.code==='ENOENT'){
                throw new Error('next');
            }
            throw err;
        }).then(function(fileContent){
            var htmlText=stylus.render(fileContent);
            MiniTools.serveText(htmlText,'css')(req,res);
        }).catch(MiniTools.serveErr(req,res,next));
    }
}

module.exports=MiniTools;