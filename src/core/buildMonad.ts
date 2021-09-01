import { CloneableGenerator, cloneableGenerator } from "../utils/cloneableGenerator";
import { MakeType, TypeIds } from "../utils/hkt";
import { BuiltMonad, GetMonadCtorArg, GetMonadPayload } from "./monadTypes";

export interface MakeMonadOptions<TMonadUri extends TypeIds>
    extends Pick<BuiltMonad<TMonadUri>, 'URI' | 'flatMap'> {

    readonly toCtorArg: <TValue>(singleValue: TValue) => GetMonadCtorArg<MakeType<TMonadUri, TValue>>,

    readonly makePayload: <A>(arg: GetMonadCtorArg<MakeType<TMonadUri, A>>)
        => GetMonadPayload<MakeType<TMonadUri, A>>;
}

function makeMonadRunner<URI extends TypeIds>(options: MakeMonadOptions<URI>) {
    return function run<TReturn>(
        generatorFunc: () => Generator<
            MakeType<URI, unknown>,
            TReturn,
            unknown
        >
    ): MakeType<URI, TReturn> {
        const generator = cloneableGenerator(generatorFunc)();

        function recursiveApply(
            isFirst: boolean,
            prevValue: unknown,
            generator: CloneableGenerator<unknown, TReturn, unknown>
        ): MakeType<URI, TReturn> {
            const result = isFirst
                ? generator.next()
                : generator.next(prevValue);

            if (result.done) {
                return makeMonadFactory(options)(options.toCtorArg(result.value));
            }

            return options.flatMap(result.value as MakeType<URI, unknown>, (value: unknown) => {
                return recursiveApply(false, value, generator.clone());
            })
        }

        return recursiveApply(true, undefined!, generator.clone() as any);
    }
}

function makeMonadFactory<TMonadUri extends TypeIds>(options: MakeMonadOptions<TMonadUri>) {
    return function make<
        TValue,
        TMonad extends MakeType<TMonadUri, TValue>
    >(value: GetMonadCtorArg<TMonad>): MakeType<TMonadUri, TValue> {
        function* makeGenerator(): Generator<TMonad, TValue, TValue> {
            const internalReturn = yield generator;
            return internalReturn;
        }

        const generator = makeGenerator() as any as TMonad;
        generator["@@monad/type"] = options.URI;
        Object.assign(generator, options.makePayload(value));
        return generator;
    }
}

export function makeMonad<TMonadUri extends TypeIds>(
    options: MakeMonadOptions<TMonadUri>
): BuiltMonad<TMonadUri> {
    return {
        ...options,
        run: makeMonadRunner(options),
        make: makeMonadFactory(options)
    }
}
