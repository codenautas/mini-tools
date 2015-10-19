"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */

var MiniTools = {};

MiniTools.serveErr=function serveErr(req,res,next){
    return function(err){
        if(err.message=='next'){
            return next();
        }
        console.log('ERROR', err);
        console.log('STACK', err.stack);
        var text='ERROR! '+(err.code||'')+'\n'+err.message+'\n------------------\n'+err.stack;
        if(!res.headersSent){
            res.writeHead(400, {
                'Content-Length': text.length,
                'Content-Type': 'text/plain; charset=utf-8'
            });
        }else{
            text+="\n</script>\n<pre>\n------------------------------------\n";
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
        res.setHeader('Content-Type', 'text/'+(contentTypeText||'plain')+'; charset=utf-8');
        var buf=new Buffer(htmlText);
        res.setHeader('Content-Length', buf.length);
        res.end(buf);
    };
};

function escapeRegExp(string){
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_special_characters
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

MiniTools.serveTransforming = function serveTransforming(pathToFile, anyFile, extOriginal, extTarget, renderizer, textType){
    var Promises = require('best-promise');
    var fs = require('fs-promise');
    var regExpExtDetect;
    var regExpExtReplace;
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
            var htmlText=renderizer.render(fileContent);
            MiniTools.serveText(htmlText,textType)(req,res);
        }).catch(MiniTools.serveErr(req,res,next));
    };
};

MiniTools.serveStylus = function serveStylus(pathToFile,anyFile){
    var stylus = require('stylus');
    return MiniTools.serveTransforming(pathToFile, anyFile, 'css', 'styl', stylus, 'css');
};


MiniTools.serveJade = function serveJade(pathToFile,anyFile){
    var jade = require('jade');
    return MiniTools.serveTransforming(pathToFile, anyFile, '', 'jade', jade, 'html');
};

module.exports=MiniTools;