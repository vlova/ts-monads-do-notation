import { CloneableGenerator, cloneableGenerator } from "./cloneableGenerator";
import { Kind, URIS } from "./hkt";
import { BuiltMonad, GetMonadCtorArg, GetMonadPayload } from "./monadTypes";

export interface MakeMonadOptions<TMonadUri extends URIS>
    extends Pick<BuiltMonad<TMonadUri>, 'URI' | 'flatMap'> {

    readonly toCtorArg: <TValue>(singleValue: TValue) => GetMonadCtorArg<Kind<TMonadUri, TValue>>,

    readonly makePayload: <A>(arg: GetMonadCtorArg<Kind<TMonadUri, A>>)
        => GetMonadPayload<Kind<TMonadUri, A>>;
}

function makeMonadRunner<URI extends URIS>(options: MakeMonadOptions<URI>) {
    return function run<TReturn>(
        generatorFunc: () => Generator<
            Kind<URI, unknown>,
            TReturn,
            unknown
        >
    ): Kind<URI, TReturn> {
        const generator = cloneableGenerator(generatorFunc)();

        function recursiveApply(
            isFirst: boolean,
            prevValue: unknown,
            generator: CloneableGenerator<unknown, TReturn, unknown>
        ): Kind<URI, TReturn> {
            const result = isFirst
                ? generator.next()
                : generator.next(prevValue);

            if (result.done) {
                return makeMonadFactory(options)(options.toCtorArg(result.value));
            }

            return options.flatMap(result.value as Kind<URI, unknown>, (value: unknown) => {
                return recursiveApply(false, value, generator.clone());
            })
        }

        return recursiveApply(true, undefined!, generator.clone() as any);
    }
}

function makeMonadFactory<TMonadUri extends URIS>(options: MakeMonadOptions<TMonadUri>) {
    return function make<
        TValue,
        TMonad extends Kind<TMonadUri, TValue>
    >(value: GetMonadCtorArg<TMonad>): Kind<TMonadUri, TValue> {
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

export function makeMonad<TMonadUri extends URIS>(options: MakeMonadOptions<TMonadUri>): BuiltMonad<TMonadUri> {
    return {
        ...options,
        run: makeMonadRunner(options),
        make: makeMonadFactory(options)
    }
}
