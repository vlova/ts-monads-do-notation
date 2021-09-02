# What this about

Typed do-notation for monad-like stuff!

How it looks like:

```typescript
const listResult = List.run(
    function* () {
        const base = yield* List.make([1, 2]); // inferred `base: number`
        const multiplier = yield* List.make([10]); // inferred `multiplier: number`
        const suffix = yield* List.make(['a', 'b']); // inferred `suffix: string`
        return (base * multiplier + '' + suffix);
    }); // inferred `listResult: List<string>`

expect(listResult.get()).to.deep.equal(['10a', '10b', '20a', '20b']);
```

# How it works (basics)

## Monad definition

Each monad instance implements an interface:

```typescript
type List<TElement>
    = Generator<
        …,
        TElement,
        TElement
    >
    & ListPayload<TElement>

// Something that allows to perform `flatMap` on `List<>`
// It can be actually `flatMap`, but for sugar reasons I prefer to provide `get`
type ListPayload<TElement> = {
    get: () => TElement[]
};
```

Because `List<>` extends `Generator<>`, typescript can infer type for operation `yield* monadInstance`.

## How to create a monad

It's tricky. Let's see code:

```typescript
function makeList<TElement>(list: TElement[]): List<TElement> {
    function* makeGenerator(): Generator<List<TElement>, TElement, TElement> {
        const internalReturn = yield generator;
        return internalReturn;
    }

    const generator = makeGenerator() as List<TElement>;
    generator.get = () => list;

    return generator;
}
```

What happens here:
1. We build a generator:
   1. Which yields monad instance - so external code (monad runner) can perform `get` operation on monad instance
   2. Then, the generator gets value from the external code (monad runner). For instance `makeList([1,2,3])` value will be `1`, then `2`, then `3`.
   3. And it returns value, so it can be stored in variable: `const base = yield* List.make([1, 2])`
2. And we attach some metadata (`get`) to that generator so external code (monad runner) can understand which values to pass into the generator.

As you see, this generator doesn't perform any real work. So why do we need it? Because otherwise, we can't help typescript to infer types!

## How monads are runed

Here is the code. It's complex, but I will explain all of that:

```typescript
return function runList<TReturn>(
    generatorFunc: () => Generator<
        List<Unknown>,
        TReturn,
        unknown
    >
): List<TReturn> {
    const generator = cloneableGenerator(generatorFunc)();

    function recursiveApply(
        isFirst: boolean,
        prevValue: unknown,
        generator: CloneableGenerator<unknown, TReturn, unknown>
    ): List<TReturn> {
        const result = isFirst
            ? generator.next()
            : generator.next(prevValue);

        if (result.done) {
            return makeList([result.value]);
        }

        return flatMapList(
            result.value as any,
            (value: unknown) => {
                return recursiveApply(false, value, generator.clone());
            })
    }

    return recursiveApply(true, undefined!, generator as any);
}
```

So, the user code is a generator. That generator yields monad instances. Like that:

```typescript
const base = yield* List.make([1, 2]);
```

When we perform the first call `generator.next()`, we get the following result:
```typescript
{
    done: false,
    value: List.make([1, 2])
}
```

Now when we have a monad instance, we can run `flatMapList` on it.
- Inside of `flatMapList`, we execute our runner with a cloned generator.
- `flatMapList` will call our runner several times with all values in the list (`1` and `2`)
- and the runner will pass value (`1` and `2`) to a generator via `generator.next(prevValue)`

Suddenly we will get to the final line of our generator.

```typescript
return (base * multiplier + '' + suffix).toString();
```

So when we call `generator.next()`, we will get the following result

```typescript
{
    done: true,
    value: '10a'
}
```

Now we need to wrap this value into List-monad.
Otherwise, `flatMapList` can't process our return.

# Advanced details

## Caveat caused by cloneable generator

There is no native way to clone the generator in javascript.
So we apply a funny trick to simulate that.

Each time when a user-code generator yields some value, we store it in history.
Each time when we clone the generator, we reply history on the user-code generator.
So the same code is executed many times.


For illustration let's take next code:
```typescript
let firstLineRuns = 0; let secondLineRuns = 0; let thirdLineRuns = 0;
const listResult = List.run(
    function* () {
        firstLineRuns++; const base = yield* List.make([1, 2]);
        secondLineRuns++; const multiplier = yield* List.make([10, 20]);
        thirdLineRuns++; return (base * multiplier).toString();
    });

console.log({ firstLineRuns, secondLineRuns, thirdLineRuns });
```

And here is the output of the code:
```
{
    firstLineRuns: 7,
    secondLineRuns: 6,
    thirdLineRuns: 4
}
```

But it's fine. It is still good enough if you:
1. Don't put side-effects into generators
2. Don't run heavy computations.

Maybe this problem can be reduced by:
1. Writing lint rule that denies side-effects in monad runners
2. Providing a way to cache heavy computations (like `React.useMemo`).

I took sources of the cloneable generator from the `redux-saga` package.
There is also [immutagen](https://github.com/pelotom/immutagen) package. It does the same work but in another way.

## Monad generator

If you open `src/monads/list`, you will see next code:

```typescript
export const List: BuiltMonad<ListTypeId> = makeMonad({
    typeId: ListTypeId,

    toCtorArg: <T>(value: T) => [value],

    makePayload: <T>(value: T[]) => ({
        get: () => value
    }),

    flatMap: (monad, selector) => {
        return List.make(monad.get().flatMap(value => selector(value).get()));
    }
});
```

This is because I universalized the creation of monads.
To do that, I need higher-kinded-polymorphism.
You can see explanation & sample here: [vlova/ts-higher-kinded-polymorphism-sample](https://github.com/vlova/ts-higher-kinded-polymorphism-sample)

Right now, this works only for monads with only one type argument.