import { CloneableGenerator, cloneableGenerator } from './cloneableGenerator';

function runList<TReturn>(
    generatorFunc: () => Generator<
        ListMonadInstance<unknown>,
        TReturn,
        unknown
    >
): ListMonadInstance<TReturn> {
    const generator = cloneableGenerator(generatorFunc)();

    function recursiveApply(
        isFirst: boolean,
        prevValue: any,
        generator: CloneableGenerator<unknown, TReturn, unknown>
    ): ListMonadInstance<TReturn> {
        const result = isFirst
            ? generator.next()
            : generator.next(prevValue);

        if (result.done) {
            return toList([result.value]);
        }

        return flatMap(result.value as any, value => {
            return recursiveApply(false, value, generator.clone());
        })
    }

    return recursiveApply(true, undefined!, generator.clone() as any);
}

function flatMap<T, TResult>(
    monad: ListMonadInstance<T>,
    selector: (value: T) => ListMonadInstance<TResult>
): ListMonadInstance<TResult> {
    return toList(monad.get().flatMap(value => selector(value).get()));
}

function toList<T>(array: T[]): ListMonadInstance<T> {
    function* makeGenerator(): Generator<ListMonadInstance<T>, T, T> {
        const internalReturn = yield generator;
        return internalReturn;
    }

    const generator = makeGenerator() as ListMonadInstance<T>;
    generator["@@monad/type"] = 'list';
    generator.get = () => array;
    return generator;
}

type ListMonadInstance<TValue>
    = Generator<ListMonadInstance<TValue>, TValue, TValue>
    & {
        '@@monad/type': 'list';
        get: () => TValue[];
    };

export const list = {
    run: runList,
    make: toList,
}