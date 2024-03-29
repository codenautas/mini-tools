<!--multilang v0 es:LEEME.md en:README.md -->
# mini-tools
<!--lang:es-->
algunas herramientas para express

<!--lang:en--]
mini tools for express and others

[!--lang:*-->

<!-- cucardas -->
![stable](https://img.shields.io/badge/stability-stable-blue.svg)
[![npm-version](https://img.shields.io/npm/v/mini-tools.svg)](https://npmjs.org/package/mini-tools)
[![downloads](https://img.shields.io/npm/dm/mini-tools.svg)](https://npmjs.org/package/mini-tools)
[![build](https://github.com/codenautas/mini-tools/workflows/Node.js%20CI/badge.svg)](https://github.com/codenautas/mini-tools/actions?query=workflow%3A%22Node.js+CI%22)
[![windows](https://ci.appveyor.com/api/projects/status/github/codenautas/mini-tools?svg=true)](https://ci.appveyor.com/project/codenautas/mini-tools)
[![coverage](https://img.shields.io/coveralls/codenautas/mini-tools/master.svg)](https://coveralls.io/r/codenautas/mini-tools)
[![outdated-deps](https://img.shields.io/github/issues-search/codenautas/mini-tools?color=9cf&label=outdated-deps&query=is%3Apr%20author%3Aapp%2Fdependabot%20is%3Aopen)](https://github.com/codenautas/mini-tools/pulls/app%2Fdependabot)

<!--multilang buttons-->

idioma: ![castellano](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)
también disponible en:
[![Inglés](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)](README.md)

<!--lang:es-->
## Instalación
<!--lang:en--]
## Install
[!--lang:*-->

```sh
$ npm install mini-tools
```

<!--lang:es-->

## Objetivo principal

Tener a mano algunas herramientas pequeñas para express

<!--lang:en--]

## Main goal

Have some mini tools for express and others

[!--lang:*-->

## API

### serveErr(req, res [, next])

<!--lang:es-->

Retorna una función que envía un mensaje de error al cliente. 
Si el objeto error tiene especificada la propiedad:

  * code: es mostrada antes del mensaje. 
  * status: es enviado como status (si no se envía 400)

<!--lang:en--]

Returns a function that sends a error message to de front-end. 
If the error object has setted the property

  * code: is displayed before the message
  * status: is sended in the header (otherwise "400" is sended)

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

<!--lang:es-->

Está diseñado para utilizarse con promesas

<!--lang:en--]

It is promise friendly

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

<!--lang:es-->

*catch* espera un función que recibe un error. 
*serveErr* devuelve esa función. 

Cuando err es Error("next") *serveErr* llama a next y no envía ningún mensaje al cliente
(porque entiende que no es un error sino que debe capturarse en el siguiente middleware); 
de otro modo envía un error 400 con el mensaje de error (parámetro de Error). 

<!--lang:en--]

*catch* expects a function that receive an error. 
*serveErr* returns that function. 

When err is Error("next") *serveErr* calls next and does not send any result to de front-end; 
otherwise it sends a 400 error with the message and stack. 

[!--lang:*-->

### serveJade(path, opts)

```js
var express = require('express');
var app = express();

app.use('/',MiniTools.serveJade('./static',true));

app.use('/main',MiniTools.serveJade('./static/index.jade',false));
```

<!--lang:es-->

Retorna un middleware compatible con express que envía y compila archivos jade/pug (con extensión *.jade*). 

#### opciones

Si el parámetro *opts* es un booleano se asume que es el valor de la opción *any*. 

Si `any==true` acepta cualquier nombre (sin extensión) y busca si existe el archivo *.jade* correspondiente;
si no existe tal archivo llama a `next()` para que continúe con el siguiente middleware. 

Si `any==false` lo que se especifica es un archivo específico. 

Otras opciones especificadas en *opts* son pasadas a la función `pug.render`

**Nota**: hay que agregar el módulo `"pug"` a `package.json`

<!--lang:en--]

Returns an express middleware to serve jade files. 

If *opts* is boolean it will be the *any* option. 

If `any==true` it serves files adding .jade to req.path; and
if there is no jade file it call `next()`. 

If `any==false` it serves that specific file. 

Others options in *opts* are pased to `pug.render` function.

**Note**: for use serveJade you must include `"pug"` in `package.json`

[!--lang:*-->

### serveStylus(path, any)

```js
var express = require('express');
var app = express();

app.use('/',MiniTools.serveStylus('./static',true));

app.use('/site.css',MiniTools.serveStylus('./static/index.styl',false));
```

<!--lang:es-->

Retorna un middleware compatible con express que envía y compila archivos jade. 
Si `any==true` acepta cualquier nombre (sin extensión) y busca si existe el archivo .jade correspondiente;
si no existe tal archivo llama a `next()` para que continúe con el siguiente middleware. 

Si `any==false` lo que se especifica es un archivo específico. 

**Nota**: hay que agregar `"stylus"` a `package.json`

<!--lang:en--]

Returns an express middleware to serve jade files. 
If `any==true` it serves files adding .jade to req.path; and
if there is no jade file it call `next()`. 

If `any==false` it serves that specific file. 

**Note**: for use serveStylus you must include stylus in package.json

[!--lang:*-->

### serveText(anyText,contentTypeText)

```js
var express = require('express');
var app = express();

app.use('/about',MiniTools.serveText('<h1>This app</h1>','html'));

app.use('/is-up-service',MiniTools.serveText('Yes.'));
```

<!--lang:es-->

Retorna un middleware compatible con express que envía un archivo de texto plano. 
Opcionalmente se le puede indicar el "content type" (si no se le pasa una "/" se entiende que es text)

<!--lang:en--]

Returns an express middleware to serve pain text. 
Optionaly you can pass "content type".

[!--lang:*-->

### serveJson(object)

```js
var express = require('express');
var app = express();

var config = {devel:false, title: "title"};

app.use('/config',MiniTools.serveJson(config));
```

<!--lang:es-->

Retorna un middleware compatible con express que envía un objeto en formato JSON

<!--lang:en--]

Returns an express middleware to serve an object in JSON format.

[!--lang:*-->

### serveYaml(object)

```js
var express = require('express');
var app = express();

var config = {devel:false, title: "title"};

app.use('/config',MiniTools.serveYaml(config));
```

<!--lang:es-->

Retorna un middleware compatible con express que envía un objeto en formato yaml 
(usando [js-yaml](https:www.npmjs.com/package/js-yaml)).

<!--lang:en--]

Returns an express middleware to serve an object in yaml format
(using [js-yaml](https:www.npmjs.com/package/js-yaml)).

[!--lang:*-->

### readConfig(list, opts)

```js
MiniTools.readConfig(
    [
        {production: true},
        'package.json',
        'other-configs.yml',
        'more-configs',
    ],
    {whenNotExist:'ignore'}
).then(function(config){
    console.log(config);
});
```

<!--lang:es-->

Lee la configuración de la lista empezando por el primer archivo 
y agregando la configuración de los siguientes archivos 
(usando [best-globals.changing](https://www.npmjs.com/package/best-globals#changingoriginalconfig-changes-options)). 

Si el elemento de la lista es un nombre de archivo terminado en .json .yaml o .yml se lee y se parsea, 
si no tiene extensión se busca uno con alguna de esas extensiones,
si es un objeto plano se usa directamente.

**opciones** 
 * whenNotExist:'ignore'
 * whenNotExist:'fail'

<!--lang:en--]

Reads the chain of configuration merging with [best-globals.changing](https://www.npmjs.com/package/best-globals#changingoriginalconfig-changes-options).

If the list element is a fileName ending with .json .yaml o .yml, it reads and parse, 
if doesn't have extension it search first, 
if it is a plain object it uses directly.

**options** 
 * whenNotExist:'ignore'
 * whenNotExist:'fail'

<!--lang:es-->

## Licencia

<!--lang:en--]

## License

[!--lang:*-->

[MIT](LICENSE)

