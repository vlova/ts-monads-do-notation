import { makeMonad } from "./buildMonad";
import { BuiltMonad, AbstractMonad } from "./monadTypes";

export const MaybeURI = 'Maybe';
export type MaybeURI = typeof MaybeURI

export type MaybeMonadInstance<T>
    = AbstractMonad<
        MaybeURI,
        T,
        T | undefined,
        { get: () => T | undefined }
    >;

declare module './hkt' {
    interface URItoKind<A> {
        readonly Maybe: MaybeMonadInstance<A>
    }
}

export const Maybe: BuiltMonad<MaybeURI> = makeMonad({
    URI: MaybeURI,

    toCtorArg: value => value,

    makePayload: <T>(value: T) => ({
        get: () => value
    }),

    flatMap: (monad, selector) => {
        const value = monad.get();

        if (value != null) {
            return selector(value);
        }

        return Maybe.make(undefined!);
    }
});