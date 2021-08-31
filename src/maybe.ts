import { cloneableGenerator, CloneableGenerator } from "./cloneableGenerator";

function runMaybe<TReturn>(
    generatorFunc: () => Generator<
        MaybeMonadInstance<unknown>,
        TReturn,
        unknown
    >
): MaybeMonadInstance<TReturn> {
    const generator = cloneableGenerator(generatorFunc)();

    function recursiveApply(
        isFirst: boolean,
        prevValue: any,
        generator: CloneableGenerator<unknown, TReturn, unknown>
    )
        : MaybeMonadInstance<TReturn> {
        const result = isFirst
            ? generator.next()
            : generator.next(prevValue);

        if (result.done) {
            return toMaybe(result.value);
        }

        return flatMap(result.value as any, value => {
            return recursiveApply(false, value, generator.clone());
        })
    }

    return recursiveApply(true, undefined!, generator.clone() as any);
}

function flatMap<T, TResult>(monad: MaybeMonadInstance<T>, selector: (value: T) => MaybeMonadInstance<TResult>): MaybeMonadInstance<TResult> {
    const value = monad.get();

    return value != null
        ? selector(value)
        : toMaybe<TResult>(undefined);
}

function toMaybe<T>(value: T | undefined | null): MaybeMonadInstance<T>
function toMaybe<T>(value: T): MaybeMonadInstance<T>
function toMaybe<T>(value: T | undefined): any {
    function* makeGenerator(): Generator<MaybeMonadInstance<T>, T, T> {
        const internalReturn = yield generator;
        return internalReturn;
    }

    const generator = makeGenerator() as MaybeMonadInstance<T>;
    generator["@@monad/type"] = 'maybe';
    generator.get = () => value;
    return generator;
}

type MaybeMonadInstance<TValue>
    = Generator<MaybeMonadInstance<TValue>, TValue, TValue> & {
        '@@monad/type': 'maybe',
        get: () => TValue | undefined;
    }

export const maybe = {
    run: runMaybe,
    make: toMaybe,
}