"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/*eslint-env node*/
/* global describe */
/* global it */

var expect = require('expect.js');
var sinon = require('sinon');
var pug = require('pug');
var stylus = require('stylus');
var MiniTools = require('..');
var bestGlobals = require('best-globals');
var fs = require('fs').promises;
var FS = require('fs');

var jsYaml = require('js-yaml');

var ERROR_LOGS = false

describe('mini-tools with mocks', function(){
    describe('serveErr', function(){
        var server;
        it('should send ERR 400 with stack', function(){
            var res={};
            res.end=sinon.spy();
            res.writeHead=sinon.spy();
            var get_headersSent=sinon.stub().returns(false);
            Object.defineProperty(res,'headersSent',{get: get_headersSent});
            var err=new Error("this is the message");
            var spy_console_log=sinon.stub(console, "log");
            MiniTools.globalOpts.serveErr.sendStack=true;
            MiniTools.serveErr(null,res,null)(err);
            var spyed_console_log=console.log;
            spy_console_log.restore();
            expect(res.end.firstCall.args[0]).to.match(/^ERROR: this is the message\n-----+\nError: this is the message\n\s*at/);
            expect(get_headersSent.callCount).to.be(1);
            expect(res.end.callCount).to.be(1);
            expect(spyed_console_log.firstCall.args).to.eql(['ERROR',err]);
            if(ERROR_LOGS){
                expect(spyed_console_log.secondCall.args[0]).to.eql('STACK');
                expect(spyed_console_log.secondCall.args[1]).to.match(/^Error: this is the message\n\s*at/);
                expect(spyed_console_log.callCount).to.be(2);
            }
            var length=res.writeHead.firstCall.args[1]['Content-Length'];
            expect(length).to.eql(res.end.firstCall.args[0].length);
            expect(res.writeHead.firstCall.args).to.eql([400, {
                'Content-Length': length,
                'Content-Type': 'text/plain; charset=utf-8'
            }]);
            expect(res.writeHead.callCount).to.be(1);
        });
        it('should not send headers if there where sent before', function(){
            var res={};
            res.end=sinon.spy();
            var get_headersSent=sinon.stub().returns(true);
            Object.defineProperty(res,'headersSent',{get: get_headersSent});
            var err=new Error("this is a message");
            err.code='A201';
            err.details='the "details"';
            MiniTools.globalOpts.serveErr.propertiesWhiteList=['code','details'];
            var spy_console_log=sinon.stub(console, "log");
            MiniTools.serveErr(null,res,null)(err);
            var spyed_console_log=console.log;
            spy_console_log.restore();
            expect(res.end.firstCall.args[0]).to.match(/ERROR A201: this is a message\ncode: "A201"\ndetails: "the \\"details\\""\n-----+\nError: this is a message\n\s*at/);
            expect(res.end.callCount).to.be(1);
            expect(spyed_console_log.firstCall.args).to.eql(['ERROR',err]);
            if(ERROR_LOGS){
                expect(spyed_console_log.secondCall.args[0]).to.eql('STACK');
                expect(spyed_console_log.secondCall.args[1]).to.match(/^Error: this is a message\n\s*at/);
                expect(spyed_console_log.callCount).to.be(2);
            }
        });
        it('should by pass with next', function(){
            var next=sinon.spy();
            var err=new Error("next");
            var spy_console_log=sinon.stub(console, "log");
            MiniTools.serveErr(null,null,next)(err);
            var spyed_console_log=console.log;
            spy_console_log.restore();
            expect(spyed_console_log.callCount).to.be(0);
            expect(next.callCount).to.be(1);
            expect(next.firstCall.args.length).to.be(0);
        });
        it('should send ERR with headers', function(){
            var res={};
            res.end=sinon.spy();
            res.writeHead=sinon.spy();
            var msg="Éste es el mensaje: ¡Sí!";
            var length=("ERROR: "+msg).length+3 // ansi to UTF8;
            var err=new Error(msg);
            err.status=403;
            var spy_console_log=sinon.stub(console, "log");
            MiniTools.globalOpts.serveErr.sendStack=false;
            MiniTools.serveErr(null,res,null)(err);
            var spyed_console_log=console.log;
            spy_console_log.restore();
            expect(res.end.firstCall.args[0]).to.match(/^ERROR: Éste es el mensaje: ¡Sí!$/);
            expect(res.end.callCount).to.be(1);
            expect(spyed_console_log.firstCall.args).to.eql(['ERROR',err]);
            if(ERROR_LOGS){
                expect(spyed_console_log.secondCall.args[0]).to.eql('STACK');
                expect(spyed_console_log.secondCall.args[1]).to.match(/^Error: Éste es el mensaje: ¡Sí!\n\s*at/);
                expect(spyed_console_log.callCount).to.be(2);
            }
            expect(res.writeHead.firstCall.args[1]['Content-Length']).to.eql(length);
            expect(res.writeHead.firstCall.args).to.eql([403, {
                'Content-Length': length,
                'Content-Type': 'text/plain; charset=utf-8'
            }]);
            expect(res.writeHead.callCount).to.be(1);
        });
    });
    describe("pre_eval",function(){
        var preEval=MiniTools.preEval;
        it("allow alphaless expresions", function(){
            expect(preEval("12*45+8/(3/4!)")).to.be(true);
        });
        it("reject variables", function(){
            expect(preEval("12*45+x+8/(3/4!)",{a:true},{f:true,g:true})).to.be(false);
        });
        it("reject functions", function(){
            expect(preEval("12*45+fi(8)/(3/4!)",{a:true},{f:true,g:true})).to.be(false);
            expect(preEval("12*45+fi ()/(3/4!)",{a:true},{f:true,g:true})).to.be(false);
        });
        it("accept variables and functions", function(){
            expect(preEval("name+12*45+name+8/(3/4!)-x",{name:true, x:true},{f:true,g:true})).to.be(true);
            expect(preEval("max(f(a))+12*45+a+8/(3/4!)-f(x)",{a:true, x:true},{f:true,max:true})).to.be(true);
        });
    });
    
    describe("serve-text", function(){
        it("serve utf8-normal text",function(done){
            var st=MiniTools.serveText("¡normal!");
            var res={};
            res.setHeader=sinon.spy();
            res.end=function(buf){
                expect(res.setHeader.firstCall.args).to.eql(['Content-Type', 'text/plain; charset=utf-8']);
                expect(res.setHeader.secondCall.args).to.eql(['Content-Length', 9]);
                expect(buf.toString()).to.be("¡normal!");
                done();
            };
            st(null, res);
        });
    });
    describe("stylus and jade", function(){
        function testServe(req, any, fileNameToRead, serviceName, renderizer, textType, baseDir, done, expectNext){
            try{
                if(!renderizer.baseObject){
                    renderizer={baseObject:renderizer, methodName:"render"};
                }
                var res={
                    setHeader:function(){}, 
                    end:function(sendendContent){
                        Promise.resolve().then(function(){
                            return fs.readFile(fileNameToRead, {encoding:'utf8'});
                        }).then(function(expectedContent){
                            expect(sendendContent.toString()).to.eql(expectedContent);
                            done(expectNext ? new Error("expecting next") : null);
                        }).catch(done);
                    }
                };
                var next=function(){
                    if(expectNext){
                        done();
                    }else{
                        console.log("ERROR NEXT:",req, any, fileNameToRead, serviceName, textType, baseDir, expectNext)
                        if(fileNameToRead===false){
                            done();
                        }else{
                            done("unexpected done for "+fileNameToRead);
                        }
                    }
                };
                var serveThis=MiniTools[serviceName](baseDir,any);
                serveThis(req, res, next);
            }catch(err){
                done(err);
            }
        }
        it("serve stylus founded file", function(done){
            var req={path:'one.css'};
            testServe(req, true, './test/fixtures/result.one.css', "serveStylus", stylus, 'css', './test/fixtures', done);
        });
        it("send error when serve stylus rare file", function(done){
            var req={path:'inexistenting.css'};
            testServe(req, true, false, "serveStylus", stylus, 'css', './test/fixtures3', done )
        });
        it("serve jade founded file", function(done){
            var req={path:'/one'};
            testServe(req, true, './test/fixtures/result.one.html', "serveJade", pug, 'html', 'test/fixtures', done);
        });
        it("serve jade founded file via url", function(done){
            var req={url:'/one'};
            testServe(req, true, './test/fixtures/result.one.html', "serveJade", pug, 'html', 'test/fixtures', done);
        });
        it("serve json objects", function(done){
            var req={path:'/one-object.json'};
            testServe(req, null, 'test/fixtures/one-object.json', "serveJson", {baseObject:JSON, methodName:"stringify"}, 'application/json', {one: 1}, done);
        });
        it("serve yaml objects", function(done){
            var req={path:'/one-object'};
            testServe(req, null, 'test/fixtures/one-object.yaml', "serveYaml", {baseObject:jsYaml, methodName:"dump"}, 'application/x-yaml', {one: 1}, done);
        });
        it("serve double jade founded file", function(done){
            var req={path:'/one'};
            testServe(req, true, './test/fixtures/result.one.html', "serveJade", pug, 'html', 'test/fixtures', function(err){
                if(err) return done(err);
                testServe(req, true, './test/fixtures/result.one.html', "serveJade", pug, 'html', 'test/fixtures', done);
            });
        });
        it("serve jade not fundend then founded file", function(done){
            var req={path:'/one'};
            testServe(req, true, './test/fixtures/result.one.html', "serveJade", pug, 'html', 'example', function(err){
                if(err) return done(err);
                testServe(req, true, './test/fixtures/result.one.html', "serveJade", pug, 'html', 'test/fixtures', done);
            }, true);
        });
        it("serve specific file file", function(done){
            var req={path:'one.css'};
            testServe(req, false, 'test/fixtures/result.specific.css', "serveStylus", stylus, 'css', 'test/fixtures/specific.styl', done);
        });
        var ssAny=MiniTools.serveStylus('./fixtures',true);
        it("skip non css requests", function(done){
            var req={path:'other.ext'};
            var next=done;
            var res=null;
            ssAny(req, res, next);
        });
        it("call next() if not found", function(done){
            var req={path:'inexis.css'};
            var stub_exists=sinon.stub(FS,"exists");
            var ErrorENOENT = new Error("ENOENT: File not found");
            ErrorENOENT.code = 'ENOENT';
            stub_exists.throws(ErrorENOENT);
            var stub_render=sinon.stub(stylus, "render");
            var res={};
            var stub_serveText=sinon.stub(MiniTools,"serveText");
            var next=function(){
                expect(stub_exists.callCount).to.be(1);
                expect(stub_exists.firstCall.args[0]).to.eql('./fixtures/inexis.styl');
                expect(stub_render.callCount).to.be(0);
                expect(stub_serveText.callCount).to.be(0);
                stub_exists.restore();
                stub_render.restore();
                stub_serveText.restore();
                done();
            };
            ssAny(req, res, next);
        });
        it("serve Error if other Error ocurs", function(done){
            var req={path:'with-bad-content.css'};
            var res={};
            var next=done;
            ssAny(req, res, next);
        });
    });
});

var request = require('supertest');

describe("mini-tools with fake server",function(){
    it("serve simple jade double request with any=false",function(done){
        var server = createServer('test/fixtures/simple',false);
        var agent=request(server);
        agent
            .get('/any')
            .expect('<h1>simple jade<p>for example</p></h1>')
            .end(function(err){
                if(err){
                    return done(err);
                }
                agent.get('/any')
                    .expect('<h1>simple jade<p>for example</p></h1>')
                    .end(done);
            });
    });
    it("serve simple jade double request with any=true",function(done){
        var server = createServer('test/fixtures',true);
        var agent=request(server);
        agent
            .get('/simple')
            .expect('<h1>simple jade<p>for example</p></h1>')
            .end(function(err){
                if(err){
                    return done(err);
                }
                agent.get('/simple')
                    .expect('<h1>simple jade<p>for example</p></h1>')
                    .end(done);
            });
    });
    it("serve jade with-var",function(done){
        var server = createServer('test/fixtures',true);
        server.get('/x',MiniTools.serveJade('test/fixtures/with-vars',{id:'id1', line1:'line'}));
        var agent=request(server);
        agent
        .get('/x')
        .expect('<p id="id1">line</p>')
        .end(function(err){
            if(err){
                return done(err);
            }
            agent
            .get('/x')
            .expect('<p id="id1">line</p>')
            .end(done);
        });
    });
    describe("serve-file", function(){
        it("serve any file",function(done){
            var fileName='test/fixtures/ok.png';
            fs.readFile(fileName).then(function(fileContent){
                var sf=MiniTools.serveFile(fileName);
                var server = createServer('test/fixtures',true);
                server.get('/ok1.png',sf);
                var agent=request(server);
                agent
                .get('/ok1.png')
                .expect('Content-Type','image/png')
                .expect(fileContent)
                .end(done);
            }).catch(done);
        });
    });
});

describe("fs tools", function(){
    it("must read multiple config", function(done){
        var ok="ok_content_"+Math.random();
        var bg=sinon.spy(bestGlobals, "changing");
        MiniTools.readConfig([
            'test/fixtures/read-config1.json',
            'test/fixtures/read-config2.yaml',
            'test/fixtures/read-config3',
            'test/fixtures/read-config4',
            { config2:2.5, config5:5, config6:6.5 },
            'test/fixtures/read-config6',
        ]).then(function(cfg){
            expect(cfg).to.eql({
                config1:1,
                config2:2.5,
                config3:3,
                config4:4,
                config5:5,
                config6:6,
            });
            expect(bestGlobals.changing.callCount).to.be(6);
            expect(bestGlobals.changing.args[bestGlobals.changing.args.length-1]).to.eql([      
                { config1: 1,
                  config2: 2.5,
                  config3: 3,
                  config4: 4,
                  config5: 5,
                  config6: 6.5 },
                { config6: 6 } 
            ]);
            bestGlobals.changing.restore();
        }).then(done,done);
    });
    it("must control if file not found", function(done){
        MiniTools.readConfig([
            'test/fixtures/read-config0',
        ]).then(function(){
            done(new Error("must fail"));
        },function(err){
            expect(err.message).to.match(/Config file does not found/);
            done();
        }).catch(done);
    });
    it("must ignore if file not found {whenNotExist:'ignore'} 'non extension case'", function(done){
        MiniTools.readConfig([
            'test/fixtures/read-config1.json',
            'test/fixtures/read-config0',
        ], {whenNotExist:'ignore'}).then(function(cfg){
            expect(cfg).to.eql({"config1": 1});
        }).then(done,done);
    });
    it("must ignore if file not found {whenNotExist:'ignore'} 'with extension case'", function(done){
        MiniTools.readConfig([
            'test/fixtures/read-config1.json',
            'test/fixtures/read-config0.yaml',
        ], {whenNotExist:'ignore'}).then(function(cfg){
            expect(cfg).to.eql({"config1": 1});
        }).then(done,done);
    });
    it("must not ignore other errors if file not found {whenNotExist:'ignore'}", function(done){
        MiniTools.readConfig([
            'test/fixtures/read-invalid',
        ], {whenNotExist:'ignore'}).then(function(){
            done(new Error("must fail because of invalid content"));
        },function(err){
            expect(err.message).to.match(/Unexpected token|in JSON/);
            done();
        }).catch(done);
    });
    it("must control parameter types", function(done){
        MiniTools.readConfig([
            [],
        ]).then(function(){
            done(new Error("must fail"));
        },function(err){
            expect(err.message).to.match(/readConfig must receive string filename or config object/);
            done();
        }).catch(done);
    });
});

var express = require('express');

function createServer(dir, opts, fn) {
    var _serve = MiniTools.serveJade(dir, opts);
    var app = express();
    app.listen();
    app.use(_serve);
    return app;
}
