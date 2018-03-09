declare module "best-globals" {
    // https://www.typescriptlang.org/docs/handbook/modules.html?#ambient-modules
    export function changing(a:object, b:object, opts?:any):object;
    // https://www.typescriptlang.org/docs/handbook/declaration-merging.html
    export namespace changing{
        function options(opts?:{deletingValue:any}):any;
    }
}
