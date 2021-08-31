// Note: this file was stolen from redux-saga package

export type CloneableGenerator<T, TReturn, TNext>
    = Generator<T, TReturn, TNext>
    & {
        clone: () => CloneableGenerator<T, TReturn, TNext>
    }

export const cloneableGenerator = <
    T, TReturn, TNext,
    TGenerator extends Generator<T, TReturn, TNext>,
    TMakeArgs extends any[]
>(
    generatorFunc: (...args: TMakeArgs) => TGenerator
) => (...args: TMakeArgs): CloneableGenerator<T, TReturn, TNext> => {
    const history: TNext[] = []
    const gen = generatorFunc(...args)
    const newGen = {
        next: (arg: TNext) => {
            history.push(arg)
            return gen.next(arg)
        },
        clone: () => {
            const clonedGen = cloneableGenerator(generatorFunc)(...args);
            history.forEach(arg => clonedGen.next(arg))
            return clonedGen as any as CloneableGenerator<T, TReturn, TNext>;
        },
        return: (value: TReturn) => gen.return(value),
        throw: (exception: any) => gen.throw(exception),
        [Symbol.iterator]: () => newGen
    };

    return newGen;
}