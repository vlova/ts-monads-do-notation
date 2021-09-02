import { MakeType, TypeIds } from "../utils/hkt";

export type AbstractMonad<TMonadTypeId, TValue, TCtorArg, TPayload>
    = Generator<
        AbstractMonad<TMonadTypeId, TValue, TCtorArg, TPayload>,
        TValue,
        TValue
    >
    & {
        '@@monad/type': TMonadTypeId
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

type GetMonadTypeArg<TMonad, TKey extends keyof DeconstructMonadType<TMonad>>
    = DeconstructMonadType<TMonad>[TKey];

export type GetMonadCtorArg<TMonad>
    = GetMonadTypeArg<TMonad, 'ctorArg'>;

export type GetMonadPayload<TMonad>
    = GetMonadTypeArg<TMonad, 'payload'>;

export interface BuiltMonad<TMonadTypeId extends TypeIds> {
    readonly typeId: TMonadTypeId;

    readonly flatMap: <A, B>(
        monad: MakeType<TMonadTypeId, A>,
        selector: (a: A) => MakeType<TMonadTypeId, B>
    ) => MakeType<TMonadTypeId, B>,

    readonly make: <TValue>(a: GetMonadCtorArg<MakeType<TMonadTypeId, TValue>>) => MakeType<TMonadTypeId, TValue>;

    readonly run: <TComputationResult>(
        generatorFunc: () => Generator<
            MakeType<TMonadTypeId, unknown>,
            TComputationResult,
            unknown
        >
    ) => MakeType<TMonadTypeId, TComputationResult>;
}