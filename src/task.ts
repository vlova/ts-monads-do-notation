import { makeMonad } from "./buildMonad";
import { BuiltMonad, AbstractMonad } from "./monadTypes";

export const TaskURI = 'Task';
export type TaskURI = typeof TaskURI

export type TaskMonadInstance<T>
    = AbstractMonad<
        TaskURI,
        T,
        Promise<T>,
        { get: () => Promise<T> }
    >;

declare module './hkt' {
    interface URItoKind<A> {
        readonly Task: TaskMonadInstance<A>
    }
}


export const Task: BuiltMonad<TaskURI> = makeMonad({
    URI: TaskURI,

    toCtorArg: value => Promise.resolve(value),

    makePayload: <T>(value: T) => ({
        get: () => value
    }),

    flatMap: (monad, selector) => {
        const promise = monad.get();
        const t = promise.then(v => selector(v).get());
        return Task.make(t);
    }
});