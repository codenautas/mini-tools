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
    var matches=expresion.match(/\b[a-zA-Z_]+(?:\s*\()?/g);
    console.log('expresion',expresion);
    console.log('matches',matches,!matches);
    if(!matches) return true;
    for(var i=0; i<matches.length; i++){
        var match=matches[i];
        if(match.substr(-1)==='('){
            console.log('function',match,match.substring(0,match.length-1).trim());
            if(!functions[match.substring(0,match.length-1).trim()]) return false;
        }else{
            console.log('var',match,!vars[match]);
            if(!vars[match]) return false;
        }
    }
    return true;
}


module.exports=MiniTools;