"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-disable no-console */

// APP

var express = require('express');
var app = express();
var MiniTools = require('..');

app.use(function(req,res,next){
    console.log('***************************');
    console.dir(req,{depth:0});
    console.log('req.cookies',req.cookies);
    console.log('req.query  ',req.query  );
    console.log('req.body   ',req.body   );
    console.log('req.params ',req.params );
    console.log('req.headers',req.headers);
    // console.dir(res,{depth:0});
    next();
});


app.use('/index', MiniTools.serveJade('example/public/index',false));
app.use('/public', MiniTools.serveJade('example/public',true));
app.use('/public', MiniTools.serveStylus('example/public',true));

var actualConfig;

Promise.resolve().then(function(){
    // return readYaml('example/global-config.yaml',{encoding: 'utf8'});
}).then(function(/*globalConfig*/){
    /*
    actualConfig=globalConfig;
    return readYaml('example/local-config.yaml',{encoding: 'utf8'}).catch(function(err){
        if(err.code!=='ENOENT'){
            throw err;
        }
        return {};
    }).then(function(localConfig){
        _.merge(actualConfig,localConfig);
    });
    */
    actualConfig={server: {port:3333}};
}).then(function(){
    return new Promise(function(resolve){
        var server=app.listen(actualConfig.server.port, function() {
            console.log('Listening on port %d', server.address().port);
            resolve();
        });
    });
}).then(function(){
    app.use('/ejemplo/suma',function(req,res){
        var params;
        if(req.method==='POST'){
            params=req.body;
        }else{
            params=req.query;
        }
        var result=params.alfa+params.beta;
        if(req.method==='POST'){
            res.send(result);
        }else{
            res.send('<h1>la suma es '+result+'<h1>');
        }
    });
}).catch(function(err){
    console.log('ERROR',err);
    console.log('STACK',err.stack);
});
