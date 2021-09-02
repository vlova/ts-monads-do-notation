import { CloneableGenerator, cloneableGenerator } from "../utils/cloneableGenerator";
import { MakeType, TypeIds } from "../utils/hkt";
import { BuiltMonad, GetMonadCtorArg, GetMonadPayload } from "./monadTypes";

export interface MakeMonadOptions<TMonadTypeId extends TypeIds>
    extends Pick<BuiltMonad<TMonadTypeId>, 'typeId' | 'flatMap'> {

    readonly toCtorArg: <TValue>(singleValue: TValue) => GetMonadCtorArg<MakeType<TMonadTypeId, TValue>>,

    readonly makePayload: <A>(arg: GetMonadCtorArg<MakeType<TMonadTypeId, A>>)
        => GetMonadPayload<MakeType<TMonadTypeId, A>>;
}

function makeMonadRunner<TMonadTypeId extends TypeIds>(options: MakeMonadOptions<TMonadTypeId>) {
    return function run<TReturn>(
        generatorFunc: () => Generator<
            MakeType<TMonadTypeId, unknown>,
            TReturn,
            unknown
        >
    ): MakeType<TMonadTypeId, TReturn> {
        const monadFactory = makeMonadFactory(options);
        const generator = cloneableGenerator(generatorFunc)();

        function recursiveApply(
            isFirst: boolean,
            prevValue: unknown,
            generator: CloneableGenerator<unknown, TReturn, unknown>
        ): MakeType<TMonadTypeId, TReturn> {
            const result = isFirst
                ? generator.next()
                : generator.next(prevValue);

            if (result.done) {
                return monadFactory(options.toCtorArg(result.value));
            }

            return options.flatMap(result.value as MakeType<TMonadTypeId, unknown>, (value: unknown) => {
                return recursiveApply(false, value, generator.clone());
            })
        }

        return recursiveApply(true, undefined!, generator.clone() as any);
    }
}

function makeMonadFactory<TMonadTypeId extends TypeIds>(options: MakeMonadOptions<TMonadTypeId>) {
    return function make<
        TValue,
        TMonad extends MakeType<TMonadTypeId, TValue>
    >(value: GetMonadCtorArg<TMonad>): MakeType<TMonadTypeId, TValue> {
        function* makeGenerator(): Generator<TMonad, TValue, TValue> {
            const internalReturn = yield generator;
            return internalReturn;
        }

        const generator = makeGenerator() as any as TMonad;
        generator["@@monad/type"] = options.typeId;
        Object.assign(generator, options.makePayload(value));
        return generator;
    }
}

export function makeMonad<TMonadTypeId extends TypeIds>(
    options: MakeMonadOptions<TMonadTypeId>
): BuiltMonad<TMonadTypeId> {
    return {
        ...options,
        run: makeMonadRunner(options),
        make: makeMonadFactory(options)
    }
}
