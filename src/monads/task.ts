import { makeMonad } from "../core/buildMonad";
import { BuiltMonad, AbstractMonad } from "../core/monadTypes";

export const TaskTypeId = Symbol('Task');
export type TaskTypeId = typeof TaskTypeId

export type Task<T>
    = AbstractMonad<
        TaskTypeId,
        T,
        Promise<T>,
        { get: () => Promise<T> }
    >;

declare module '../utils/hkt' {
    interface TypeIdToTypeMap<A> {
        readonly [TaskTypeId]: Task<A>
    }
}


export const Task: BuiltMonad<TaskTypeId> = makeMonad({
    typeId: TaskTypeId,

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