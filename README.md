# mini-tools
mini tools for express and others
<!--multilang v0 en:README.md es:LEEME.md -->

<!--lang:es--]

algunas herramientas para express

[!--lang:*-->

<!-- cucardas -->
![designing](https://img.shields.io/badge/stability-desgining-red.svg)
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

## License

<!--lang:es--]

## Licencia

[!--lang:*-->

[MIT](LICENSE)

.............................