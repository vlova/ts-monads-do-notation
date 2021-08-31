import { expect } from "chai";
import { Maybe } from ".";
import { Task } from ".";
import { List } from ".";
import { StateLike } from ".";


describe('Monads', () => {
    describe('Maybe', () => {
        it('maybe monad returns result', () => {
            const maybeResult = Maybe.run(
                function* () {
                    const value1 = yield* Maybe.make(1);
                    const value2 = yield* Maybe.make('2');
                    return (value1 + '' + value2).toString();
                });

            expect(maybeResult.get()).to.equal('12');
        })

        it('maybe monad returns undefined', () => {
            const maybeResult = Maybe.run(
                function* () {
                    const value1 = yield* Maybe.make(10);
                    const value2 = yield* Maybe.make(undefined);
                    return (value1 + '' + value2).toString();
                });

            expect(maybeResult.get()).to.equal(undefined);
        })
    })


    describe('Task', () => {
        it('task monad returns result', async () => {
            const taskResult = Task.run(
                function* () {
                    const value1 = yield* Task.make(Promise.resolve(1));
                    const value2 = yield* Task.make(new Promise(resolve => setTimeout(() => resolve('2'), 10)));
                    return (value1 + '' + value2).toString();
                });

            expect(await taskResult.get()).to.equal('12');
        });
    })

    describe('List', () => {
        it('list monad returns result', async () => {
            const listResult = List.run(
                function* () {
                    const base = yield* List.make([1, 2]);
                    const multiplier = yield* List.make([10]);
                    const suffix = yield* List.make(['a', 'b']);
                    return (base * multiplier + '' + suffix).toString();
                });

            expect(listResult.get()).to.deep.equal(['10a', '10b', '20a', '20b']);
        });
    })

    describe('State-like', () => {
        it('State-like monad returns result', async () => {
            const push = (value: number) => StateLike.update((col: number[]) => [...col, value]);

            const stateResult = StateLike.run(
                function* () {
                    yield* push(1);
                    yield* push(2);
                    const [a, b, c] = yield* StateLike.get<number[]>();
                    return (a + b + (c ?? 0));
                });

            expect(stateResult.get([0])).to.equal(3);
            expect(stateResult.get([1])).to.equal(4);
        });
    })
});