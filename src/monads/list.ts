import { makeMonad } from "../core/buildMonad";
import { BuiltMonad, AbstractMonad } from "../core/monadTypes";

export const ListTypeId = Symbol('List');
export type ListTypeId = typeof ListTypeId

export type List<T> = AbstractMonad<ListTypeId, T, T[], { get: () => T[] }>;

declare module '../utils/hkt' {
    interface TypeIdToTypeMap<A> {
        readonly [ListTypeId]: List<A>
    }
}


export const List: BuiltMonad<ListTypeId> = makeMonad({
    typeId: ListTypeId,

    toCtorArg: <T>(value: T) => [value],

    makePayload: <T>(value: T[]) => ({
        get: () => value
    }),

    flatMap: (monad, selector) => {
        return List.make(monad.get().flatMap(value => selector(value).get()));
    }
});