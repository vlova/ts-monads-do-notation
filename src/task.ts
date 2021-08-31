import { cloneableGenerator, CloneableGenerator } from "./cloneableGenerator";

function runTask<TReturn>(
    generatorFunc: () => Generator<
        TaskMonadInstance<unknown>,
        TReturn,
        unknown
    >
): TaskMonadInstance<TReturn> {
    const generator = cloneableGenerator(generatorFunc)();

    function recursiveApply(
        isFirst: boolean,
        prevValue: any,
        generator: CloneableGenerator<unknown, TReturn, unknown>
    ): TaskMonadInstance<TReturn> {
        const result = isFirst
            ? generator.next()
            : generator.next(prevValue);

        if (result.done) {
            return toTask(result.value);
        }

        return flatMap(result.value as any, value => {
            return recursiveApply(false, value, generator.clone());
        })
    }

    return recursiveApply(true, undefined!, generator.clone() as any);
}

function flatMap<T, TResult>(
    monad: TaskMonadInstance<T>,
    selector: (value: T) => TaskMonadInstance<TResult>
): TaskMonadInstance<TResult> {
    const promise = monad.get();
    const t = promise.then(v => selector(v).get());
    return toTask<TResult>(t);
}

function toTask<T>(promise: T): TaskMonadInstance<T>
function toTask<T>(promise: Promise<T>): TaskMonadInstance<T>
function toTask<T>(promise: T | Promise<T>): TaskMonadInstance<T> {
    function* makeGenerator(): Generator<TaskMonadInstance<T>, T, T> {
        const internalReturn = yield generator;
        return internalReturn;
    }

    const generator = makeGenerator() as TaskMonadInstance<T>;
    generator["@@monad/type"] = 'task';
    generator.get = () => Promise.resolve(promise);
    return generator;
}

type TaskMonadInstance<TValue>
    = Generator<TaskMonadInstance<TValue>, TValue, TValue> & {
        '@@monad/type': 'task',
        get: () => Promise<TValue>;
    }

export const task = {
    run: runTask,
    make: toTask,
}