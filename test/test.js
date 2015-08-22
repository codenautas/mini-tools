"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */
/* global describe */
/* global it */

var expect = require('expect.js');
var sinon = require('sinon');
var stylus = require('stylus');
var Promises = require('best-promise');
var fs = require('fs-promise');
var MiniTools = require('..');

describe('mini-tools', function(){
    describe('serveErr', function(){
        var server;
        it('should send ERR 400', function(){
            var res={};
            res.end=sinon.spy();
            res.writeHead=sinon.spy();
            var err=new Error("this is the message");
            var spy_console_log=sinon.stub(console, "log");
            MiniTools.serveErr(null,res,null)(err);
            var spyed_console_log=console.log;
            spy_console_log.restore();
            expect(res.end.firstCall.args[0]).to.match(/^ERROR! \nthis is the message\n-+\nError: this is the message\n\s*at/);
            expect(res.end.callCount).to.be(1);
            expect(spyed_console_log.firstCall.args).to.eql(['ERROR',err]);
            expect(spyed_console_log.secondCall.args[0]).to.eql('STACK');
            expect(spyed_console_log.secondCall.args[1]).to.match(/^Error: this is the message\n\s*at/);
            expect(spyed_console_log.callCount).to.be(2);
            var length=res.writeHead.firstCall.args[1]['Content-Length'];
            expect(length).to.eql(res.end.firstCall.args[0].length);
            expect(res.writeHead.firstCall.args).to.eql([400, {
                'Content-Length': length,
                'Content-Type': 'text/plain; charset=utf-8'
            }]);
            expect(res.writeHead.callCount).to.be(1);
            console.log("restore console.log ok!");
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
    
    describe("stylus", function(){
        function testServe(req,any,fileNameToRead,done){
            var ssAny=MiniTools.serveStylus('./fixtures',any);
            var stub_readFile=sinon.stub(fs,"readFile");
            stub_readFile.returns(Promises.Promise.resolve("this css ok"));
            var stub_render=sinon.stub(stylus, "render");
            stub_render.returns("this{css:ok}");
            var res={};
            var next={};
            var stub_serveText=sinon.stub(MiniTools,"serveText",function(text, type){
                expect(stub_readFile.firstCall.args).to.eql([fileNameToRead, { encoding: 'utf8' }]);
                expect(stub_readFile.callCount).to.be(1);
                expect(stub_render.firstCall.args).to.eql(["this css ok"]);
                expect(stub_render.callCount).to.be(1);
                stub_readFile.restore();
                stub_render.restore();
                stub_serveText.restore();
                expect(text).to.be("this{css:ok}");
                expect(type).to.be("css");
                return function(req1, res1){
                    expect(req1).to.be(req);
                    expect(res1).to.be(res);
                    done();
                };
            });
            ssAny(req, res, next);
        }
        it("serve founded file", function(done){
            var req={path:'one.css'};
            testServe(req,true,'./fixtures/one.styl',done);
        });
        it("serve specific file file", function(done){
            var req={path:'one.css'};
            testServe(req,false,'./fixtures',done);
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
            var stub_readFile=sinon.stub(fs,"readFile");
            var ErrorENOENT = new Error("ENOENT: File not found");
            ErrorENOENT.code = 'ENOENT';
            stub_readFile.throws(ErrorENOENT);
            var stub_render=sinon.stub(stylus, "render");
            var res={};
            var stub_serveText=sinon.stub(MiniTools,"serveText");
            var next=function(){
                expect(stub_readFile.callCount).to.be(1);
                expect(stub_readFile.firstCall.args).to.eql(['./fixtures/inexis.styl', { encoding: 'utf8' }]);
                expect(stub_render.callCount).to.be(0);
                expect(stub_serveText.callCount).to.be(0);
                stub_readFile.restore();
                stub_render.restore();
                stub_serveText.restore();
                done();
            };
            ssAny(req, res, next);
        });
        it("serve Error if other Error ocurs", function(done){
            var req={path:'with-bad-content.css'};
            var stub_readFile=sinon.stub(fs,"readFile");
            var ErrorOTHER = new Error("OTHER: Error");
            ErrorOTHER.code = 'OTHER';
            stub_readFile.throws(ErrorOTHER);
            var stub_render=sinon.stub(stylus, "render");
            var res={};
            var next={};
            var stub_serveText=sinon.stub(MiniTools,"serveText");
            var stub_serveErr=sinon.stub(MiniTools,"serveErr",function(req1, res1, next1){
                return function(err){
                    expect(stub_readFile.firstCall.args).to.eql(['./fixtures/with-bad-content.styl', { encoding: 'utf8' }]);
                    expect(stub_readFile.callCount).to.be(1);
                    stub_readFile.restore();
                    stub_render.restore();
                    stub_serveText.restore();
                    stub_serveErr.restore();
                    expect(req1).to.be(req);
                    expect(next1).to.be(next);
                    expect(err).to.be(ErrorOTHER);
                    done();
                };
            });
            ssAny(req, res, next);
        });
    });
});
