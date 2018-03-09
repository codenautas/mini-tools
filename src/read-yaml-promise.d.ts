
declare module 'read-yaml-promise'{
    function readYaml(fileName:string):Promise<any>;
    namespace readYaml{}
    export = readYaml;
}

