import { MakeType, TypeIds } from "../utils/hkt";

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

export interface BuiltMonad<TMonadUri extends TypeIds> {
    readonly URI: TMonadUri;

    readonly flatMap: <A, B>(
        monad: MakeType<TMonadUri, A>,
        selector: (a: A) => MakeType<TMonadUri, B>
    ) => MakeType<TMonadUri, B>,

    readonly make: <TValue>(a: GetMonadCtorArg<MakeType<TMonadUri, TValue>>) => MakeType<TMonadUri, TValue>;

    readonly run: <TComputationResult>(
        generatorFunc: () => Generator<
            MakeType<TMonadUri, unknown>,
            TComputationResult,
            unknown
        >
    ) => MakeType<TMonadUri, TComputationResult>;
}