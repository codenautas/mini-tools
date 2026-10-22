"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */

// APP

var express = require('express');
var app = express();
app.disable('x-powered-by');
app.use(express.urlencoded({extended:true}));
var MiniTools = require('..');
var escapeHtml = require('escape-html');

// only the query and some well known headers are logged: the body and the cookies can contain secrets
// JSON.stringify escapes the line feeds, so the values cannot forge log lines
var LOGGED_HEADERS = ['host', 'user-agent', 'accept', 'accept-language', 'content-type', 'content-length'];

app.use(function(req,res,next){
    var headers = {};
    LOGGED_HEADERS.forEach(function(name){
        if(name in req.headers){
            headers[name] = req.headers[name];
        }
    });
    console.log('request', {method:req.method, path:req.path, query:req.query, headers:headers});
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
        var result=(Number(params.alfa)+Number(params.beta)).toString();
        if(req.method==='POST'){
            res.type('text/plain').send(result);
        }else{
            res.send('<h1>la suma es '+escapeHtml(result)+'</h1>');
        }
    });
}).catch(function(err){
    console.log('ERROR',err);
    console.log('STACK',err.stack);
});
