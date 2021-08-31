import { expect } from "chai";
import { maybe } from ".";
import { task } from ".";
import { list } from ".";
import { stateLike } from ".";


describe('Monads', () => {
    describe('Maybe', () => {
        it('maybe monad returns result', () => {
            const maybeResult = maybe.run(
                function* () {
                    const value1 = yield* maybe.make(1);
                    const value2 = yield* maybe.make('2');
                    return (value1 + '' + value2).toString();
                });

            expect(maybeResult.get()).to.equal('12');
        })

        it('maybe monad returns undefined', () => {
            const maybeResult = maybe.run(
                function* () {
                    const value1 = yield* maybe.make(1);
                    const value2 = yield* maybe.make(undefined);
                    return (value1 + '' + value2).toString();
                });

            expect(maybeResult.get()).to.equal(undefined);
        })
    })


    describe('Task', () => {
        it('task monad returns result', async () => {
            const taskResult = task.run(
                function* () {
                    const value1 = yield* task.make(Promise.resolve(1));
                    const value2 = yield* task.make('2');
                    return (value1 + '' + value2).toString();
                });

            expect(await taskResult.get()).to.equal('12');
        });
    })

    describe('List', () => {
        it('list monad returns result', async () => {
            const listResult = list.run(
                function* () {
                    const base = yield* list.make([1, 2]);
                    const multiplier = yield* list.make([10]);
                    const suffix = yield* list.make(['a', 'b']);
                    return (base * multiplier + '' + suffix).toString();
                });

            expect(listResult.get()).to.deep.equal(['10a', '10b', '20a', '20b']);
        });
    })

    describe('State-like', () => {
        it('State-like monad returns result', async () => {
            const push = (value: number) => stateLike.update((col: number[]) => [...col, value]);

            const stateResult = stateLike.run(
                function* () {
                    yield* push(1);
                    yield* push(2);
                    const [a, b, c] = yield* stateLike.get<number[]>();
                    return (a + b + (c ?? 0));
                });

            expect(stateResult.get([0])).to.equal(3);
            expect(stateResult.get([1])).to.equal(4);
        });
    })
});