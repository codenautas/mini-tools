# mini-tools
mini tools for express and others


![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/mini-tools.svg)](https://npmjs.org/package/mini-tools)
[![downloads](https://img.shields.io/npm/dm/mini-tools.svg)](https://npmjs.org/package/mini-tools)
[![linux](https://img.shields.io/travis/codenautas/mini-tools/master.svg)](https://travis-ci.org/codenautas/mini-tools)
[![windows](https://ci.appveyor.com/api/projects/status/github/codenautas/mini-tools?svg=true)](https://ci.appveyor.com/project/codenautas/mini-tools)
[![coverage](https://img.shields.io/coveralls/codenautas/mini-tools/master.svg)](https://coveralls.io/r/codenautas/mini-tools)
[![climate](https://img.shields.io/codeclimate/github/codenautas/mini-tools.svg)](https://codeclimate.com/github/codenautas/mini-tools)
[![dependencies](https://img.shields.io/david/codenautas/mini-tools.svg)](https://david-dm.org/codenautas/mini-tools)


language: ![English](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)
also available in:
[![Spanish](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)](LEEME.md)

## Install

```sh
$ npm install mini-tools
```


## Main goal

Have some mini tools for express and others


## API

### serveErr(req, res [, next])


Returns a function that sends a error message to de front-end.


```js
app.post('/insert' , function(req,res){
  //...
  if(duplicate){
    serveErr(req,res)(new Error("Duplicate name. Can't insert"));
    return;
  }
  //...
```


It is promise friendly


```js
app.use('/tools', function(req,res,next){
  //...
  .then(function(){
    if(not_in_this_middleware){
      throw new Error("next");
    }
    // ...
  }).catch(serveErr(req,res,next));
```


*catch* expects a function that receive an error.
*serveErr* returns that function.

When err is Error("next") *serveErr* calls next and does not send any result to de front-end;
otherwise it sends a 400 error with the message and stack.


### serveJade(path, any)

```js
var express = require('express');
var app = express();

app.use('/',MiniTools.serveJade('./static',true));

app.use('/main',MiniTools.serveJade('./static/index.jade',false));
```


Returns an express middleware to serve jade files.
If `any==true` it serve files adding .jade to req.path; and
if there no jade file it call `next()`.

If `any==false` it serves that specific file.

**Note**: for use serveJade you must include jade in `package.json`


### serveStylus(path, any)

```js
var express = require('express');
var app = express();

app.use('/',MiniTools.serveStylus('./static',true));

app.use('/site.css',MiniTools.serveStylus('./static/index.styl',false));
```


Returns an express middleware to serve jade files.
If `any==true` it serve files adding .jade to req.path; and
if there no jade file it call `next()`.

If `any==false` it serves that specific file.

**Note**: for use serveStylus you must include stylus in package.json


## License


[MIT](LICENSE)

