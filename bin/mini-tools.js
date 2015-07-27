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

modules.exports=MiniTools;