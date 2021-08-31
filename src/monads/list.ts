import { makeMonad } from "../core/buildMonad";
import { BuiltMonad, AbstractMonad } from "../core/monadTypes";

export const ListURI = 'List';
export type ListURI = typeof ListURI

export type List<T> = AbstractMonad<ListURI, T, T[], { get: () => T[] }>;

declare module '../utils/hkt' {
    interface URItoKind<A> {
        readonly List: List<A>
    }
}


export const List: BuiltMonad<ListURI> = makeMonad({
    URI: ListURI,

    toCtorArg: <T>(value: T) => [value],

    makePayload: <T>(value: T[]) => ({
        get: () => value
    }),

    flatMap: (monad, selector) => {
        return List.make(monad.get().flatMap(value => selector(value).get()));
    }
});