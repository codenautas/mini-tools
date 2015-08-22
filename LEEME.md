<!-- multilang from README.md




NO MODIFIQUE ESTE ARCHIVO. FUE GENERADO AUTOMÁTICAMENTE POR multilang.js




-->
# mini-tools
mini tools for express and others


algunas herramientas para express


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

idioma: ![castellano](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)
también disponible en:
[![inglés](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)](README.md)

## Instalación


```sh
$ npm install mini-tools
```


## Objetivo principal

Tener a mano algunas herramientas pequeñas para express


## API

### serveErr(req, res [, next])


Retorna una función que envía un mensaje de error al cliente


```js
app.post('/insert' , function(req,res){
  //...
  if(duplicate){
    serveErr(req,res)(new Error("Duplicate name. Can't insert"));
    return; 
  }
  //...
```


Está diseñado para utilizarse con promesas


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


*catch* espera un función que recibe un error. 
*serveErr* devuelve esa función. 

Cuando err es Error("next") *serveErr* llama a next y no envía ningún mensaje al cliente
(porque entiende que no es un error sino que debe capturarse en el siguiente middleware); 
de otro modo envía un error 400 con el mensaje de error (parámetro de Error). 



Retorna un middleware compatible con express que envía y compila archivos jade. 
Si `any==true` acepta cualquier nombre (sin extensión) y busca si existe el archivo .jade correspondiente;
si no existe tal archivo llama a `next()` para que continúe con el siguiente middleware. 

Si `any==false` lo que se especifica es un archivo específico. 

**Nota**: hay que agregar `"jade"` a `package.json`


Retorna un middleware compatible con express que envía y compila archivos jade. 
Si `any==true` acepta cualquier nombre (sin extensión) y busca si existe el archivo .jade correspondiente;
si no existe tal archivo llama a `next()` para que continúe con el siguiente middleware. 

Si `any==false` lo que se especifica es un archivo específico. 

**Nota**: hay que agregar `"stylus"` a `package.json`


Está diseñado para utilizarse con promesas


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


*catch* espera un función que recibe un error. 
*serveErr* devuelve esa función. 

Cuando err es Error("next") *serveErr* llama a next y no envía ningún mensaje al cliente
(porque entiende que no es un error sino que debe capturarse en el siguiente middleware); 
de otro modo envía un error 400 con el mensaje de error (parámetro de Error). 



## Licencia


[MIT](LICENSE)

.............................