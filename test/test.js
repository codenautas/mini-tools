"use strict";

var expect = require('expect.js');
var sinon = require('sinon');
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
});
