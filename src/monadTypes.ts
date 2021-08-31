import { Kind, URIS } from "./hkt";

export type AbstractMonad<TMonadUri, TValue, TCtorArg, TPayload>
    = Generator<
        AbstractMonad<TMonadUri, TValue, TCtorArg, TPayload>,
        TValue,
        TValue
    >
    & {
        '@@monad/type': TMonadUri
    }
    & TPayload;

type DeconstructMonadType<TMonad> =
    TMonad extends AbstractMonad<infer TMonadTypeId, infer TValue, infer TCtorArg, infer TPayload>
    ? {
        monadTypeId: TMonadTypeId,
        value: TValue,
        ctorArg: TCtorArg,
        payload: TPayload
    }
    : never;

export type GetMonadTypeArg<TMonad, TKey extends keyof DeconstructMonadType<TMonad>>
    = DeconstructMonadType<TMonad>[TKey];

export type GetMonadCtorArg<TMonad>
    = GetMonadTypeArg<TMonad, 'ctorArg'>;

export type GetMonadPayload<TMonad>
    = GetMonadTypeArg<TMonad, 'payload'>;

export interface BuiltMonad<TMonadUri extends URIS> {
    readonly URI: TMonadUri;

    readonly flatMap: <A, B>(
        monad: Kind<TMonadUri, A>,
        selector: (a: A) => Kind<TMonadUri, B>
    ) => Kind<TMonadUri, B>,

    readonly make: <TValue>(a: GetMonadCtorArg<Kind<TMonadUri, TValue>>) => Kind<TMonadUri, TValue>;

    readonly run: <TComputationResult>(
        generatorFunc: () => Generator<
            Kind<TMonadUri, unknown>,
            TComputationResult,
            unknown
        >
    ) => Kind<TMonadUri, TComputationResult>;
}