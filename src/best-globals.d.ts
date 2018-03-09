declare module "best-globals" {
    // https://www.typescriptlang.org/docs/handbook/modules.html?#ambient-modules
    export function changing(a:object, b:object, opts?:any):object;
    // sobreescribir la funcionalidad de changing para que sea objeto también
    export namespace changing{
        function options(opts?:{deletingValue:any}):any;
    }
}
