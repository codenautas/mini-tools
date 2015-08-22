# mini-tools
mini tools for express and others
<!--multilang v0 en:README.md es:LEEME.md -->

<!--lang:es--]

algunas herramientas para express

[!--lang:*-->

<!-- cucardas -->
![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/mini-tools.svg)](https://npmjs.org/package/mini-tools)
[![downloads](https://img.shields.io/npm/dm/mini-tools.svg)](https://npmjs.org/package/mini-tools)
[![linux](https://img.shields.io/travis/codenautas/mini-tools/master.svg)](https://travis-ci.org/codenautas/mini-tools)
[![windows](https://ci.appveyor.com/api/projects/status/github/codenautas/mini-tools?svg=true)](https://ci.appveyor.com/project/codenautas/mini-tools)
[![coverage](https://img.shields.io/coveralls/codenautas/mini-tools/master.svg)](https://coveralls.io/r/codenautas/mini-tools)
[![climate](https://img.shields.io/codeclimate/github/codenautas/mini-tools.svg)](https://codeclimate.com/github/codenautas/mini-tools)
[![dependencies](https://img.shields.io/david/codenautas/mini-tools.svg)](https://david-dm.org/codenautas/mini-tools)

<!--multilang buttons-->

language: ![English](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)
also available in:
[![Spanish](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)](LEEME.md)

<!--lang:en-->

## Install

<!--lang:es--]
## Instalación

[!--lang:*-->

```sh
$ npm install mini-tools
```

<!--lang:en-->

## Main goal

Have some mini tools for express and others

<!--lang:es--]

## Objetivo principal

Tener a mano algunas herramientas pequeñas para express

[!--lang:*-->

## API

### serveErr(req, res [, next])

<!--lang:en-->

Returns a function that sends a error message to de front-end. 

<!--lang:es--]

Retorna una función que envía un mensaje de error al cliente

[!--lang:*-->

```js
app.post('/insert' , function(req,res){
  //...
  if(duplicate){
    serveErr(req,res)(new Error("Duplicate name. Can't insert"));
    return; 
  }
  //...
```

<!--lang:en-->

It is promise friendly

<!--lang:es--]

Está diseñado para utilizarse con promesas

[!--lang:*-->

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

<!--lang:en-->

*catch* expects a function that receive an error. 
*serveErr* returns that function. 

When err is Error("next") *serveErr* calls next and does not send any result to de front-end; 
otherwise it sends a 400 error with the message and stack. 

<!--lang:es--]

*catch* espera un función que recibe un error. 
*serveErr* devuelve esa función. 

Cuando err es Error("next") *serveErr* llama a next y no envía ningún mensaje al cliente
(porque entiende que no es un error sino que debe capturarse en el siguiente middleware); 
de otro modo envía un error 400 con el mensaje de error (parámetro de Error). 


[!--lang:en-->

### serveJade(path, any)

```js
var express = require('express');
var app = express();

app.use('/',MiniTools.serveJade('./static',true));

app.use('/main',MiniTools.serveJade('./static/index.jade',false));
```

<!--lang:en-->

Returns an express middleware to serve jade files. 
If `any==true` it serve files adding .jade to req.path; and
if there no jade file it call `next()`. 

If `any==false` it serves that specific file. 

**Note**: for use serveJade you must include jade in `package.json`

<!--lang:es--]

Retorna un middleware compatible con express que envía y compila archivos jade. 
Si `any==true` acepta cualquier nombre (sin extensión) y busca si existe el archivo .jade correspondiente;
si no existe tal archivo llama a `next()` para que continúe con el siguiente middleware. 

Si `any==false` lo que se especifica es un archivo específico. 

**Nota**: hay que agregar `"jade"` a `package.json`

[!--lang:en-->

### serveStylus(path, any)

```js
var express = require('express');
var app = express();

app.use('/',MiniTools.serveStylus('./static',true));

app.use('/site.css',MiniTools.serveStylus('./static/index.styl',false));
```

<!--lang:en-->

Returns an express middleware to serve jade files. 
If `any==true` it serve files adding .jade to req.path; and
if there no jade file it call `next()`. 

If `any==false` it serves that specific file. 

**Note**: for use serveStylus you must include stylus in package.json

<!--lang:es--]

Retorna un middleware compatible con express que envía y compila archivos jade. 
Si `any==true` acepta cualquier nombre (sin extensión) y busca si existe el archivo .jade correspondiente;
si no existe tal archivo llama a `next()` para que continúe con el siguiente middleware. 

Si `any==false` lo que se especifica es un archivo específico. 

**Nota**: hay que agregar `"stylus"` a `package.json`

[!--lang:en-->

It is promise friendly

<!--lang:es--]

Está diseñado para utilizarse con promesas

[!--lang:*-->

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

<!--lang:en-->

*catch* expects a function that receive an error. 
*serveErr* returns that function. 

When err is Error("next") *serveErr* calls next and does not send any result to de front-end; 
otherwise it sends a 400 error with the message and stack. 

<!--lang:es--]

*catch* espera un función que recibe un error. 
*serveErr* devuelve esa función. 

Cuando err es Error("next") *serveErr* llama a next y no envía ningún mensaje al cliente
(porque entiende que no es un error sino que debe capturarse en el siguiente middleware); 
de otro modo envía un error 400 con el mensaje de error (parámetro de Error). 


[!--lang:en-->

## License

<!--lang:es--]

## Licencia

[!--lang:*-->

[MIT](LICENSE)

.............................