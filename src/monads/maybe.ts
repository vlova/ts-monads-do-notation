import { makeMonad } from "../core/buildMonad";
import { BuiltMonad, AbstractMonad } from "../core/monadTypes";

export const MaybeTypeId = Symbol('Maybe');
export type MaybeTypeId = typeof MaybeTypeId

export type Maybe<T>
    = AbstractMonad<
        MaybeTypeId,
        T,
        T | undefined,
        { get: () => T | undefined }
    >;

declare module '../utils/hkt' {
    interface TypeIdToTypeMap<A> {
        readonly [MaybeTypeId]: Maybe<A>
    }
}

export const Maybe: BuiltMonad<MaybeTypeId> = makeMonad({
    typeId: MaybeTypeId,

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