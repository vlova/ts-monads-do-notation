import { cloneableGenerator, CloneableGenerator } from "./cloneableGenerator";

function runState<TIn, TReturn>(
    generatorFunc: () => Generator<
        StateMonadInstance<TIn, unknown>,
        TReturn,
        unknown
    >
): StateMonadInstance<TIn, TReturn> {
    const generator = cloneableGenerator(generatorFunc)();

    function recursiveApply(
        isFirst: boolean,
        prevValue: any,
        generator: CloneableGenerator<unknown, TReturn, unknown>
    ): StateMonadInstance<TIn, TReturn> {
        const result = isFirst
            ? generator.next()
            : generator.next(prevValue);

        if (result.done) {
            return updateState((_discardedState) => result.value);
        }

        return flatMap(result.value as any, (value: any) => {
            return recursiveApply(false, value, generator.clone());
        })
    }

    return recursiveApply(true, undefined!, generator.clone() as any);
}


function flatMap<TInitialState, TIntermediateState, TResultState>(
    monad: StateMonadInstance<TInitialState, TIntermediateState>,
    selector: (value: TIntermediateState) => StateMonadInstance<TIntermediateState, TResultState>
): StateMonadInstance<TInitialState, TResultState> {
    return updateState<TInitialState, TResultState>(initialState => {
        const intermediateState = monad.get(initialState);
        return selector(intermediateState).get(intermediateState);
    })
}

function updateState<TIn, TOut>(getNewState: (state: TIn) => TOut): StateMonadInstance<TIn, TOut> {
    function* makeGenerator(): Generator<StateMonadInstance<TIn, TOut>, TOut, TOut> {
        const internalReturn = yield generator;
        return internalReturn;
    }

    const generator = makeGenerator() as StateMonadInstance<TIn, TOut>;
    generator["@@monad/type"] = 'state';
    generator.get = (state: TIn) => getNewState(state);

    return generator;
}

type StateMonadInstance<TIn, TOut>
    = Generator<StateMonadInstance<TIn, TOut>, TOut, TOut> & {
        '@@monad/type': 'state',
        get: (state: TIn) => TOut;
    };

function getState<TState>(): StateMonadInstance<TState, TState> {
    return updateState(state => state);
}

export const StateLike = {
    run: runState,
    update: updateState,
    get: getState,
}