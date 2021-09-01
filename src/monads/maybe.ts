import { makeMonad } from "../core/buildMonad";
import { BuiltMonad, AbstractMonad } from "../core/monadTypes";

export const MaybeURI = 'Maybe';
export type MaybeURI = typeof MaybeURI

export type Maybe<T>
    = AbstractMonad<
        MaybeURI,
        T,
        T | undefined,
        { get: () => T | undefined }
    >;

declare module '../utils/hkt' {
    interface TypeIdToTypeMap<A> {
        readonly Maybe: Maybe<A>
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